# Database integrity payment ledger

## Goal
Add database enforcement for documented money, time-window, payment/refund tenant-reference, and ledger invariants.

## Changed
- Added non-negative money and ordered time-window PostgreSQL checks.
- Added the composite refund-to-payment foreign key, immutable payment amounts, and cumulative refund cap trigger.
- Added direct PostgreSQL-write tests for each critical guard.
- Recorded RLS as a separate follow-up because it needs an application database role and per-request session context design.

## Decisions
- Checks and the new composite foreign key are `NOT VALID`: new writes are protected without blocking rollout on pre-existing rows. Validate them after an operational data audit.
- Refund trigger locks the parent payment before calculating the ledger total to serialize concurrent refund requests.

## Next
- Re-run the focused and full suites once the shared `san_test` schema is no longer being concurrently reset. The focused suite passed 5 tests / 8 assertions before its final direct-payment negative-amount assertion was added.
- Plan RLS separately; it is not safe to enable without the required connection/session-context design.
