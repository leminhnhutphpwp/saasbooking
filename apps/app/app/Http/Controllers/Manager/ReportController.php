<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Tenant;
use App\Services\Reporting\OperationalMetricsService;
use App\Support\WorkingTenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(private OperationalMetricsService $metrics) {}

    public function index(Request $request): Response
    {
        $tenantId = (int) WorkingTenant::id($request);
        $tenant = Tenant::findOrFail($tenantId);

        $venueNow = CarbonImmutable::now($tenant->timezone);

        $from = $venueNow->subDays(30)->toDateString();
        $to = $venueNow->toDateString();

        if ($request->filled('from')) {
            try {
                $from = CarbonImmutable::parse($request->string('from')->value())->toDateString();
            } catch (\Throwable) {
            }
        }
        if ($request->filled('to')) {
            try {
                $to = CarbonImmutable::parse($request->string('to')->value())->toDateString();
            } catch (\Throwable) {
            }
        }

        $fromDate = CarbonImmutable::parse($from);
        $toDate = CarbonImmutable::parse($to);

        if ($fromDate->greaterThan($toDate)) {
            [$fromDate, $toDate] = [$toDate, $fromDate];
            $from = $fromDate->toDateString();
            $to = $toDate->toDateString();
        }

        $dayStart = CarbonImmutable::parse($from.' 00:00:00');
        $dayEnd = CarbonImmutable::parse($to.' 23:59:59');

        $revenueByDayMap = $this->metrics->revenueByDay($tenantId, $dayStart, $dayEnd);
        $totalRevenue = $this->metrics->totalRevenue($tenantId, $dayStart, $dayEnd);

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

        $occupancy = $this->metrics->occupancy($tenantId, $fromDate, $toDate);
        $utilization = $this->metrics->utilization($tenantId, $fromDate, $toDate);

        $topCustomers = Customer::where('customers.tenant_id', $tenantId)
            ->join('bookings', 'bookings.customer_id', '=', 'customers.id')
            ->where('bookings.status', BookingStatus::Confirmed)
            ->join('booking_slots', function ($join) use ($dayStart, $dayEnd) {
                $join->on('booking_slots.booking_id', '=', 'bookings.id')
                    ->where('booking_slots.start_at', '>=', $dayStart)
                    ->where('booking_slots.start_at', '<=', $dayEnd);
            })
            ->select('customers.id', 'customers.uuid', 'customers.name', 'customers.phone',
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count'),
                DB::raw('SUM(booking_slots.price_snapshot) as total_spent'))
            ->groupBy('customers.id', 'customers.uuid', 'customers.name', 'customers.phone')
            ->orderByDesc('booking_count')
            ->take(10)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->uuid,
                'name' => $c->name,
                'phone' => $c->phone,
                'booking_count' => (int) $c->booking_count,
                'total_spent' => (int) ($c->total_spent ?? 0),
            ]);

        $dateRange = [];
        $cursor = CarbonImmutable::parse($from);
        $end = CarbonImmutable::parse($to);
        while ($cursor <= $end) {
            $dateRange[] = $cursor->toDateString();
            $cursor = $cursor->addDay();
        }

        $revenueByDayFilled = collect($dateRange)->map(fn ($d) => [
            'date' => $d,
            'total' => $revenueByDayMap->get($d, 0),
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
                'rate' => $occupancy['rate'],
                'bookedMinutes' => $occupancy['bookedMinutes'],
                'totalMinutes' => $occupancy['totalMinutes'],
            ],
            'topCustomers' => $topCustomers,
            'utilization' => [
                'hourly' => $utilization['hourly'],
                'coverage' => $utilization['coverage'],
            ],
        ]);
    }
}
