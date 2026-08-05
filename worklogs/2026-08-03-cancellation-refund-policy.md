# Cancellation Refund Policy

## Goal
Implement cancellation that releases inventory and records policy-eligible matched-payment refunds as separate ledger rows.

## Changed
- `BookingService::cancel()` locks the booking, releases it once, evaluates its cancellation-policy snapshot, and calls `PaymentService` for a requested manual refund.
- Added a signed public status-link cancellation route and outcome display.
- Added PostgreSQL feature coverage for partial, late, duplicate, and signed cancellation cases.

## Decisions
- Refunds are calculated from the historical booking snapshot and capped at the immutable matched payment amount.
- A repeated cancellation is a no-op, so it cannot release twice or add a second refund.

## Next
- Review T04 with the in-review T01/T03 changes before merging.
