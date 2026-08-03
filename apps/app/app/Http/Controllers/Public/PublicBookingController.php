<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Enums\CourtStatus;
use App\Exceptions\SlotTakenException;
use App\Http\Controllers\Controller;
use App\Models\Blackout;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Services\Booking\AvailabilityService;
use App\Services\Booking\BookingService;
use App\Services\Catalog\CatalogService;
use App\Services\Catalog\PricingService;
use App\Services\Payment\PaymentService;
use App\Support\Messages;
use App\Support\VietQr;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public, per-tenant booking page (resolved by slug — this is NOT the WorkingTenant manager
 * context). Ties availability (M3) → hold (M3) → VietQR deposit (M4) into one player flow.
 */
class PublicBookingController extends Controller
{
    public function __construct(
        private AvailabilityService $availability,
        private BookingService $bookings,
        private PaymentService $payments,
        private PricingService $pricing,
        private CatalogService $catalog,
    ) {}

    public function show(Tenant $tenant, Request $request): Response
    {
        abort_unless($tenant->isActive(), 404);

        // Wall-as-UTC: default to the venue wall-clock day; an invalid ?date= falls back to it
        // instead of 500-ing on garbage input.
        $date = CarbonImmutable::now($tenant->timezone);
        if ($request->filled('date')) {
            try {
                $date = CarbonImmutable::parse($request->string('date')->value());
            } catch (\Throwable) {
                $date = CarbonImmutable::now($tenant->timezone);
            }
        }

        $courts = $this->availability->search($tenant->id, $date, null, 60);

        $courts = array_map(function (array $court) use ($tenant) {
            $court['free'] = array_map(function (array $slot) use ($tenant, $court) {
                $start = CarbonImmutable::parse($slot['start']);
                $end = CarbonImmutable::parse($slot['end']);
                try {
                    $price = $this->pricing->resolve($tenant->id, $court['court_id'], $start, $end);
                } catch (\RuntimeException) {
                    $price = 0;
                }
                $isPeak = $price > 100000;

                return [
                    'start' => $slot['start'],
                    'end' => $slot['end'],
                    'price' => $price,
                    'peak' => $isPeak,
                ];
            }, $court['free']);

            return $court;
        }, $courts);

        // Fetch availability summary for ±3 days to disable date pills with no slots
        $dateAvailability = [];
        for ($i = -3; $i <= 3; $i++) {
            $checkDate = $date->addDays($i);
            $dayCourts = $this->availability->search($tenant->id, $checkDate, null, 60);
            $hasSlots = false;
            foreach ($dayCourts as $court) {
                if (! empty($court['free'])) {
                    $hasSlots = true;
                    break;
                }
            }
            $dateAvailability[$checkDate->toDateString()] = $hasSlots;
        }

        return Inertia::render('Public/Booking/Show', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'settings' => $tenant->settings ?? [],
                'address' => $tenant->address,
                'phone' => $tenant->phone,
                'email' => $tenant->email,
                'website' => $tenant->website,
                'lat' => $tenant->lat,
                'lng' => $tenant->lng,
                'description' => $tenant->description,
            ],
            'date' => $date->toDateString(),
            'courts' => $courts,
            'dateAvailability' => $dateAvailability,
        ]);
    }

    public function hold(Tenant $tenant, Request $request): RedirectResponse
    {
        abort_unless($tenant->isActive(), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^(\+?84|0)[2-9]\d{7,8}$/'],
            'court_id' => ['required', 'integer'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
        ], [
            'name.min' => 'Tên phải có ít nhất 2 ký tự.',
            'phone.regex' => 'Số điện thoại không hợp lệ (VD: 0912345678).',
        ]);

        $court = Court::where('tenant_id', $tenant->id)->where('id', $data['court_id'])->firstOrFail();
        $startAt = CarbonImmutable::parse($data['start_at']);
        $endAt = CarbonImmutable::parse($data['end_at']);
        $this->assertSlotIsBookable($tenant, $court, $startAt, $endAt);

        $customer = Customer::firstOrCreate(
            ['tenant_id' => $tenant->id, 'phone' => $data['phone']],
            ['name' => $data['name']],
        );

        try {
            $booking = $this->bookings->createHold($tenant, [
                'customer_id' => $customer->id,
                'channel' => 'zalo',
                'payment_mode' => 'deposit',
                'slots' => [[
                    'court_id' => $court->id,
                    'start_at' => $startAt,
                    'end_at' => $endAt,
                ]],
            ]);
        } catch (SlotTakenException) {
            return back()->with('error', Messages::error('booking', 'slot_taken'));
        }

        $this->payments->initDeposit($booking);

        // Generate HMAC token so the customer can securely view their booking status.
        $customer->refresh();
        $token = hash_hmac('sha256', "{$booking->code}:{$customer->code}", config('app.key'));

        return redirect()->route('public.booking.status', [
            'tenant' => $tenant->slug,
            'code' => $booking->code,
            'token' => $token,
        ]);
    }

    public function status(Tenant $tenant, string $code, Request $request): Response
    {
        $booking = Booking::with(['slots.court', 'customer', 'payments.refunds'])->where('tenant_id', $tenant->id)->where('code', $code)->firstOrFail();

        // Verify the security token — prevents casual booking-code enumeration.
        $token = $request->query('token');
        $expected = hash_hmac('sha256', "{$code}:{$booking->customer->code}", config('app.key'));
        abort_unless($token && hash_equals($expected, $token), 403);
        $payment = Payment::where('tenant_id', $tenant->id)->where('booking_id', $booking->id)->where('method', 'vietqr')->first();
        $config = TenantBankConfig::where('tenant_id', $tenant->id)->where('active', true)->first();
        $recipient = $payment?->recipient_bank_bin && $payment->recipient_account_number && $payment->recipient_account_name
            ? [
                'bank_bin' => $payment->recipient_bank_bin,
                'number' => $payment->recipient_account_number,
                'name' => $payment->recipient_account_name,
            ]
            : ($config ? ['bank_bin' => $config->bank_bin, 'number' => $config->account_number, 'name' => $config->account_name] : null);

        $qr = ($payment && $recipient)
            ? VietQr::payload($recipient['bank_bin'], $recipient['number'], (int) $payment->amount, $payment->memo_ref)
            : null;
        $refund = $booking->payments->flatMap->refunds
            ->first(fn ($refund) => $refund->reason->value === 'customer_cancel');

        return Inertia::render('Public/Booking/Status', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'settings' => $tenant->settings ?? [],
                'address' => $tenant->address,
                'phone' => $tenant->phone,
            ],
            'booking' => [
                'code' => $booking->code,
                'status' => $booking->status->value,
                'total' => (int) $booking->total_amount,
                'deposit' => (int) $booking->deposit_amount,
                'balance_due' => max(0, (int) $booking->total_amount - (int) $booking->deposit_amount),
                'hold_expires_at' => $booking->hold_expires_at?->toISOString(),
                'cancel_policy' => $this->publicCancellationPolicy($booking->cancel_policy_snapshot),
                'customer_name' => $booking->customer->name ?? '',
                'customer_code' => $booking->customer->code ?? '',
                'created_at' => $booking->created_at->toISOString(),
                'slots' => $booking->slots->map(fn ($s) => [
                    'court_name' => $s->court->name ?? '',
                    'start_at' => $s->start_at->toISOString(),
                    'end_at' => $s->end_at->toISOString(),
                    'price' => (int) $s->price_snapshot,
                ]),
                'refund' => $refund
                    ? [
                        'amount' => (int) $refund->amount,
                        'status' => $refund->status->value,
                    ]
                    : null,
            ],
            'customer_code' => $booking->customer->code ?? '',
            'qr' => $qr,
            'account' => $recipient ? ['number' => $recipient['number'], 'name' => $recipient['name'], 'bank' => ''] : null,
            'token' => $token,
        ]);
    }

    /**
     * Validate catalog admissibility only. Slot overlap remains exclusively enforced by the
     * database exclusion constraint in BookingService.
     */
    private function assertSlotIsBookable(Tenant $tenant, Court $court, CarbonImmutable $startAt, CarbonImmutable $endAt): void
    {
        if ($court->status !== CourtStatus::Active) {
            throw ValidationException::withMessages(['court_id' => 'Sân này hiện không nhận đặt chỗ.']);
        }

        if ($startAt->lessThanOrEqualTo(now($tenant->timezone))) {
            throw ValidationException::withMessages(['start_at' => 'Chỉ có thể đặt khung giờ trong tương lai.']);
        }

        if ($startAt->toDateString() !== $endAt->toDateString()
            || ! $endAt->equalTo($startAt->addHour())
            || $startAt->minute !== 0
            || $startAt->second !== 0
            || $endAt->second !== 0) {
            throw ValidationException::withMessages(['start_at' => 'Vui lòng chọn một khung giờ tròn 60 phút trong cùng ngày.']);
        }

        $withinOpeningWindow = collect($this->catalog->openingWindows($tenant->id, $court->id, $startAt))
            ->contains(function (array $window) use ($startAt, $endAt): bool {
                $open = CarbonImmutable::parse($startAt->toDateString().' '.$window['open']);
                $close = CarbonImmutable::parse($startAt->toDateString().' '.$window['close']);

                return $startAt->greaterThanOrEqualTo($open) && $endAt->lessThanOrEqualTo($close);
            });
        if (! $withinOpeningWindow) {
            throw ValidationException::withMessages(['start_at' => 'Khung giờ này nằm ngoài giờ hoạt động của sân.']);
        }

        $isBlackedOut = Blackout::query()
            ->where('tenant_id', $tenant->id)
            ->where(fn ($query) => $query->where('court_id', $court->id)->orWhereNull('court_id'))
            ->where('starts_at', '<', $endAt)
            ->where('ends_at', '>', $startAt)
            ->exists();
        if ($isBlackedOut) {
            throw ValidationException::withMessages(['start_at' => 'Khung giờ này đang tạm ngưng phục vụ.']);
        }
    }

    /** @param array<string, mixed> $policy */
    private function publicCancellationPolicy(array $policy): ?array
    {
        $hours = filter_var($policy['refund_before_hours'] ?? null, FILTER_VALIDATE_INT);
        $percentage = filter_var($policy['refund_pct'] ?? null, FILTER_VALIDATE_INT);

        if ($hours === false || $hours < 0 || $percentage === false || $percentage < 0 || $percentage > 100) {
            return null;
        }

        return [
            'refund_before_hours' => $hours,
            'refund_pct' => $percentage,
        ];
    }
}
