---
name: payment-flow
description: Payment flow — VietQR deposit, bank reconciliation (SePay/Casso), idempotency, 3 reconcile branches, refunds
---

# Payment Flow — SÂN

Vietnam has no authorize/capture like Stripe. Money arrives immediately or not at all. Reconciliation is asynchronous via bank webhooks (SePay / Casso). Deposits are collected via VietQR bank transfer; the unique reference is `bookings.code` (e.g. `SAN-3F7K`).

## Tables owned

| Table | Purpose |
|---|---|
| `payments` | One row per deposit/refund attempt. `amount` is **immutable** after creation. |
| `bank_txn_inbox` | Raw bank transactions from SePay/Casso webhooks. Idempotency barrier. |
| `refunds` | Separate refund ledger. Points to `payments`. Partial refunds = multiple rows. |
| `tenant_bank_config` | Per-tenant bank account details for VietQR generation. |

All tenant-scoped. `payments.amount` is never updated — refunds create new rows.

## Deposit flow (end-to-end)

```
1. BookingService::createHold()
   → booking.status = 'pending_deposit'
   → booking.hold_expires_at = now + 10 min

2. PaymentService::initDeposit(booking, amount)
   → creates Payment row (status=pending, bank_txn_id=null)
   → returns VietQR payload (account, amount, memo=booking.code)

3. Customer opens banking app → scans QR → transfers

4. Bank webhook → Webhook\BankReconcileController
   → ReconcileService::ingest($rawTxn)

5. ReconcileService matches + confirms (see 3 branches below)
```

## Idempotency (DB constraint, not application logic)

```sql
-- bank_txn_inbox
UNIQUE(bank_txn_id)

-- payments
UNIQUE(bank_txn_id)
```

Duplicate webhook → `INSERT` fails unique constraint → ACK and stop. No if-check, no race condition.

**Match logic:**
1. Find `bookings.code` inside the bank transaction memo (e.g. `SAN-3F7K`).
2. Load booking by `code`.
3. Verify `payment.amount == booking.deposit_amount`.
4. Amount mismatch → leave for owner to resolve (do NOT auto-confirm).

**Never match blindly by amount** — two bookings can share the same price.

## The 3 reconcile branches

Inside `ReconcileService::ingest()`:

| Branch | Booking state when money lands | Action |
|---|---|---|
| **1 — Happy path** | `pending_deposit`, within hold window | `BookingService::confirmDeposit()` → status = `confirmed` |
| **2 — Grace re-confirm** | Expired hold, but slot is still free | Confirm anyway (customer paid, slot open — no reason to reject) |
| **3 — Orphaned + refund** | Expired hold, slot already lost to another booking | Mark `payment.orphaned`, auto-create `refund` row, notify owner — **never silently keep the money** |

```php
// Branch 1: happy path
if ($booking->status === BookingStatus::PendingDeposit && $booking->hold_expires_at->isFuture()) {
    $this->bookings->confirmDeposit($booking);
    return;
}

// Branch 2: grace re-confirm
if ($booking->status === BookingStatus::Expired && $this->slotStillFree($booking)) {
    $this->bookings->confirmDeposit($booking);
    return;
}

// Branch 3: orphaned + refund
$this->bookings->markPaymentOrphaned($booking);
Refund::forceCreate([
    'tenant_id' => $booking->tenant_id,
    'payment_id' => $payment->id,
    'amount' => $payment->amount,
    'reason' => 'slot_lost',
]);
```

## Refunds — separate ledger

- `payments.amount` is **immutable**. Never UPDATE a payment row.
- Partial refunds = multiple `refunds` rows. `SUM(refunds.amount) <= payments.amount`.
- Refunds in Vietnam are manual bank transfers back by the owner.
- Surfaced as an aging TODO in the manager dashboard.

```php
Refund::forceCreate([
    'tenant_id' => $booking->tenant_id,
    'payment_id' => $payment->id,
    'amount' => $refundAmount,
    'reason' => 'customer_request',
]);
```

## Cancellation → refund flow

```php
BookingService::cancel($booking, CancelReason $reason)
    → releases slot (driver->release)
    → status = cancelled
    → event(BookingCancelled)

// Owner sees refund TODO in dashboard
// Owner transfers money back manually
// Owner marks refund as completed in UI
```

## When to use

- Implementing or reviewing webhook handling, matching, or refund logic.
- Debugging "money in but booking not confirmed", duplicate credit, or wrong-booking match.
- Writing reconcile Feature tests (duplicate webhook, the 3 branches, amount mismatch).
- Adding a new payment method (e.g. MoMo in Phase 2) — follow the same idempotent pattern.

## Related docs

- `docs/07-luong-du-lieu.md` — deposit + reconcile + cancellation flows (sequence diagrams)
- `docs/08-thiet-ke-module-chi-tiet.md` §4 — PaymentService / ReconcileService interface
- `docs/11-diem-vo.md` — #7 (reconcile dup/mis-match), #8 (money after hold expiry), #11 (refund ledger)
