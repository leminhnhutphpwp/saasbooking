<?php

declare(strict_types=1);

namespace App\Services\Booking;

use App\Contracts\InventoryDriver;
use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\HoldStatus;
use App\Enums\PaymentStatus;
use App\Events\BookingCancelled;
use App\Events\BookingConfirmed;
use App\Exceptions\SlotTakenException;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Tenant;
use App\Services\Catalog\PricingService;
use App\Services\Payment\PaymentService;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * The ONLY concurrency chokepoint. Every path that holds a court+time — one-off, recurring,
 * owner walk-in — goes through here, inside ONE DB transaction, arbitrated by the exclusion
 * constraint via the InventoryDriver. No second anti-overlap path (docs/08 §3).
 *
 * BookingService owns the lifecycle + money (snapshots, state machine, events); the driver
 * owns the shape-specific concurrency.
 */
class BookingService
{
    public function __construct(
        private PricingService $pricing,
        private PaymentService $payments,
    ) {}

    /**
     * @param  array{customer_id:int, channel:string, payment_mode:string, series_id?:int|null,
     *   deposit_amount?:int, slots: array<int, array{court_id:int,
     *   start_at:CarbonInterface, end_at:CarbonInterface}>}  $params
     *
     * @throws SlotTakenException when a slot loses the race (→ 409)
     */
    public function createHold(Tenant $tenant, array $params): Booking
    {
        return DB::transaction(function () use ($tenant, $params) {
            $slots = [];
            $total = 0;

            foreach ($params['slots'] as $slot) {
                // Series occurrences pass a snapshotted price; one-offs resolve it live.
                $price = $slot['price_snapshot']
                    ?? $this->pricing->resolve($tenant->id, $slot['court_id'], $slot['start_at'], $slot['end_at']);
                $total += $price;
                $slots[] = [
                    'court_id' => $slot['court_id'],
                    'start_at' => $slot['start_at'],
                    'end_at' => $slot['end_at'],
                    'price_snapshot' => $price,
                ];
            }

            $booking = Booking::forceCreate([
                'tenant_id' => $tenant->id,
                'code' => $this->generateCode($tenant->id),
                'customer_id' => $params['customer_id'],
                'series_id' => $params['series_id'] ?? null,
                'status' => BookingStatus::PendingDeposit,
                'channel' => $params['channel'],
                'hold_expires_at' => now()->addMinutes((int) config('booking.hold_ttl_minutes')),
                'total_amount' => $total,
                'deposit_amount' => $params['deposit_amount'] ?? $total,   // M4 refines deposit policy
                'payment_mode' => $params['payment_mode'],
                'cancel_policy_snapshot' => $tenant->cancel_policy ?? ['refund_before_hours' => 24, 'refund_pct' => 100],
            ]);

            $this->driverFor($tenant)->hold($booking, $slots);   // throws SlotTakenException on 23P01

            return $booking;
        });
    }

    public function release(Booking $booking): void
    {
        DB::transaction(fn () => $this->driverFor($booking->tenant)->release($booking));
    }

    /**
     * @throws SlotTakenException when a concurrent expire+re-hold steals the range between the
     *                            'held' check and the commit UPDATE — the exclusion constraint (23P01) is the arbiter, so
     *                            the reconcile caller can route to orphaned+refund instead of a 500 (docs/07 a, finding #5).
     */
    public function confirmDeposit(Booking $booking): void
    {
        try {
            DB::transaction(function () use ($booking) {
                $booking = Booking::query()->lockForUpdate()->findOrFail($booking->id);

                if ($booking->status === BookingStatus::Confirmed) {
                    return;
                }

                if (! in_array($booking->status, [BookingStatus::PendingDeposit, BookingStatus::Expired], true)) {
                    throw new RuntimeException("Booking [{$booking->id}] cannot be confirmed from [{$booking->status->value}].");
                }

                $booking->forceFill(['status' => BookingStatus::Confirmed, 'hold_expires_at' => null])->save();
                $this->driverFor($booking->tenant)->commit($booking);   // UPDATE hold_status='committed' → may raise 23P01
                event(new BookingConfirmed($booking));
            });
        } catch (QueryException $e) {
            // The savepoint has already rolled back the Confirmed update; surface the lost race as
            // the canonical SlotTakenException rather than leaking a raw DB error.
            if ($e->getCode() === '23P01') {
                throw new SlotTakenException;
            }
            throw $e;
        }
    }

    /** Payment arrived but the slot was already lost — refund is created in M4 (payment). */
    public function markPaymentOrphaned(Booking $booking): void
    {
        DB::transaction(function () use ($booking) {
            $booking = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            if (! in_array($booking->status, [BookingStatus::PendingDeposit, BookingStatus::Expired], true)) {
                return;
            }

            $this->driverFor($booking->tenant)->release($booking);
            $booking->forceFill(['status' => BookingStatus::Cancelled, 'hold_expires_at' => null])->save();
        });
    }

