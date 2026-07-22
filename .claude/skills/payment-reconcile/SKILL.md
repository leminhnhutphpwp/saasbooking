---
name: payment-reconcile
description: VietQR deposit + automatic bank reconciliation (SePay/Casso), idempotency, and the three reconcile branches
---

# Payment & Reconcile — SÂN

Vietnam has no authorize/capture like Stripe — money arrives immediately or not at all, and reconciliation is asynchronous. So **deposit collection = VietQR bank transfer + automatic matching**, and **refunds are first-class**, not an exception.

## Deposit flow

1. `PaymentService::initDeposit(booking, amount)` returns a VietQR payload; the transfer **memo = `bookings.code`** (e.g. `SAN-3F7K`).
2. Customer transfers via their banking app.
3. SePay/Casso webhook → `Webhook\BankReconcileController` → `ReconcileService::ingest(rawTxn)`.

## Idempotency (by DB constraint, not if-checks)

- `bank_txn_inbox` and `payments` both carry `UNIQUE(bank_txn_id)`. A duplicate webhook fails the insert → ACK and stop.
- Match by **memo containing `booking.code`** (a unique reference), then verify amount. **Never** match blindly by amount — two bookings can share the same price.
- Amount mismatch → leave for the owner to resolve; do not auto-confirm.

## The three branches (in `ReconcileService::ingest`)

| Booking state when money lands | Action |
|---|---|
| `pending_deposit`, still within hold | `BookingService::confirmDeposit()` → confirmed |
| expired hold but the slot is still free | **grace re-confirm** (customer paid, slot open — no reason to reject) |
| expired and the slot was lost | `payment = orphaned` + auto-create a `refund` + notify both sides — **never silently keep the money** |

## Refunds are a separate ledger

`refunds` rows point to a `payment`; `payments.amount` is **immutable**. Partial refunds = multiple rows, `SUM(refund.amount) <= payment.amount`. Vietnamese deposits are refunded by the owner transferring back (`method = 'manual_bank'`), surfaced as an aging TODO in the dashboard.

## When to use

- Implementing/ reviewing the webhook, matching, or refund logic.
- Debugging "money in but booking not confirmed", duplicate credit, or wrong-booking match.
- Writing reconcile Feature tests (duplicate webhook, the 3 branches).

## Related docs

- `docs/07-luong-du-lieu.md` — deposit + reconcile + cancellation flows (sequence diagrams)
- `docs/08-thiet-ke-module-chi-tiet.md` §4 — PaymentService / ReconcileService interface
- `docs/11-diem-vo.md` — #7 (reconcile dup/mis-match), #8 (money after hold expiry), #11 (refund ledger)
