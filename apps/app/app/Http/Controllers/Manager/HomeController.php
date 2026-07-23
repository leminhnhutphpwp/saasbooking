<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\BookingStatus;
use App\Enums\RefundStatus;
use App\Http\Controllers\Controller;
use App\Models\BankTxnInbox;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Refund;
use App\Support\WorkingTenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = (int) WorkingTenant::id($request);
        $tenant = $request->user()->tenant()->firstOrFail();

        $venueToday = CarbonImmutable::now($tenant->timezone)->toDateString();
        $dayStart = CarbonImmutable::parse($venueToday.' 00:00:00');
        $dayEnd = $dayStart->addDay();

        $todayBookings = Booking::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('slots', fn ($q) => $q->where('start_at', '>=', $dayStart)->where('start_at', '<', $dayEnd))
            ->with(['customer', 'slots.court'])
            ->get();

        $totalBookings = $todayBookings->count();
        $confirmedCount = $todayBookings->filter(fn (Booking $b) => $b->status === BookingStatus::Confirmed)->count();
        $pendingDepositCount = $todayBookings->filter(fn (Booking $b) => $b->status === BookingStatus::PendingDeposit)->count();

        $todayRevenue = $todayBookings->filter(fn (Booking $b) => $b->status === BookingStatus::Confirmed)->sum('total_amount');

        $activeCourts = Court::forTenant($tenantId)->where('status', 'active')->count();
        $bookedMinutes = $todayBookings->flatMap->slots
            ->filter(fn ($s) => $s->start_at >= $dayStart && $s->start_at < $dayEnd)
            ->sum(fn ($s) => (int) $s->start_at->diffInMinutes($s->end_at));
        $totalMinutes = $activeCourts * 18 * 60;
        $occupancy = $totalMinutes > 0 ? (int) round($bookedMinutes / $totalMinutes * 100) : 0;

        $awaitingDeposits = Booking::query()
            ->where('tenant_id', $tenantId)
            ->where('status', BookingStatus::PendingDeposit)
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn (Booking $b) => [
                'code' => $b->code,
                'customer' => $b->customer?->name,
                'created_at' => $b->created_at->toIso8601String(),
            ]);

        $refundsToProcess = Refund::query()
            ->where('tenant_id', $tenantId)
            ->where('status', RefundStatus::Requested)
            ->with('payment.booking.customer')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn (Refund $r) => [
                'code' => $r->payment?->booking?->code,
                'customer' => $r->payment?->booking?->customer?->name,
                'amount' => $r->amount,
            ]);

        $unmatchedTxns = BankTxnInbox::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->orderBy('received_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn (BankTxnInbox $t) => [
                'amount' => $t->amount,
                'received_at' => $t->received_at?->toIso8601String(),
                'description' => $t->memo,
            ]);

        $upcomingBookings = $todayBookings
            ->sortBy(fn (Booking $b) => $b->slots->first()?->start_at)
            ->take(5)
            ->flatMap(fn (Booking $b) => $b->slots->map(fn ($s) => [
                'code' => $b->code,
                'status' => $b->status->value,
                'customer' => $b->customer?->name,
                'court' => $s->court?->name,
                'start' => $s->start_at->toIso8601String(),
                'end' => $s->end_at->toIso8601String(),
            ]))
            ->sortBy('start')
            ->values();

        return Inertia::render('Manager/Home/Index', [
            'stats' => [
                'totalBookings' => $totalBookings,
                'confirmedCount' => $confirmedCount,
                'pendingDepositCount' => $pendingDepositCount,
                'todayRevenue' => $todayRevenue,
                'occupancy' => $occupancy,
            ],
            'awaitingDeposits' => $awaitingDeposits,
            'refundsToProcess' => $refundsToProcess,
            'unmatchedTxns' => $unmatchedTxns,
            'upcomingBookings' => $upcomingBookings,
        ]);
    }
}
