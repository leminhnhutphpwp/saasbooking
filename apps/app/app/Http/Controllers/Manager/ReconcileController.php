<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\BankTxnInbox;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\TenantBankConfig;
use App\Services\Payment\ReconcileService;
use App\Support\Messages;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manual bank-txn reconcile screen. Shows unmatched bank transactions and pending
 * bookings so the owner can match by hand when the auto-reconcile fails (wrong
 * memo, amount mismatch, delayed webhook, etc).
 */
class ReconcileController extends Controller
{
    public function __construct(private ReconcileService $reconcile) {}

    public function unmatched(Request $request): Response
    {
        $tenantId = WorkingTenant::id($request);
        $bankNumbers = TenantBankConfig::where('tenant_id', $tenantId)->pluck('account_number');

        // Owner-action queue = unprocessed (processed_at IS NULL, includes a failed/early webhook)
        // OR flagged unmatched. Filtered on structured columns, never LIKE on the free-text note:
        // matched / orphaned / dismissed rows all fall outside both clauses and are excluded.
        $txns = BankTxnInbox::whereIn('account_number', $bankNumbers)
            ->where(function ($q) {
                $q->whereNull('processed_at')
                    ->orWhere('status', ReconcileService::STATUS_UNMATCHED);
            })
            ->orderByDesc('received_at')
            ->get()
            ->map(fn (BankTxnInbox $t) => [
                'id' => $t->id,
                'provider' => $t->provider,
                'amount' => $t->amount,
                'memo' => $t->memo,
                'received_at' => $t->received_at->format('Y-m-d H:i'),
                'processed_at' => $t->processed_at?->format('Y-m-d H:i'),
                'note' => $t->note,
            ]);

        $pendingBookings = Booking::with(['customer', 'slots'])
            ->where('tenant_id', $tenantId)
            ->where('status', BookingStatus::PendingDeposit)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Booking $b) => [
                'uuid' => $b->uuid,
                'code' => $b->code,
                'customer_name' => $b->customer?->name ?? '—',
                'customer_phone' => $b->customer?->phone ?? '',
                'deposit_amount' => $b->deposit_amount,
                'slots' => $b->slots->map(fn ($s) => $s->start_at->format('d/m H:i')),
            ]);

        return Inertia::render('Manager/Reconcile/Unmatched', [
            'txns' => $txns,
            'pendingBookings' => $pendingBookings,
        ]);
    }

    public function manualMatch(Request $request): RedirectResponse
    {
        $tenantId = WorkingTenant::id($request);

        $data = $request->validate([
            'txn_id' => ['required', 'integer', 'exists:bank_txn_inbox,id'],
            'booking_uuid' => ['required', 'string', 'exists:bookings,uuid'],
        ]);

        $inbox = BankTxnInbox::query()
            ->whereKey($data['txn_id'])
            ->whereIn('account_number', TenantBankConfig::query()
                ->where('tenant_id', $tenantId)
                ->select('account_number'))
            ->first();
        abort_unless($inbox, 403);

        $booking = Booking::where('tenant_id', $tenantId)
            ->where('uuid', $data['booking_uuid'])
            ->firstOrFail();

        $payment = Payment::where('tenant_id', $tenantId)
            ->where('booking_id', $booking->id)
            ->where('status', PaymentStatus::Awaiting)
            ->first();

        if (! $payment) {
            return back()->with('error', Messages::get('reconcile', 'not_pending'));
        }

        $this->reconcile->manualMatch($inbox, $payment);

        return back()->with('success', Messages::get('reconcile', 'matched'));
    }

    public function dismissTxn(Request $request, BankTxnInbox $inbox): RedirectResponse
    {
        $tenantId = WorkingTenant::id($request);
        $inbox = BankTxnInbox::query()
            ->whereKey($inbox->id)
            ->whereIn('account_number', TenantBankConfig::query()
                ->where('tenant_id', $tenantId)
                ->select('account_number'))
            ->first();
        abort_unless($inbox, 403);

        $this->reconcile->dismissTxn($inbox);

        return back()->with('success', Messages::get('reconcile', 'skip'));
    }
}
