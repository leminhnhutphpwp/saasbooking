---
id: T03
title: Serialize hold expiry and payment settlement
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: fix/dev-vite-service
scope:
  - apps/app/app/Services/Booking/BookingService.php
  - apps/app/app/Services/Payment/ReconcileService.php
  - apps/app/tests/Feature/Booking/BookingLifecycleTest.php
  - apps/app/tests/Feature/Payment/ReconcileTest.php
updated: 2026-08-03
---

## Goal
Prevent an expiry worker from releasing a booking being settled, and serialize automatic or manual reconciliation so repeated delivery cannot apply settlement twice.

## Context / references
- `.claude/skills/booking-engine/SKILL.md`
- `.claude/skills/payment-flow/SKILL.md`

## Acceptance criteria
- [x] Hold expiry locks and revalidates the booking state before releasing slots.
- [x] Automatic and manual settlement lock inbox, payment, and booking state before transitions.
- [x] Focused PostgreSQL feature coverage proves expiry cannot undo confirmation and duplicate processing remains idempotent.

## Out of scope (do NOT do here)
- Public booking controllers, routes, and frontend files.
- A second slot-overlap checker.

## Verification (agent fills in before setting in-review)
- [x] Relevant PostgreSQL feature tests and full suite pass (230 tests).

## Log
- 2026-08-03 · claimed by opencode; backend race scope split from T01 without changing its implementation files.
- 2026-08-03 · added locked expiry and reconciliation transitions plus focused lifecycle and duplicate-settlement coverage; test command blocked by Docker file-sharing policy.
- 2026-08-03 · Docker Desktop sharing repaired; full PostgreSQL suite passes.
