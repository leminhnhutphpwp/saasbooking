<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\BookingStatus;
use App\Enums\CourtStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Http\Controllers\Controller;
use App\Models\BankTxnInbox;
use App\Models\Booking;
use App\Models\Court;
use App\Models\OpeningRule;
use App\Models\Refund;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Services\Payment\ReconcileService;
use App\Services\Reporting\OperationalMetricsService;
use App\Support\WorkingTenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(private OperationalMetricsService $metrics) {}

    public function index(Request $request): Response
    {
        $tenantId = (int) WorkingTenant::id($request);
        $tenant = Tenant::findOrFail($tenantId);

        $venueNow = CarbonImmutable::now($tenant->timezone);
        $dayStart = $venueNow->startOfDay();
        $dayEnd = $venueNow->endOfDay();

        $todayBookings = Booking::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('slots', fn ($q) => $q->where('start_at', '>=', $dayStart)->where('start_at', '<', $dayEnd))
            ->with(['customer', 'slots.court'])
            ->get();

        $totalBookings = $todayBookings->count();
        $confirmedCount = $todayBookings->filter(fn (Booking $b) => $b->status === BookingStatus::Confirmed)->count();
        $pendingDepositCount = $todayBookings->filter(fn (Booking $b) => $b->status === BookingStatus::PendingDeposit)->count();

        $occupancyData = $this->metrics->occupancy($tenantId, $dayStart, $dayEnd);
        $occupancy = $occupancyData['rate'];

        $awaitingDepositsCount = Booking::query()
            ->where('tenant_id', $tenantId)
            ->where('status', BookingStatus::PendingDeposit)
            ->count();

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

        $refundsToProcessCount = Refund::query()
            ->where('tenant_id', $tenantId)
            ->where('status', RefundStatus::Requested)
            ->count();

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

        $bankNumbers = TenantBankConfig::where('tenant_id', $tenantId)->pluck('account_number');

        $unmatchedTxnsCount = BankTxnInbox::whereIn('account_number', $bankNumbers)
            ->where(fn ($q) => $q->whereNull('processed_at')->orWhere('status', ReconcileService::STATUS_UNMATCHED))
            ->count();

        $unmatchedTxns = BankTxnInbox::whereIn('account_number', $bankNumbers)
            ->where(fn ($q) => $q->whereNull('processed_at')->orWhere('status', ReconcileService::STATUS_UNMATCHED))
            ->orderByDesc('received_at')
            ->take(5)
            ->get()
            ->map(fn (BankTxnInbox $t) => [
                'amount' => $t->amount,
                'received_at' => $t->received_at?->toIso8601String(),
                'description' => $t->memo,
            ]);

        $upcomingBookings = $todayBookings
            ->flatMap(fn (Booking $b) => $b->slots->map(fn ($s) => [
                'code' => $b->code,
                'status' => $b->status->value,
                'customer' => $b->customer?->name,
                'court' => $s->court?->name,
                'start' => $s->start_at->toIso8601String(),
                'end' => $s->end_at->toIso8601String(),
            ]))
            ->sortBy('start')
            ->take(5)
            ->values();

        $weekStart = $dayStart->subDays(6);
        $revenueByDayMap = $this->metrics->revenueByDay($tenantId, $weekStart, $dayEnd);
        $revenueSeries = collect();
        for ($d = 0; $d < 7; $d++) {
            $date = $weekStart->addDays($d);
            $key = $date->toDateString();
            $revenueSeries->push([
                'date' => $key,
                'label' => $date->locale('vi')->isoFormat('ddd').' '.$date->format('d/m'),
                'revenue' => $revenueByDayMap->get($key, 0),
            ]);
        }

        $weekRevenue = $this->metrics->totalRevenue($tenantId, $weekStart, $dayEnd);

        $confirmedInWindow = Booking::query()
            ->where('tenant_id', $tenantId)
            ->where('status', BookingStatus::Confirmed)
            ->whereHas('slots', fn ($q) => $q->where('start_at', '>=', $weekStart)->where('start_at', '<', $dayEnd))
            ->with('payments')
            ->get();
        $totalCollectedDeposits = $confirmedInWindow
            ->flatMap->payments
            ->filter(fn ($p) => $p->status === PaymentStatus::Matched)
            ->sum('amount');
        $pendingRefundAmount = (int) Refund::query()
            ->where('tenant_id', $tenantId)
            ->where('status', RefundStatus::Requested)
            ->sum('amount');

        $activeCourtCount = Court::forTenant($tenantId)->where('status', CourtStatus::Active)->count();
        $noActiveCourts = $activeCourtCount === 0;

        $noOpeningCoverage = false;
        if (! $noActiveCourts) {
            $activeCourtIds = Court::forTenant($tenantId)->where('status', CourtStatus::Active)->pluck('id');
            $openingRuleCount = OpeningRule::query()
                ->where('tenant_id', $tenantId)
                ->whereIn('court_id', $activeCourtIds)
                ->count();
            $noOpeningCoverage = $openingRuleCount === 0;
        }

        $noBookings = $confirmedCount === 0;
        $noExceptions = ($awaitingDepositsCount + $refundsToProcessCount + $unmatchedTxnsCount) === 0;

        return Inertia::render('Manager/Home/Index', [
            'stats' => [
                'totalBookings' => $totalBookings,
                'confirmedCount' => $confirmedCount,
                'pendingDepositCount' => $pendingDepositCount,
                'occupancy' => $occupancy,
            ],
            'tenantName' => $tenant->name,
            'revenueSeries' => $revenueSeries->values(),
            'weekTotals' => [
                'revenue' => $weekRevenue,
                'depositsCollected' => $totalCollectedDeposits,
                'refundsPending' => (int) $pendingRefundAmount,
            ],
            'attentionCounts' => [
                'awaitingDeposits' => $awaitingDepositsCount,
                'refundsToProcess' => $refundsToProcessCount,
                'unmatchedTxns' => $unmatchedTxnsCount,
            ],
            'awaitingDeposits' => $awaitingDeposits,
            'refundsToProcess' => $refundsToProcess,
            'unmatchedTxns' => $unmatchedTxns,
            'upcomingBookings' => $upcomingBookings,
            'operationalState' => [
                'no_active_courts' => $noActiveCourts,
                'no_opening_coverage' => $noOpeningCoverage,
                'no_bookings' => $noBookings,
                'no_exceptions' => $noExceptions,
            ],
        ]);
    }
}
