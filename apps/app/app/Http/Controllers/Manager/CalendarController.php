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
use App\Services\Booking\BookingService;
use App\Support\WorkingTenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Owner calendar: today's bookings per court + walk-in (cash) booking. Walk-ins are confirmed
 * immediately (cash, no VietQR). Everything scoped by WorkingTenant.
 */
class CalendarController extends Controller
{
    public function __construct(private BookingService $bookings) {}

    public function index(Request $request): Response
    {
        $tenantId = (int) WorkingTenant::id($request);
        $tenant = $request->user()->tenant()->firstOrFail();

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
                'court' => $s->court?->name,
                'customer' => $b->customer?->name,
                'phone' => $b->customer?->phone,
                'start' => $s->start_at->toIso8601String(),
                'end' => $s->end_at->toIso8601String(),
            ]))
            ->sortBy('start')
            ->values();

        return Inertia::render('Manager/Calendar/Index', [
            'date' => $dateString,
            'bookings' => $bookings,
            'courts' => Court::forTenant($tenantId)->where('status', 'active')->orderBy('name')
                ->get(['id', 'name'])->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
        ]);
    }

    public function storeWalkIn(Request $request): RedirectResponse
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $tenantId = (int) WorkingTenant::id($request);
        abort_unless($tenant->id === $tenantId, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'court_id' => ['required', 'integer', Rule::exists('courts', 'id')->where('tenant_id', $tenantId)],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
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
        } catch (SlotTakenException $e) {
            return back()->with('error', $e->getMessage());
        }

        // Cash walk-in is settled on the spot → confirm now (no VietQR).
        Payment::forceCreate([
            'tenant_id' => $tenantId, 'booking_id' => $booking->id, 'method' => PaymentMethod::Cash,
            'amount' => $booking->total_amount, 'status' => PaymentStatus::Matched, 'memo_ref' => $booking->code,
            'matched_at' => now(),
        ]);
        $this->bookings->confirmDeposit($booking);

        return back()->with('success', "Đã đặt sân cho {$customer->name} (tiền mặt).");
    }
}
