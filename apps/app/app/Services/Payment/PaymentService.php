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
        $config = TenantBankConfig::where('tenant_id', $booking->tenant_id)
            ->where('active', true)
            ->first();

        if (! $config) {
            throw new RuntimeException(Messages::get('payment', 'no_bank_config'));
        }

        // amount/status/tenant_id are not mass-assignable (audit #10) — build explicitly.
        $payment = Payment::query()
            ->where('tenant_id', $booking->tenant_id)
            ->where('booking_id', $booking->id)
            ->where('method', PaymentMethod::VietQr)
            ->first();

        if (! $payment) {
            $payment = Payment::forceCreate([
                'tenant_id' => $booking->tenant_id,
                'booking_id' => $booking->id,
                'method' => PaymentMethod::VietQr,
                'amount' => $booking->deposit_amount,
                'status' => PaymentStatus::Awaiting,
                'memo_ref' => $booking->code,
            ]);
        }

        return [
            'payment' => $payment,
            'qr' => VietQr::payload($config->bank_bin, $config->account_number, (int) $payment->amount, $payment->memo_ref),
            'amount' => (int) $payment->amount,
            'memo' => $payment->memo_ref,
            'account' => [
                'bank_bin' => $config->bank_bin,
                'number' => $config->account_number,
                'name' => $config->account_name,
            ],
        ];
    }

    public function requestRefund(Payment $payment, int $amount, CancelReason $reason): Refund
    {
        return Refund::forceCreate([
            'tenant_id' => $payment->tenant_id,
            'payment_id' => $payment->id,
            'amount' => $amount,
            'reason' => $reason,
            'method' => RefundMethod::ManualBank,
            'status' => RefundStatus::Requested,
        ]);
    }

    public function markRefundDone(Refund $refund, ?int $resolvedBy = null): void
    {
        $refund->forceFill([
            'status' => RefundStatus::Done,
            'resolved_at' => now(),
            'resolved_by' => $resolvedBy,
        ])->save();
    }
}
