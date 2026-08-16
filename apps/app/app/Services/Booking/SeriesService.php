<?php

declare(strict_types=1);

namespace App\Services\Booking;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\SeriesStatus;
use App\Exceptions\SlotTakenException;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\RecurringSeries;
use App\Models\Tenant;
use App\Services\Catalog\PricingService;
use App\Support\RlsTenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Log;

/**
 * Weekly fixed bookings (đặt cố định). Price/deposit are snapshotted onto the series; each
 * occurrence is a normal booking held+confirmed through BookingService (one anti-overlap path).
 * A date whose slot is already taken is returned as a conflict — it never breaks the series
 * (docs/07 flow b). Occurrences are generated on a rolling 4-week horizon (docs/11 #5).
 */
class SeriesService
{
    public function __construct(
        private BookingService $bookings,
        private PricingService $pricing,
    ) {}

    /**
     * @param  array{customer_id:int, court_id:int, weekday:int, start_local:string, end_local:string,
     *   start_date:string, end_date:string, payment_mode:string, deposit_per_session?:int}  $params
     */
    public function create(Tenant $tenant, array $params): SeriesResult
    {
        // Wall-as-UTC (single-tz Phase 1): the venue tz is stored in the `tz` column for the future,
        // but slot digits are parsed NAIVELY so they align with AvailabilityService / BookingService,
        // which also parse without an offset (docs/11 #3).
        $tz = $tenant->timezone ?: 'Asia/Ho_Chi_Minh';

        $firstDate = $this->firstOccurrenceDate($params['start_date'], $params['end_date'], (int) $params['weekday']);
        $priceSnapshot = $this->pricing->resolve(
            $tenant->id,
            (int) $params['court_id'],
            CarbonImmutable::parse("{$firstDate} {$params['start_local']}"),
            CarbonImmutable::parse("{$firstDate} {$params['end_local']}"),
        );

        $series = RecurringSeries::forceCreate([
            'tenant_id' => $tenant->id,
            'customer_id' => $params['customer_id'],
            'court_id' => $params['court_id'],
            'weekday' => $params['weekday'],
            'start_local' => $params['start_local'],
            'end_local' => $params['end_local'],
            'tz' => $tz,
            'start_date' => $params['start_date'],
            'end_date' => $params['end_date'],
            'price_per_session_snapshot' => $priceSnapshot,
            'deposit_per_session' => $params['deposit_per_session'] ?? $priceSnapshot,
            'status' => SeriesStatus::Active,
        ]);

        [$generated, $conflicts] = $this->generateHorizon($tenant, $series);

        return new SeriesResult($series->fresh(), $generated, $conflicts);
    }

    /** Cancel ONE occurrence; the series and the other occurrences are untouched. */
    public function cancelOccurrence(Booking $booking): void
    {
        $this->bookings->cancel($booking, CancelReason::CustomerCancel);
    }

    /** Rolling-horizon job: generate newly-in-window occurrences for every active series. */
    public function extendHorizon(): int
    {
        $created = 0;

        // `tenants` has no RLS policy, so this enumeration is safe under the runtime role. Each
        // tenant's work runs inside `RlsTenantContext` so the RLS policy (tenant_id = app_current_tenant_id())
        // permits that tenant's rows — a single context-less query returns zero rows under RLS.
        Tenant::query()->select('id')->eachById(function (Tenant $tenant) use (&$created) {
            $created += RlsTenantContext::run($tenant->id, function (): int {
                $made = 0;

                RecurringSeries::query()
                    ->where('status', SeriesStatus::Active)
                    ->with('tenant')
                    ->eachById(function (RecurringSeries $series) use (&$made) {
                        if ($series->generated_through
                            && $series->generated_through->greaterThanOrEqualTo($series->end_date)) {
                            return; // fully generated
                        }
                        [$generated, $conflicts] = $this->generateHorizon($series->tenant, $series);
                        $made += count($generated);

                        // A conflicted date is a customer-visible missed session, not a no-op. The cursor
                        // stays behind it (see generateHorizon) so it is retried, but the owner must be
                        // able to see that it happened.
                        if ($conflicts !== []) {
                            Log::warning('Recurring series occurrence conflicted', [
                                'series_id' => $series->id,
                                'tenant_id' => $series->tenant_id,
                                'conflicts' => $conflicts,
                            ]);
                        }
                    });

                return $made;
            });
        });

        return $created;
    }

