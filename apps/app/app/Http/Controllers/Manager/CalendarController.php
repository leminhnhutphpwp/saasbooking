<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\BookingChannel;
use App\Enums\HoldStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Exceptions\SlotTakenException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Tenant;
use App\Services\Booking\AvailabilityService;
use App\Services\Booking\BookingService;
use App\Services\Catalog\CatalogService;
use App\Services\Catalog\PricingService;
use App\Services\CustomerService;
use App\Support\Messages;
use App\Support\WorkingTenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        private CustomerService $customers,
        private AvailabilityService $availability,
        private CatalogService $catalog,
    ) {}

    public function index(Request $request): Response
    {
        $tenantId = (int) WorkingTenant::id($request);
        $tenant = Tenant::findOrFail($tenantId);

        $venueToday = CarbonImmutable::now($tenant->timezone)->toDateString();
        $dateString = $venueToday;
        if ($request->filled('date')) {
            try {
                $dateString = CarbonImmutable::parse($request->string('date')->value())->toDateString();
            } catch (\Throwable) {
                $dateString = $venueToday;
            }
        }

        $duration = (int) $request->input('duration', 60);
        if (! in_array($duration, [60, 90, 120], true)) {
            $duration = 60;
        }

        $date = CarbonImmutable::parse($dateString);
        $dayStart = CarbonImmutable::parse($dateString.' 00:00:00');
        $dayEnd = $dayStart->addDay();

        $courts = Court::forTenant($tenantId)->where('status', 'active')->orderBy('name')->get(['id', 'uuid', 'name']);

        $availability = [];
        foreach ($courts as $court) {
            $windows = $this->catalog->openingWindows($tenantId, $court->id, $date);
            $openingWindows = array_map(fn ($w) => ['open' => $w['open'], 'close' => $w['close']], $windows);

            $freeIntervals = [];
            $searchResults = $this->availability->search($tenantId, $date, null, $duration);
            foreach ($searchResults as $result) {
                if ($result['court_id'] === $court->id) {
                    foreach ($result['free'] as $interval) {
                        $start = CarbonImmutable::parse($interval['start']);
                        $end = CarbonImmutable::parse($interval['end']);
                        $price = null;
                        try {
                            $price = $this->pricing->resolve($tenantId, $court->id, $start, $end);
                        } catch (RuntimeException) {
                        }
                        $freeIntervals[] = [
                            'start' => $start->format('H:i'),
                            'end' => $end->format('H:i'),
                            'price' => $price,
                        ];
                    }
                    break;
                }
            }

            $bookedSlots = BookingSlot::query()
                ->where('tenant_id', $tenantId)
                ->where('court_id', $court->id)
                ->whereIn('hold_status', [HoldStatus::Holding->value, HoldStatus::Committed->value])
                ->where('start_at', '>=', $dayStart)
                ->where('start_at', '<', $dayEnd)
                ->with('booking.customer')
                ->get()
                ->map(fn ($slot) => [
                    'uuid' => $slot->booking->uuid,
                    'start' => $slot->start_at->format('H:i'),
                    'end' => $slot->end_at->format('H:i'),
                    'customer' => $slot->booking->customer?->name,
                    'status' => $slot->booking->status->value,
                    'code' => $slot->booking->code,
                    'amount' => $slot->booking->total_amount,
                    'channel' => $slot->booking->channel->value,
                ])
                ->values()
                ->all();

            $availability[$court->uuid] = [
                'opening_windows' => $openingWindows,
                'free_intervals' => $freeIntervals,
                'booked_slots' => $bookedSlots,
            ];
        }

        return Inertia::render('Manager/Calendar/Index', [
            'courts' => $courts->map(fn ($c) => ['id' => $c->id, 'uuid' => $c->uuid, 'name' => $c->name]),
            'date' => $dateString,
            'availability' => $availability,
            'duration' => $duration,
        ]);
    }

    public function storeWalkIn(Request $request): RedirectResponse
    {
        $tenantId = (int) WorkingTenant::id($request);
        $tenant = Tenant::findOrFail($tenantId);

        $data = $request->validate([
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'name' => ['required_without:customer_id', 'nullable', 'string', 'min:2', 'max:255'],
            'phone' => ['required_without:customer_id', 'nullable', 'string', 'regex:/^(\+?84|0)[2-9]\d{7,8}$/'],
            'court_id' => ['required', 'integer', Rule::exists('courts', 'id')->where('tenant_id', $tenantId)],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
        ], [
            'name.min' => 'Tên phải có ít nhất 2 ký tự.',
            'phone.regex' => 'Số điện thoại không hợp lệ (VD: 0912345678).',
        ]);

        if (! empty($data['customer_id'])) {
            $customer = Customer::where('id', $data['customer_id'])
                ->where('tenant_id', $tenantId)
                ->firstOrFail();
        } else {
            $phone = $this->customers->normalizePhone($data['phone']);
            $customer = Customer::firstOrCreate(
                ['tenant_id' => $tenantId, 'phone' => $phone],
                ['name' => $data['name']],
            );
        }

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
        DB::transaction(function () use ($booking, $tenantId) {
            Payment::forceCreate([
                'tenant_id' => $tenantId, 'booking_id' => $booking->id, 'method' => PaymentMethod::Cash,
                'amount' => $booking->total_amount, 'status' => PaymentStatus::Matched, 'memo_ref' => $booking->code,
                'matched_at' => now(),
            ]);
            $this->bookings->confirmDeposit($booking);
        });

        return back()->with('success', Messages::get('booking', 'walkin_created', ['name' => $customer->name]));
    }
}
