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

        return Inertia::render('Public/Booking/Show', [
            'tenant' => ['name' => $tenant->name, 'slug' => $tenant->slug, 'settings' => $tenant->settings ?? []],
            'date' => $date->toDateString(),
            'courts' => $courts,
        ]);
    }

    public function hold(Tenant $tenant, Request $request): RedirectResponse
    {
        abort_unless($tenant->isActive(), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'court_id' => ['required', 'integer'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
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
        } catch (SlotTakenException $e) {
            return back()->with('error', $e->getMessage());
        }

        $this->payments->initDeposit($booking);

        return redirect()->route('public.booking.status', ['tenant' => $tenant->slug, 'code' => $booking->code]);
    }

    public function status(Tenant $tenant, string $code): Response
    {
        $booking = Booking::where('tenant_id', $tenant->id)->where('code', $code)->firstOrFail();
        $payment = Payment::where('booking_id', $booking->id)->where('method', 'vietqr')->first();
        $config = TenantBankConfig::where('tenant_id', $tenant->id)->where('active', true)->first();

        $qr = ($payment && $config)
            ? VietQr::payload($config->bank_bin, $config->account_number, (int) $payment->amount, $booking->code)
            : null;

        return Inertia::render('Public/Booking/Status', [
            'tenant' => ['name' => $tenant->name, 'slug' => $tenant->slug, 'settings' => $tenant->settings ?? []],
            'booking' => [
                'code' => $booking->code,
                'status' => $booking->status->value,
                'total' => (int) $booking->total_amount,
                'deposit' => (int) $booking->deposit_amount,
            ],
            'qr' => $qr,
            'account' => $config ? ['number' => $config->account_number, 'name' => $config->account_name] : null,
        ]);
    }
}