    /**
     * @return array{0: array<int, Booking>, 1: array<int, string>}
     */
    private function generateHorizon(Tenant $tenant, RecurringSeries $series): array
    {
        $tz = $series->tz;
        // Venue wall-clock "today" relabeled naive (wall-as-UTC), so it compares apples-to-apples
        // with the naively-parsed series window/date columns below.
        $today = CarbonImmutable::parse(CarbonImmutable::now($tz)->toDateString());
        $horizonEnd = $today->addWeeks((int) config('booking.series_horizon_weeks'));

        $startDate = CarbonImmutable::parse($series->start_date->toDateString());
        $from = $series->generated_through
            ? CarbonImmutable::parse($series->generated_through->toDateString())->addDay()
            : ($startDate->greaterThan($today) ? $startDate : $today);

        $seriesEnd = CarbonImmutable::parse($series->end_date->toDateString());
        $to = $horizonEnd->lessThan($seriesEnd) ? $horizonEnd : $seriesEnd;

        $generated = [];
        $conflicts = [];

        // Dates already materialised by an earlier run. The cursor parks before the first conflict
        // so conflicted dates get retried, which means later dates can be revisited — they must not
        // be booked twice.
        $existing = BookingSlot::query()
            ->where('booking_slots.tenant_id', $tenant->id)
            ->whereIn('booking_slots.booking_id', Booking::query()
                ->select('id')
                ->where('tenant_id', $tenant->id)
                ->where('series_id', $series->id)
                ->whereNotIn('status', [BookingStatus::Cancelled, BookingStatus::Expired]))
            ->pluck('start_at')
            ->map(fn ($startAt) => CarbonImmutable::parse((string) $startAt)->toDateString())
            ->flip();

        for ($cursor = $from; $cursor->lessThanOrEqualTo($to); $cursor = $cursor->addDay()) {
            if ($cursor->dayOfWeekIso !== $series->weekday) {
                continue;
            }

            $day = $cursor->toDateString();

            if ($existing->has($day)) {
                continue;
            }

            try {
                $booking = $this->bookings->createHold($tenant, [
                    'customer_id' => $series->customer_id,
                    'channel' => BookingChannel::OwnerManual->value,
                    'payment_mode' => 'full',
                    'series_id' => $series->id,
                    'deposit_amount' => $series->deposit_per_session,
                    'slots' => [[
                        'court_id' => $series->court_id,
                        'start_at' => CarbonImmutable::parse("{$day} {$series->start_local}"),
                        'end_at' => CarbonImmutable::parse("{$day} {$series->end_local}"),
                        'price_snapshot' => $series->price_per_session_snapshot,
                    ]],
                ]);
                // Owner-managed fixed booking → confirm immediately (committed, no TTL expiry).
                $this->bookings->confirmDeposit($booking);
                $generated[] = $booking;
            } catch (SlotTakenException) {
                $conflicts[] = $day;
            }
        }

        // The cursor may only advance over dates that are actually settled. Parking it before the
        // FIRST conflict keeps that date reachable on the next run, so a session lost to a
        // temporary clash is retried once the range frees up instead of being skipped forever.
        $generatedThrough = $conflicts === []
            ? $to
            : CarbonImmutable::parse($conflicts[0])->subDay();

        // Never move the cursor backwards past ground already covered.
        if ($series->generated_through === null
            || $generatedThrough->greaterThan(CarbonImmutable::parse($series->generated_through->toDateString()))) {
            $series->update(['generated_through' => $generatedThrough->toDateString()]);
        }

        return [$generated, $conflicts];
    }

    private function firstOccurrenceDate(string $startDate, string $endDate, int $weekday): string
    {
        $cursor = CarbonImmutable::parse($startDate);
        $end = CarbonImmutable::parse($endDate);

        while ($cursor->lessThanOrEqualTo($end)) {
            if ($cursor->dayOfWeekIso === $weekday) {
                return $cursor->toDateString();
            }
            $cursor = $cursor->addDay();
        }

        return $startDate;
    }
}
