<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\RefundStatus;
use App\Http\Controllers\Controller;
use App\Models\Refund;
use App\Services\Payment\PaymentService;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Owner refund queue. VietQR has no refund API, so the owner transfers back by hand and marks
 * each refund done (one click). Scoped by WorkingTenant.
 */
class RefundController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function index(Request $request): Response
    {
        $tenantId = (int) WorkingTenant::id($request);

        $refunds = Refund::query()
            ->where('tenant_id', $tenantId)
            ->where('status', RefundStatus::Requested)
            ->with('payment.booking.customer')
            ->orderBy('requested_at')
            ->get()
            ->map(fn (Refund $r) => [
                'uuid' => $r->uuid,
                'amount' => (int) $r->amount,
                'reason' => $r->reason->value,
                'code' => $r->payment?->booking?->code,
                'phone' => $r->payment?->booking?->customer?->phone,
                'requested_at' => $r->requested_at?->toIso8601String(),
            ]);

        return Inertia::render('Manager/Refunds/Index', ['refunds' => $refunds]);
    }

    public function markDone(Request $request, Refund $refund): RedirectResponse
    {
        abort_unless($refund->tenant_id === WorkingTenant::id($request), 403);

        $this->payments->markRefundDone($refund, $request->user()?->id);

        return back()->with('success', 'Đã đánh dấu hoàn cọc.');
    }
}
