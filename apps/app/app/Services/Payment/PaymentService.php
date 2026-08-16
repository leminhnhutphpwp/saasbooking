<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Enums\CancelReason;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\TenantBankConfig;
use App\Support\Messages;
use App\Support\VietQr;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * VietQR deposit + refund ledger. `initDeposit` shows the QR (memo = booking.code); the actual
 * confirmation happens in ReconcileService when the bank transaction is matched. Refunds are a
 * separate ledger — payments.amount is never mutated (docs/11 #11).
 */
class PaymentService
{
    /** @return array{payment: Payment, qr: string, amount: int, memo: string, account: array} */
    public function initDeposit(Booking $booking): array
    {
        // amount/status/tenant_id are not mass-assignable (audit #10) — build explicitly.
        $payment = Payment::query()
            ->where('tenant_id', $booking->tenant_id)
            ->where('booking_id', $booking->id)
            ->where('method', PaymentMethod::VietQr)
            ->first();

        if (! $payment) {
            $config = TenantBankConfig::where('tenant_id', $booking->tenant_id)
                ->where('active', true)
                ->first();

            if (! $config) {
                throw new RuntimeException(Messages::get('payment', 'no_bank_config'));
            }

            $payment = Payment::forceCreate([
                'tenant_id' => $booking->tenant_id,
                'booking_id' => $booking->id,
                'method' => PaymentMethod::VietQr,
                'amount' => $booking->deposit_amount,
                'status' => PaymentStatus::Awaiting,
                'memo_ref' => $booking->code,
                'recipient_bank_config_id' => $config->id,
                'recipient_provider' => $config->provider,
                'recipient_bank_bin' => $config->bank_bin,
                'recipient_account_number' => $config->account_number,
                'recipient_account_name' => $config->account_name,
            ]);
        }

        $recipient = $this->recipientFor($payment, $booking);

        return [
            'payment' => $payment,
            'qr' => VietQr::payload($recipient['bank_bin'], $recipient['account_number'], (int) $payment->amount, $payment->memo_ref),
            'amount' => (int) $payment->amount,
            'memo' => $payment->memo_ref,
            'account' => [
                'bank_bin' => $recipient['bank_bin'],
                'number' => $recipient['account_number'],
                'name' => $recipient['account_name'],
            ],
        ];
    }

    /** @return array{bank_bin: string, account_number: string, account_name: string} */
    private function recipientFor(Payment $payment, Booking $booking): array
    {
        if ($payment->recipient_bank_bin && $payment->recipient_account_number && $payment->recipient_account_name) {
            return [
                'bank_bin' => $payment->recipient_bank_bin,
                'account_number' => $payment->recipient_account_number,
                'account_name' => $payment->recipient_account_name,
            ];
        }

        // Legacy deposits predate the immutable recipient snapshot and retain the previous safe
        // behavior: use the current active account, rather than guessing historical recipient data.
        $config = TenantBankConfig::where('tenant_id', $booking->tenant_id)
            ->where('active', true)
            ->first();

        if (! $config) {
            throw new RuntimeException(Messages::get('payment', 'no_bank_config'));
        }

        return [
            'bank_bin' => $config->bank_bin,
            'account_number' => $config->account_number,
            'account_name' => $config->account_name,
        ];
    }

    /**
     * Request a refund against a settled payment. The ledger must conserve: the SUM of all
     * non-void refunds for a payment can never exceed the immutable payment amount, so the payment
     * row is locked and prior refunds are summed inside one transaction (docs/11 #11).
     */
    public function requestRefund(Payment $payment, int $amount, CancelReason $reason): Refund
    {
        return DB::transaction(function () use ($payment, $amount, $reason): Refund {
            $locked = Payment::query()
                ->where('tenant_id', $payment->tenant_id)
                ->lockForUpdate()
                ->findOrFail($payment->getKey());

            // Money must have actually arrived. An awaiting deposit has collected nothing to return.
            if (! in_array($locked->status, [PaymentStatus::Matched, PaymentStatus::Orphaned], true)) {
                throw new RuntimeException("Cannot refund payment [{$locked->id}] in status [{$locked->status->value}].");
            }

            $alreadyRefunded = (int) Refund::query()
                ->where('tenant_id', $locked->tenant_id)
                ->where('payment_id', $locked->id)
                ->whereIn('status', [RefundStatus::Requested, RefundStatus::Done])
                ->sum('amount');

            $remaining = (int) $locked->amount - $alreadyRefunded;

            if ($amount <= 0 || $amount > $remaining) {
                throw new RuntimeException('Refund amount must be positive and cannot exceed the matched payment.');
            }

            return Refund::forceCreate([
                'tenant_id' => $locked->tenant_id,
                'payment_id' => $locked->id,
                'amount' => $amount,
                'reason' => $reason,
                'method' => RefundMethod::ManualBank,
                'status' => RefundStatus::Requested,
            ]);
        });
    }

    /** Settle a requested refund exactly once; a resolved row keeps its original audit trail. */
    public function markRefundDone(Refund $refund, ?int $resolvedBy = null): void
    {
        DB::transaction(function () use ($refund, $resolvedBy): void {
            $locked = Refund::query()
                ->where('tenant_id', $refund->tenant_id)
                ->lockForUpdate()
                ->findOrFail($refund->getKey());

            if ($locked->status !== RefundStatus::Requested) {
                return;
            }

            $locked->forceFill([
                'status' => RefundStatus::Done,
                'resolved_at' => now(),
                'resolved_by' => $resolvedBy,
            ])->save();

            $refund->setRawAttributes($locked->getAttributes(), true);
        });
    }
}
