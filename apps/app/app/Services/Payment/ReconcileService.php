<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\PaymentStatus;
use App\Exceptions\SlotTakenException;
use App\Models\BankTxnInbox;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\TenantBankConfig;
use App\Services\Booking\BookingService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Reconcile incoming bank transactions (SePay/Casso) against pending deposits.
 *
 * Idempotent by unique(provider, bank_txn_id): a redelivered webhook whose original DID process is
 * ACKed and dropped, so a deposit is confirmed exactly once (docs/11 #7). But recording and
 * processing are NOT one atomic step — the inbox row is committed first (so it survives a crash),
 * with processed_at = NULL / status 'pending', and processed_at is set only AFTER a successful
 * settle. A redelivery of a row that was recorded but never processed re-runs processing, so a
 * failed attempt (deposit taken, booking stuck in PendingDeposit) is recoverable rather than
 * dropped forever (finding #2).
 *
 * Matches by memo → booking.code (NOT amount alone). Three settle branches (docs/07 a):
 *   - within hold / slots still held → confirm
 *   - hold expired but slot re-acquired → grace confirm
 *   - slot lost → payment orphaned + auto refund
 * On amount mismatch we NEVER auto-confirm — the transaction goes to the manual-reconcile queue.
 */
class ReconcileService
{
    /** Reconcile state machine (persisted on bank_txn_inbox.status). */
    public const STATUS_PENDING = 'pending';        // recorded, not yet successfully processed

    public const STATUS_MATCHED = 'matched';        // confirmed against a deposit

    public const STATUS_ORPHANED = 'orphaned';      // paid but slot lost → refund requested

    public const STATUS_UNMATCHED = 'unmatched';    // needs owner action (unknown acct / underpaid / no booking)

    public const STATUS_DISMISSED = 'dismissed';    // owner marked it irrelevant

    public function __construct(
        private BookingService $bookings,
        private PaymentService $payments,
    ) {}

    /**
     * @param  array{provider:string, bank_txn_id:string, account_number:string, amount:int,
     *   memo:string, payload?:array}  $txn
     */
    public function ingest(array $txn, int $tenantId): void
    {
        $inbox = $this->recordInbox($txn, $tenantId);
        if ($inbox === null) {
            return; // genuine duplicate — the original txn already processed (exactly-once)
        }

        DB::transaction(function () use ($txn, $inbox) {
            $inbox = BankTxnInbox::query()->lockForUpdate()->findOrFail($inbox->id);
            if ($inbox->processed_at !== null) {
                return;
            }

            $code = $this->extractCode($txn['memo']);
            $activeConfig = TenantBankConfig::where('provider', $txn['provider'])
                ->where('account_number', $txn['account_number'])
                ->where('active', true)
                ->first();
            $payment = $code
                ? Payment::query()
                    ->where('memo_ref', $code)
                    ->where('status', PaymentStatus::Awaiting)
                    ->where('recipient_provider', $txn['provider'])
                    ->where('recipient_account_number', $txn['account_number'])
                    ->first()
                : null;

            // Payments created before the snapshot migration keep the former active-config match.
            if (! $payment && $code && $activeConfig) {
                $payment = $activeConfig
                    ? Payment::query()
                        ->where('tenant_id', $activeConfig->tenant_id)
                        ->where('memo_ref', $code)
                        ->where('status', PaymentStatus::Awaiting)
                        ->whereNull('recipient_account_number')
                        ->first()
                    : null;
            }

            if (! $payment) {
                if (! $activeConfig) {
                    $this->finalize($inbox, self::STATUS_UNMATCHED, 'unknown receiving account');

                    return;
                }

                // The webhook may have legitimately arrived BEFORE the booking/payment was created (or
                // the memo was mistyped). Leave processed_at NULL so a later redelivery re-attempts the
                // match once the deposit exists (finding #8); meanwhile it surfaces in the owner's
                // manual-reconcile queue via status = unmatched.
                $this->finalize($inbox, self::STATUS_UNMATCHED, 'no matching pending deposit', processed: false);

                return;
            }

            // Any amount mismatch requires owner reconciliation. Auto-confirming an overpayment silently
            // loses the surplus and violates the immutable payment ledger.
            if ((int) $txn['amount'] !== (int) $payment->amount) {
                $this->finalize($inbox, self::STATUS_UNMATCHED, 'amount mismatch', paymentId: $payment->id);

                return;
            }

            [$booking, $payment] = $this->lockBookingThenPayment($payment);
            if ($payment->status !== PaymentStatus::Awaiting) {
                $this->finalize($inbox, self::STATUS_UNMATCHED, 'Payment was already settled', paymentId: $payment->id);

                return;
            }

            $payment->update(['bank_txn_id' => $txn['bank_txn_id'], 'raw_payload' => $txn]);
            $this->settle($payment, $booking, $inbox, 'Auto-matched');
        });
    }

    /** Manually match a bank txn to a payment (owner-driven reconcile). */
    public function manualMatch(BankTxnInbox $inbox, Payment $payment): void
    {
        DB::transaction(function () use ($inbox, $payment) {
            $inbox = BankTxnInbox::query()->lockForUpdate()->findOrFail($inbox->id);
            if ($inbox->processed_at !== null) {
                return;
            }

            [$booking, $payment] = $this->lockBookingThenPayment($payment);
            if ($inbox->tenant_id !== null && (int) $inbox->tenant_id !== (int) $payment->tenant_id) {
                throw new RuntimeException('Bank transaction and payment must belong to the same tenant.');
            }

            // Legacy inbox rows predate authenticated tenant attribution. A manual match can safely
            // attribute one only after the tenant-scoped payment lock has been acquired.
            $inbox->tenant_id ??= $payment->tenant_id;
            if ($payment->status !== PaymentStatus::Awaiting) {
                $this->finalize(
                    $inbox,
                    $payment->status === PaymentStatus::Matched ? self::STATUS_MATCHED : self::STATUS_ORPHANED,
                    'Payment was already settled',
                    paymentId: $payment->id,
                );

                return;
            }

            $payment->update([
                'bank_txn_id' => $inbox->bank_txn_id,
                'raw_payload' => $inbox->payload,
            ]);
            $this->settle($payment, $booking, $inbox, 'Manual match by owner');
        });
    }

    /** Dismiss an unmatched bank txn as irrelevant (not a booking deposit). */
    public function dismissTxn(BankTxnInbox $inbox): void
    {
        DB::transaction(function () use ($inbox) {
            $inbox = BankTxnInbox::query()->lockForUpdate()->findOrFail($inbox->id);
            if ($inbox->processed_at === null) {
                $this->finalize($inbox, self::STATUS_DISMISSED, 'Dismissed by owner');
            }
        });
    }

    /**
     * Run the 3 reconcile branches for a matched payment (shared by auto + manual match). Must be
     * called inside a DB transaction. If the slot is lost at the commit UPDATE — a concurrent
     * expire+re-hold makes it raise 23P01, which BookingService::confirmDeposit surfaces as a
     * SlotTakenException — we route to orphaned+refund instead of letting a 500 escape (finding #5).
     */
    private function settle(Payment $payment, Booking $booking, BankTxnInbox $inbox, string $matchedNote): void
    {
        // Cancellation won the booking lock before this transaction. Do not revive a cancelled
        // booking when a transfer arrives later; preserve the money in the separate refund ledger.
        if ($booking->status === BookingStatus::Cancelled) {
            $this->orphan($payment, $booking, $inbox);

            return;
        }

        if ($this->bookings->secureForPayment($booking) === 'lost') {
            $this->orphan($payment, $booking, $inbox);

            return;
        }

        try {
            $payment->forceFill(['status' => PaymentStatus::Matched, 'matched_at' => now()])->save();
            $this->bookings->confirmDeposit($booking);
            $this->finalize($inbox, self::STATUS_MATCHED, $matchedNote, paymentId: $payment->id);
        } catch (SlotTakenException) {
            // Lost the race between the 'held' check and the commit UPDATE → orphan + refund.
            $this->orphan($payment, $booking, $inbox);
        }
    }

    private function orphan(Payment $payment, Booking $booking, BankTxnInbox $inbox): void
    {
        $payment->forceFill(['status' => PaymentStatus::Orphaned])->save();
        $this->payments->requestRefund($payment, (int) $payment->amount, CancelReason::RaceLost);
        $this->bookings->markPaymentOrphaned($booking);
        $this->finalize($inbox, self::STATUS_ORPHANED, 'Auto-orphaned: slot lost, refund requested', paymentId: $payment->id);
    }

    /**
     * All lifecycle flows that need both business rows acquire them in this order: booking, then
     * payment. The inbox lock remains first as its independent webhook-idempotency barrier.
     *
     * @return array{0: Booking, 1: Payment}
     */
    private function lockBookingThenPayment(Payment $candidate): array
    {
        $booking = Booking::query()
            ->where('tenant_id', $candidate->tenant_id)
            ->lockForUpdate()
            ->findOrFail($candidate->booking_id);
        $payment = Payment::query()
            ->where('tenant_id', $booking->tenant_id)
            ->where('booking_id', $booking->id)
            ->lockForUpdate()
            ->findOrFail($candidate->id);

        return [$booking, $payment];
    }

    private function recordInbox(array $txn, int $tenantId): ?BankTxnInbox
    {
        // Record the raw txn in its OWN committed transaction so it survives even if processing
        // later throws — the row lands with processed_at = NULL (status 'pending') and is only
        // marked processed after a successful settle. The savepoint keeps a duplicate insert
        // (redelivered webhook) from poisoning an outer transaction.
        try {
            return DB::transaction(fn () => BankTxnInbox::create([
                'tenant_id' => $tenantId,
                'provider' => $txn['provider'],
                'bank_txn_id' => $txn['bank_txn_id'],
                'account_number' => $txn['account_number'] ?? null,
                'amount' => $txn['amount'],
                'memo' => $txn['memo'],
                'payload' => $txn['payload'] ?? null,
            ]));
        } catch (QueryException $e) {
            if ($e->getCode() !== '23505') {   // not a unique_violation → a real error
                throw $e;
            }
        }

        // The txn is already on file. If it was never successfully processed (processed_at IS NULL)
        // we return it so the caller RE-PROCESSES (recovery, #2); once it reached a terminal state
        // we return null so the redelivery is dropped — exactly-once for txns that did process.
        // The caller locks the returned row before processing, so concurrent redeliveries serialize
        // on this row and only one can settle it.
        $existing = BankTxnInbox::where('provider', $txn['provider'])
            ->where('bank_txn_id', $txn['bank_txn_id'])
            ->first();

        if ($existing === null || $existing->processed_at !== null) {
            return null;
        }

        return $existing;
    }

    private function extractCode(string $memo): ?string
    {
        return preg_match('/SAN-[A-Z0-9]{5,20}/', strtoupper($memo), $m) ? $m[0] : null;
    }

    /**
     * Persist the reconcile outcome on the inbox row. `status`/`payment_id` are set via direct
     * assignment (not mass-assignable on the model). `processed` = false keeps processed_at NULL so
     * a redelivery can re-process the txn (used for the early-webhook / no-booking case, #8).
     */
    private function finalize(
        BankTxnInbox $inbox,
        string $status,
        ?string $note = null,
        bool $processed = true,
        ?int $paymentId = null,
    ): void {
        $inbox->status = $status;
        $inbox->note = $note;

        if ($paymentId !== null) {
            $inbox->payment_id = $paymentId;
        }

        if ($processed && $inbox->processed_at === null) {
            $inbox->processed_at = now();
        }

        $inbox->save();
    }
}
