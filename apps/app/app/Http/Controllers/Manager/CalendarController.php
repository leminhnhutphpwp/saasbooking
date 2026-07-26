<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\BookingChannel;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Exceptions\SlotTakenException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Tenant;
use App\Services\Booking\BookingService;
use App\Services\Catalog\PricingService;
use App\Support\Messages;
use App\Support\WorkingTenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

/**
 * Owner calendar: today's bookings per court + walk-in (cash) booking. Walk-ins are confirmed
 * immediately (cash, no VietQR). Everything scoped by WorkingTenant.
 */
class CalendarController extends Controller
{
    public function __construct(
        private BookingService $bookings,
        private PricingService $pricing,
    ) {}

    public function index(Request $request): Response
    {
        $tenantId = (int) WorkingTenant::id($request);
        $tenant = Tenant::findOrFail($tenantId);

        // Wall-as-UTC (single-tz Phase 1): "today" and the day bounds reference the VENUE wall-clock
        // day (slots are stored naive/wall-clock), never real UTC. An invalid ?date= falls back to
        // the venue's today instead of 500-ing.
        $venueToday = CarbonImmutable::now($tenant->timezone)->toDateString();
        $dateString = $venueToday;
        if ($request->filled('date')) {
            try {
                $dateString = CarbonImmutable::parse($request->string('date')->value())->toDateString();
            } catch (\Throwable) {
                $dateString = $venueToday;
            }
        }

        $dayStart = CarbonImmutable::parse($dateString.' 00:00:00');
        $dayEnd = $dayStart->addDay();

        $bookings = Booking::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('slots', fn ($q) => $q->where('start_at', '>=', $dayStart)->where('start_at', '<', $dayEnd))
            ->with(['customer', 'slots.court'])
            ->get()
            ->flatMap(fn (Booking $b) => $b->slots->map(fn ($s) => [
                'code' => $b->code,
                'status' => $b->status->value,
                'channel' => $b->channel->value,
                'court_id' => $s->court_id,
                'court' => $s->court?->name,
                'customer' => $b->customer?->name,
                'phone' => $b->customer?->phone,
                'start' => $s->start_at->toIso8601String(),
                'end' => $s->end_at->toIso8601String(),
            ]))
            ->sortBy('start')
            ->values();

        // Generate time slots 05:00–23:00 (30-min intervals) as the venue's default range.
        $timeSlots = [];
        for ($h = 5; $h < 23; $h++) {
            for ($m = 0; $m < 60; $m += 30) {
                $timeSlots[] = sprintf('%02d:%02d', $h, $m);
            }
        }

        $courts = Court::forTenant($tenantId)->where('status', 'active')->orderBy('name')
            ->get(['id', 'name'])
            ->map(function (Court $court) use ($dateString, $tenantId, $timeSlots) {
                $prices = [];
                foreach ($timeSlots as $time) {
                    $start = CarbonImmutable::parse("{$dateString} {$time}:00");
                    try {
                        $prices[$time] = $this->pricing->resolve($tenantId, $court->id, $start, $start->addMinutes(30));
                    } catch (RuntimeException) {
                        $prices[$time] = null;
                    }
                }

                return ['id' => $court->id, 'name' => $court->name, 'prices' => $prices];
            });

        return Inertia::render('Manager/Calendar/Index', [
            'date' => $dateString,
            'bookings' => $bookings,
            'courts' => $courts,
            'timeSlots' => $timeSlots,
        ]);
    }

    public function storeWalkIn(Request $request): RedirectResponse
    {
        $tenantId = (int) WorkingTenant::id($request);
        $tenant = Tenant::findOrFail($tenantId);
        abort_unless($tenant->id === $tenantId, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^(\+?84|0)[2-9]\d{7,8}$/'],
            'court_id' => ['required', 'integer', Rule::exists('courts', 'id')->where('tenant_id', $tenantId)],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
        ], [
            'name.min' => 'Tên phải có ít nhất 2 ký tự.',
            'phone.regex' => 'Số điện thoại không hợp lệ (VD: 0912345678).',
        ]);

        $customer = Customer::firstOrCreate(
            ['tenant_id' => $tenantId, 'phone' => $data['phone']],
            ['name' => $data['name']],
        );

        try {
            $booking = $this->bookings->createHold($tenant, [
                'customer_id' => $customer->id,
                'channel' => BookingChannel::OwnerManual->value,
                'payment_mode' => 'cash',
                // Wall-as-UTC: parse the walk-in slot digits NAIVELY (no tz), same as the public-hold
                // path, so they align with AvailabilityService and the exclusion constraint.
                'slots' => [[
                    'court_id' => $data['court_id'],
                    'start_at' => CarbonImmutable::parse($data['start_at']),
                    'end_at' => CarbonImmutable::parse($data['end_at']),
                ]],
            ]);
        } catch (SlotTakenException) {
            return back()->with('error', Messages::error('booking', 'slot_taken'));
        }

        // Cash walk-in is settled on the spot → confirm now (no VietQR).
        Payment::forceCreate([
            'tenant_id' => $tenantId, 'booking_id' => $booking->id, 'method' => PaymentMethod::Cash,
            'amount' => $booking->total_amount, 'status' => PaymentStatus::Matched, 'memo_ref' => $booking->code,
            'matched_at' => now(),
        ]);
        $this->bookings->confirmDeposit($booking);

        return back()->with('success', Messages::get('booking', 'walkin_created', ['name' => $customer->name]));
    }
}
