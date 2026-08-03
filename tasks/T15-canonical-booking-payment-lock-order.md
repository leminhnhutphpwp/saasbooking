---
id: T15
title: Canonical booking and payment lock order
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: test/playwright-e2e
scope:
  - apps/app/app/Services/Booking/BookingService.php
  - apps/app/app/Services/Payment/ReconcileService.php
  - apps/app/tests/Feature/Payment/ReconcileTest.php
  - tasks/BOARD.md
  - tasks/T15-canonical-booking-payment-lock-order.md
  - worklogs/2026-08-03-canonical-booking-payment-lock-order.md
updated: 2026-08-03
---

## Goal
Remove the booking/payment lock-order inversion between cancellation and reconciliation without weakening their transactions, idempotency, tenant isolation, or immutable payment ledger.

## Context / references
- Reviewed P1 finding: `BookingService::cancel()` locks booking then payment while `ReconcileService::ingest()` locks payment then booking.
- `.claude/skills/booking-engine/SKILL.md`
- `.claude/skills/payment-flow/SKILL.md`
- `.claude/skills/tenant-isolation/SKILL.md`

## Acceptance criteria
- [ ] Lifecycle operations that need both rows lock booking before payment.
- [ ] Reconciliation remains tenant-scoped and idempotent; cancellation and late reconciliation safely create at most the appropriate refund ledger rows without mutating payment amounts.
- [ ] Focused PostgreSQL regression coverage, Pint, and relevant PostgreSQL suite pass.

## Out of scope (do NOT do here)
- Changes to cancellation policy or payment amounts.
- Removing transactions or inventory locking.

## Verification (agent fills in before setting in-review)
- [x] Focused PostgreSQL lifecycle suites: 23 tests, 121 assertions.
- [x] Full PostgreSQL suite: 262 tests, 1007 assertions.
- [x] Targeted Pint passes for `ReconcileService` and `ReconcileTest`; scoped `git diff --check` passes.

## Log
- 2026-08-03 · claimed by opencode for the reviewed P1 lock-order inversion.
- 2026-08-03 · ready for review; reconciliation now locks booking before payment and late payment after cancellation becomes an orphaned payment with a separate requested refund.
