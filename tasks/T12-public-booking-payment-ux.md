---
id: T12
title: Public booking payment clarity
status: in-review
owner: opencode
priority: P1
depends_on: [T03, T04]
branch: feat/public-booking-payment-ux
scope:
  - apps/app/app/Http/Controllers/Public/PublicBookingController.php # read-only prop shaping; extends T01/T04 work
  - apps/app/resources/js/Pages/Public/Booking/Show.jsx
  - apps/app/resources/js/Pages/Public/Booking/Status.jsx # extends T04 cancellation outcome presentation
  - apps/app/tests/Feature/Booking/PublicBookingPaymentPresentationTest.php
  - tasks/BOARD.md
  - tasks/T12-public-booking-payment-ux.md
  - worklogs/2026-08-03-public-booking-payment-ux.md
updated: 2026-08-03
---

## Goal
Make the public booking hold experience distinguish the total rental, deposit payable now, remaining balance, and hold deadline using only booking snapshots already exposed by the public controller.

## Context / references
- `.claude/skills/booking-engine/SKILL.md`
- `.claude/skills/payment-flow/SKILL.md`
- `tasks/T03-serialize-hold-expiry-payment-settlement.md`
- `tasks/T04-cancellation-refund-policy.md`

## Acceptance criteria
- [x] Public hold page labels each amount and its settlement meaning clearly.
- [x] Hold countdown/deadline is accessible and handles expiry without misleading payment guidance.
- [x] Focused Inertia feature coverage verifies the public snapshot contract.

## Out of scope (do NOT do here)
- Cancellation route or existing Playwright suite owned by T04/T11.
- New payment providers, policies, or changes to booking/payment business logic.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T vite npm run build` passes
- [x] PostgreSQL: public booking, cancellation, and presentation tests pass (12 tests, 107 assertions)
- [x] Chromium E2E suite passes (4 tests); status summary checked at 390px and 1440px
- [x] Targeted Pint passes

## Log
- 2026-08-03 · claimed by opencode; T01/T04's controller and status changes are retained and extended only to serialize and present their existing snapshots. T11's E2E suite remains untouched.
- 2026-08-03 · ready for review; amount/deadline/policy UI uses only booking snapshots and preserves all booking, reconciliation, and cancellation behavior.
