<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Enums\CancelReason;
use App\Enums\PaymentStatus;
use App\Models\BankTxnInbox;
use App\Models\Payment;
use App\Models\TenantBankConfig;
use App\Services\Booking\BookingService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * Reconcile incoming bank transactions (SePay/Casso) against pending deposits.
 *
 * Idempotent by unique(provider, bank_txn_id) — a redelivered webhook is ACKed and dropped, so
 * a deposit is confirmed exactly once (docs/11 #7). Matches by memo → booking.code (NOT amount
 * alone). Three branches (docs/07 a):
 *   - within hold / slots still held → confirm
 *   - hold expired but slot re-acquired → grace confirm
 *   - slot lost → payment orphaned + auto refund
 * On amount mismatch we NEVER auto-confirm — the transaction goes to the manual-reconcile queue.
 */
class ReconcileService
{
    public function __construct(
        private BookingService $bookings,
        private PaymentService $payments,
    ) {}

    /**
     * @param  array{provider:string, bank_txn_id:string, account_number:string, amount:int,
     *   memo:string, payload?:array}  $txn
     */
    public function ingest(array $txn): void
    {
        $inbox = $this->recordInbox($txn);
        if ($inbox === null) {
            return; // duplicate webhook — already processed
        }

        $config = TenantBankConfig::where('provider', $txn['provider'])
            ->where('account_number', $txn['account_number'])
            ->where('active', true)
            ->first();
        if (! $config) {
            $this->markUnmatched($inbox, 'unknown receiving account');

            return;
        }

        $code = $this->extractCode($txn['memo']);
        $payment = $code
            ? Payment::where('tenant_id', $config->tenant_id)
                ->where('memo_ref', $code)
                ->where('status', PaymentStatus::Awaiting)
                ->first()
            : null;

        if (! $payment) {
            $this->markUnmatched($inbox, 'no matching pending deposit');

            return;
        }

        // Underpaid → never auto-confirm; owner reconciles by hand (docs/10 P1).
        if ((int) $txn['amount'] < (int) $payment->amount) {
            $this->markUnmatched($inbox, 'amount mismatch (underpaid)', $payment->id);

            return;
        }

        DB::transaction(function () use ($payment, $txn, $inbox) {
            $booking = $payment->booking;
            $outcome = $this->bookings->secureForPayment($booking);

            $payment->update(['bank_txn_id' => $txn['bank_txn_id'], 'raw_payload' => $txn]);

            if ($outcome === 'lost') {
                $payment->update(['status' => PaymentStatus::Orphaned]);
                $this->payments->requestRefund($payment, (int) $payment->amount, CancelReason::RaceLost);
                $this->bookings->markPaymentOrphaned($booking);
            } else {
                $payment->update(['status' => PaymentStatus::Matched, 'matched_at' => now()]);
                $this->bookings->confirmDeposit($booking);
            }

            $inbox->update(['processed_at' => now()]);
        });
    }

    private function recordInbox(array $txn): ?BankTxnInbox
    {
        // Savepoint so a unique-violation (duplicate webhook) doesn't poison an outer transaction.
        try {
            return DB::transaction(fn () => BankTxnInbox::create([
                'provider' => $txn['provider'],
                'bank_txn_id' => $txn['bank_txn_id'],
                'account_number' => $txn['account_number'] ?? null,
                'amount' => $txn['amount'],
                'memo' => $txn['memo'],
                'payload' => $txn['payload'] ?? null,
            ]));
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {   // unique_violation → duplicate webhook
                return null;
            }
            throw $e;
        }
    }

    private function extractCode(string $memo): ?string
    {
        return preg_match('/SAN-[A-Z0-9]{5}/', strtoupper($memo), $m) ? $m[0] : null;
    }

    /** Manually match a bank txn to a payment (owner-driven reconcile). */
    public function manualMatch(BankTxnInbox $inbox, Payment $payment): void
    {
        DB::transaction(function () use ($inbox, $payment) {
            $booking = $payment->booking;
            $outcome = $this->bookings->secureForPayment($booking);

            $payment->update([
                'bank_txn_id' => $inbox->bank_txn_id,
                'raw_payload' => $inbox->payload,
            ]);

            if ($outcome === 'lost') {
                $payment->update(['status' => PaymentStatus::Orphaned]);
                $this->payments->requestRefund($payment, (int) $payment->amount, CancelReason::RaceLost);
                $this->bookings->markPaymentOrphaned($booking);
            } else {
                $payment->update(['status' => PaymentStatus::Matched, 'matched_at' => now()]);
                $this->bookings->confirmDeposit($booking);
            }

            $inbox->update(['processed_at' => now(), 'note' => 'Manual match by owner']);
        });
    }

    /** Dismiss an unmatched bank txn as irrelevant (not a booking deposit). */
    public function dismissTxn(BankTxnInbox $inbox): void
    {
        $inbox->update([
            'processed_at' => $inbox->processed_at ?? now(),
            'note' => 'Dismissed by owner',
        ]);
    }

    private function markUnmatched(BankTxnInbox $inbox, string $note, ?int $paymentId = null): void
    {
        $inbox->update(['note' => $note, 'processed_at' => now()]);
    }
}
