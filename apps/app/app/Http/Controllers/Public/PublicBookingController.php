<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Exceptions\SlotTakenException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Services\Booking\AvailabilityService;
use App\Services\Booking\BookingService;
use App\Services\Catalog\PricingService;
use App\Services\Payment\PaymentService;
use App\Support\Messages;
use App\Support\VietQr;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                    'start_at' => CarbonImmutable::parse($data['start_at']),
                    'end_at' => CarbonImmutable::parse($data['end_at']),
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
        $booking = Booking::with(['slots.court', 'customer'])->where('tenant_id', $tenant->id)->where('code', $code)->firstOrFail();

        // Verify the security token — prevents casual booking-code enumeration.
        $token = $request->query('token');
        $expected = hash_hmac('sha256', "{$code}:{$booking->customer->code}", config('app.key'));
        abort_unless($token && hash_equals($expected, $token), 403);
        $payment = Payment::where('booking_id', $booking->id)->where('method', 'vietqr')->first();
        $config = TenantBankConfig::where('tenant_id', $tenant->id)->where('active', true)->first();

        $qr = ($payment && $config)
            ? VietQr::payload($config->bank_bin, $config->account_number, (int) $payment->amount, $booking->code)
            : null;

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
                'customer_name' => $booking->customer->name ?? '',
                'customer_code' => $booking->customer->code ?? '',
                'created_at' => $booking->created_at->toISOString(),
                'slots' => $booking->slots->map(fn ($s) => [
                    'court_name' => $s->court->name ?? '',
                    'start_at' => $s->start_at->toISOString(),
                    'end_at' => $s->end_at->toISOString(),
                    'price' => (int) $s->price_snapshot,
                ]),
            ],
            'customer_code' => $booking->customer->code ?? '',
            'qr' => $qr,
            'account' => $config ? ['number' => $config->account_number, 'name' => $config->account_name, 'bank' => $config->bank_name ?? ''] : null,
            'token' => $token,
        ]);
    }

    /**
     * Public customer booking history — accessible by customer code (e.g. /book/my-venue/cus-KH0001).
     * No auth required; the customer code itself is the lookup key.
     */
    public function customerHistory(Tenant $tenant, string $code): Response
    {
        abort_unless($tenant->isActive(), 404);

        $customer = Customer::where('tenant_id', $tenant->id)->where('code', $code)->firstOrFail();

        $bookings = $customer->bookings()
            ->where('tenant_id', $tenant->id)
            ->with(['slots.court'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Public/Booking/CustomerHistory', [
            'tenant' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'settings' => $tenant->settings ?? [],
                'address' => $tenant->address,
                'phone' => $tenant->phone,
            ],
            'customer' => [
                'code' => $customer->code,
                'name' => $customer->name,
                'phone' => $customer->phone,
            ],
            'bookings' => $bookings->map(fn (Booking $b) => [
                'code' => $b->code,
                'status' => $b->status->value,
                'total' => (int) $b->total_amount,
                'deposit' => (int) $b->deposit_amount,
                'created_at' => $b->created_at->toISOString(),
                'slots' => $b->slots->map(fn ($s) => [
                    'court_name' => $s->court->name ?? '',
                    'start_at' => $s->start_at->toISOString(),
                    'end_at' => $s->end_at->toISOString(),
                    'price' => (int) $s->price_snapshot,
                ]),
            ]),
        ]);
    }
}
