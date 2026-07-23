<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Refund;
use App\Support\WorkingTenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = (int) WorkingTenant::id($request);
        $tenant = $request->user()->tenant()->firstOrFail();

        $venueNow = CarbonImmutable::now($tenant->timezone);

        $from = $venueNow->subDays(30)->toDateString();
        $to = $venueNow->toDateString();

        if ($request->filled('from')) {
            try { $from = CarbonImmutable::parse($request->string('from')->value())->toDateString(); } catch (\Throwable) {}
        }
        if ($request->filled('to')) {
            try { $to = CarbonImmutable::parse($request->string('to')->value())->toDateString(); } catch (\Throwable) {}
        }

        $dayStart = CarbonImmutable::parse($from.' 00:00:00');
        $dayEnd = CarbonImmutable::parse($to.' 23:59:59');

        // --- Revenue by day (confirmed bookings only) ---
        $revenueByDay = Booking::query()
            ->where('bookings.tenant_id', $tenantId)
            ->where('status', BookingStatus::Confirmed)
            ->whereHas('slots', fn ($q) => $q->where('start_at', '>=', $dayStart)->where('start_at', '<=', $dayEnd))
            ->select(DB::raw("DATE(booking_slots.start_at) as date"), DB::raw("SUM(bookings.total_amount) as total"))
            ->join('booking_slots', 'booking_slots.booking_id', '=', 'bookings.id')
            ->groupBy(DB::raw("DATE(booking_slots.start_at)"))
            ->orderBy('date')
            ->get()
            ->keyBy('date')
            ->map(fn ($r) => (int) $r->total);

        // --- Summary ---
        $totalRevenue = (int) $revenueByDay->sum();

        $confirmedBookings = Booking::where('tenant_id', $tenantId)
            ->where('status', BookingStatus::Confirmed)
            ->whereHas('slots', fn ($q) => $q->where('start_at', '>=', $dayStart)->where('start_at', '<=', $dayEnd))
            ->count();

        $noShowCount = Booking::where('tenant_id', $tenantId)
            ->where('status', BookingStatus::NoShow)
            ->whereHas('slots', fn ($q) => $q->where('start_at', '>=', $dayStart)->where('start_at', '<=', $dayEnd))
            ->count();

        $totalBookings = Booking::where('tenant_id', $tenantId)
            ->whereHas('slots', fn ($q) => $q->where('start_at', '>=', $dayStart)->where('start_at', '<=', $dayEnd))
            ->count();

        $depositsCollected = Payment::where('tenant_id', $tenantId)
            ->where('status', PaymentStatus::Matched)
            ->where('matched_at', '>=', $dayStart)
            ->where('matched_at', '<=', $dayEnd)
            ->sum('amount');

        $refundsDone = Refund::where('tenant_id', $tenantId)
            ->where('status', RefundStatus::Done)
            ->where('resolved_at', '>=', $dayStart)
            ->where('resolved_at', '<=', $dayEnd)
            ->sum('amount');

        $refundCount = Refund::where('tenant_id', $tenantId)
            ->where('status', RefundStatus::Done)
            ->where('resolved_at', '>=', $dayStart)
            ->where('resolved_at', '<=', $dayEnd)
            ->count();

        // --- Occupancy ---
        $activeCourts = Court::forTenant($tenantId)->where('status', 'active')->count();
        $dayCount = CarbonImmutable::parse($from)->diffInDays(CarbonImmutable::parse($to)) + 1;
        $totalMinutes = $activeCourts * 18 * 60 * $dayCount;

        $bookedMinutes = BookingSlot::where('tenant_id', $tenantId)
            ->where('start_at', '>=', $dayStart)
            ->where('start_at', '<=', $dayEnd)
            ->select(DB::raw("COALESCE(SUM(EXTRACT(EPOCH FROM (end_at - start_at)) / 60), 0) as total"))
            ->value('total');

        $occupancyRate = $totalMinutes > 0 ? (int) round((float) $bookedMinutes / $totalMinutes * 100) : 0;

        // --- Top customers ---
        $topCustomers = Customer::where('customers.tenant_id', $tenantId)
            ->join('bookings', 'bookings.customer_id', '=', 'customers.id')
            ->where('bookings.status', BookingStatus::Confirmed)
            ->whereHas('bookings.slots', fn ($q) => $q->where('start_at', '>=', $dayStart)->where('start_at', '<=', $dayEnd))
            ->select('customers.id', 'customers.name', 'customers.phone',
                DB::raw('COUNT(bookings.id) as booking_count'),
                DB::raw('SUM(bookings.total_amount) as total_spent'))
            ->groupBy('customers.id', 'customers.name', 'customers.phone')
            ->orderByDesc('booking_count')
            ->take(10)
            ->get()
            ->map(fn ($c) => [
                'name' => $c->name,
                'phone' => $c->phone,
                'booking_count' => (int) $c->booking_count,
                'total_spent' => (int) ($c->total_spent ?? 0),
            ]);

        // --- Fill missing days with 0 ---
        $dateRange = [];
        $cursor = CarbonImmutable::parse($from);
        $end = CarbonImmutable::parse($to);
        while ($cursor <= $end) {
            $dateRange[] = $cursor->toDateString();
            $cursor = $cursor->addDay();
        }

        $revenueByDayFilled = collect($dateRange)->map(fn ($d) => [
            'date' => $d,
            'total' => $revenueByDay->get($d, 0),
        ]);

        return Inertia::render('Manager/Reports/Index', [
            'filters' => ['from' => $from, 'to' => $to],
            'revenueByDay' => $revenueByDayFilled,
            'summary' => [
                'totalRevenue' => $totalRevenue,
                'totalBookings' => $totalBookings,
                'confirmedBookings' => $confirmedBookings,
                'noShowCount' => $noShowCount,
                'noShowRate' => $totalBookings > 0 ? round($noShowCount / $totalBookings * 100, 1) : 0,
                'depositsCollected' => (int) $depositsCollected,
                'refundsDone' => (int) $refundsDone,
                'refundCount' => $refundCount,
            ],
            'occupancy' => [
                'rate' => $occupancyRate,
                'bookedMinutes' => (int) $bookedMinutes,
                'totalMinutes' => $totalMinutes,
            ],
            'topCustomers' => $topCustomers,
        ]);
    }
}
