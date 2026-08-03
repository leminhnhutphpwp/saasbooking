---
id: T04
title: Cancellation with refund policy snapshots
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: feat/cancellation-refund-policy
scope:
  - apps/app/app/Services/Booking/BookingService.php # narrow unavoidable overlap with T03
  - apps/app/app/Services/Payment/PaymentService.php
  - apps/app/app/Http/Controllers/Public/PublicBookingCancellationController.php
  - apps/app/app/Http/Controllers/Public/PublicBookingController.php # narrow unavoidable overlap with T01
  - apps/app/routes/web.php
  - apps/app/resources/js/Pages/Public/Booking/Status.jsx
  - apps/app/tests/Feature/Booking/CancellationTest.php
  - tasks/BOARD.md
  - tasks/T04-cancellation-refund-policy.md
  - worklogs/2026-08-03-cancellation-refund-policy.md
updated: 2026-08-03
---

## Goal
Cancel a booking through the booking lifecycle service, calculate the refund from its immutable cancellation-policy snapshot, and record any eligible matched-payment refund as a separate requested ledger row.

## Context / references
- `.claude/skills/booking-engine/SKILL.md`
- `.claude/skills/payment-flow/SKILL.md`
- `docs/02-yeu-cau-chuc-nang.md` UC-04
- `docs/07-luong-du-lieu.md` cancellation flow

## Acceptance criteria
- [x] Cancellation releases inventory through `BookingService` and cannot be applied twice.
- [x] Refund amount is calculated solely from `cancel_policy_snapshot`; matched eligible payments get at most one requested refund ledger row.
- [x] Manager cancellation flow is tenant-scoped; the signed public status flow exposes secure cancellation where it fits existing behavior.
- [x] Focused PostgreSQL feature tests, Pint, and frontend build pass.

## Out of scope (do NOT do here)
- New payment methods or payment amount mutation.
- A second overlap checker or bulk cancellation.
- Changes to T02 UI files or T03 reconciliation behavior.

## Verification (agent fills in before setting in-review)
- [x] Targeted Pint passes for all changed PHP files.
- [x] PostgreSQL: `CancellationTest`, booking lifecycle/public, manager workbench, and reconciliation tests pass (42 tests, 179 assertions).
- [x] `npm run build` passes in the Vite container.

## Log
- 2026-08-03 · claimed by opencode; narrow `BookingService` overlap with T03 and public-status overlap with T01 are necessary for the required cancellation transition and outcome.
- 2026-08-03 · ready for review; snapshot-based cancellation, requested-refund ledger, and signed public cancellation path implemented and verified.