    /**
     * Cancel once and, where the immutable snapshot permits it, request a manual refund against
     * the matched deposit ledger row. The caller never changes a payment amount.
     */
    public function cancel(Booking $booking, CancelReason $reason): void
    {
        DB::transaction(function () use ($booking, $reason) {
            $booking = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            if (! in_array($booking->status, [BookingStatus::PendingDeposit, BookingStatus::Confirmed], true)) {
                return;
            }

            $this->driverFor($booking->tenant)->release($booking);
            $booking->forceFill(['status' => BookingStatus::Cancelled, 'hold_expires_at' => null])->save();

            $payment = $booking->payments()
                ->where('tenant_id', $booking->tenant_id)
                ->where('status', PaymentStatus::Matched)
                ->lockForUpdate()
                ->first();
            $amount = $this->refundAmount($booking);
            if ($payment !== null && $amount > 0) {
                $this->payments->requestRefund($payment, min($amount, (int) $payment->amount), $reason);
            }

            event(new BookingCancelled($booking));
        });
    }

    public function markNoShow(Booking $booking): void
    {
        DB::transaction(
            fn () => $booking->forceFill(['status' => BookingStatus::NoShow])->save()
        );
    }

    /**
     * Can a paying booking still take its court+time? Drives the 3 reconcile branches (docs/07 a):
     *  - 'held'     — slots still holding/committed (paid within TTL) → confirm.
     *  - 'regained' — slots were released but re-held (grace) → confirm.
     *  - 'lost'     — the range is now taken by someone else → orphaned + refund.
     * The exclusion constraint is the arbiter of the re-hold, never a check-then-act.
     */
    public function secureForPayment(Booking $booking): string
    {
        // Lock this booking's slot rows for the duration of the reconcile transaction so a
        // concurrent ExpireStaleHolds cannot release + let another booking re-hold them between the
        // 'held' decision below and confirmDeposit's commit (finding #5). The EXCLUDE constraint
        // stays the only anti-overlap arbiter — this only pins THIS booking's own rows.
        $slots = $booking->slots()->lockForUpdate()->get();

        $stillActive = $slots->contains(
            fn (BookingSlot $s) => in_array($s->hold_status, [HoldStatus::Holding, HoldStatus::Committed], true)
        );
        if ($stillActive) {
            return 'held';
        }

        // All released — attempt to re-acquire in a savepoint; 23P01 means the range was lost.
        try {
            DB::transaction(fn () => $booking->slots()->update(['hold_status' => HoldStatus::Holding]));

            return 'regained';
        } catch (QueryException $e) {
            if ($e->getCode() === '23P01') {
                return 'lost';
            }
            throw $e;
        }
    }

    /** Sweeper (ExpireStaleHolds job): expire pending holds past TTL and free their slots. */
    public function expireStaleHolds(): int
    {
        $expired = 0;

        Booking::query()
            ->where('status', BookingStatus::PendingDeposit)
            ->whereNotNull('hold_expires_at')
            ->where('hold_expires_at', '<', now())
            ->eachById(function (Booking $booking) use (&$expired) {
                if ($this->expireStaleHold($booking->id)) {
                    $expired++;
                }
            });

        return $expired;
    }

    /** Lock and re-check after candidate selection so settlement can never be undone by expiry. */
    private function expireStaleHold(int $bookingId): bool
    {
        return DB::transaction(function () use ($bookingId): bool {
            $booking = Booking::query()->lockForUpdate()->find($bookingId);

            if ($booking === null
                || $booking->status !== BookingStatus::PendingDeposit
                || $booking->hold_expires_at === null
                || ! $booking->hold_expires_at->isPast()) {
                return false;
            }

            $this->driverFor($booking->tenant)->release($booking);
            $booking->forceFill(['status' => BookingStatus::Expired])->save();

            return true;
        });
    }

    private function driverFor(Tenant $tenant): InventoryDriver
    {
        $vertical = $tenant->vertical ?: config('booking.default_vertical');
        $mode = config("booking.verticals.{$vertical}.mode");

        // Fall back to default_vertical if the tenant's vertical isn't registered
        if (! $mode) {
            $vertical = config('booking.default_vertical');
            $mode = config("booking.verticals.{$vertical}.mode");
        }

        $class = $mode ? config("booking.modes.{$mode}") : null;

        if (! $class || ! class_exists($class)) {
            throw new RuntimeException("No inventory driver registered for vertical [{$vertical}] mode [{$mode}].");
        }

        return app($class);
    }

    /** Calculate from the historical policy only; never read current tenant configuration. */
    private function refundAmount(Booking $booking): int
    {
        $policy = $booking->cancel_policy_snapshot;
        $hours = filter_var($policy['refund_before_hours'] ?? null, FILTER_VALIDATE_INT);
        $percentage = filter_var($policy['refund_pct'] ?? null, FILTER_VALIDATE_INT);
        $firstSlot = $booking->slots()->orderBy('start_at')->first(['start_at']);

        if ($hours === false || $hours < 0 || $percentage === false || $percentage < 0 || $firstSlot === null) {
            return 0;
        }

        $eligible = now()->lessThanOrEqualTo($firstSlot->start_at->subHours($hours));
        if (! $eligible) {
            return 0;
        }

        return (int) intdiv((int) $booking->deposit_amount * min($percentage, 100), 100);
    }

    private function generateCode(int $tenantId): string
    {
        do {
            $code = 'SAN-'.strtoupper(Str::random(5));
        } while (Booking::where('tenant_id', $tenantId)->where('code', $code)->exists());

        return $code;
    }
}
