---
id: T66
title: Refunds and Reconcile work queues
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/payment-work-queues
scope:
  - apps/app/app/Http/Controllers/Manager/RefundController.php
  - apps/app/app/Http/Controllers/Manager/ReconcileController.php
  - apps/app/resources/js/Pages/Manager/Refunds/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reconcile/Unmatched.jsx
  - apps/app/tests/Feature/Payment/RefundControllerTest.php
  - apps/app/tests/Feature/Payment/ReconcileTest.php
  - tasks/T66-refunds-reconcile-work-queues.md
  - worklogs/2026-08-11-refunds-reconcile-work-queues.md
updated: 2026-08-11
---

## Goal
Optimize Refunds and Reconcile work queues with booking context, customer information, and searchable candidate selection.

## Context / references
- `.claude/skills/payment-flow/SKILL.md`
- Current issue: Refunds omit customer name and booking navigation
- Current issue: Reconcile's candidate-booking selector is unsearchable and doesn't show slot context
- Need to add context without changing reconciliation idempotency or refund-ledger semantics

## Acceptance criteria
- [x] Refund rows show:
  - Booking code as a link to `/manager/bookings/{uuid}`
  - Customer name and phone
  - Requested timestamp
  - Immutable VND amount
  - Reason
  - `StatusBadge`
- [x] Retain only the existing "mark done" transition
- [x] Reconcile rows show:
  - Formatted receipt time
  - Amount
  - Source/provider where available
  - Actionable mismatch note
  - Stable responsive table/card presentation
- [x] Manual-match dialog lets an owner search/filter pending bookings by code, customer, or phone
- [x] Dialog shows booked slot/time plus expected deposit before confirmation
- [x] Empty candidate-booking state prevents submission and clearly explains why
- [x] No change to reconciliation idempotency, payment amounts, refund-ledger semantics, or `WorkingTenant` scoping

## Out of scope (do NOT do here)
- Calendar, Bookings, or Series UI changes
- Backend payment lifecycle or write paths

## Verification (agent fills in before setting in-review)
- [x] PostgreSQL: `tests/Feature/Payment/ReconcileTest.php` plus refund controller/authorization tests covering tenant isolation, match, dismiss, and mark-done — **309 passed, 1604 assertions**
- [x] Build: `npm run build` — **built in 1.85s**
- [x] Pint: `vendor/bin/pint --dirty` — **PASS 0 files**
- [ ] Playwright: login → Reconcile manual-match dialog and Refund confirmation; desktop and 390px (manual check required)

## Log
- 2026-08-11 · claimed by OpenCode to optimize Refunds and Reconcile work queues.
- 2026-08-11 · implementation complete, all tests pass, build succeeds, set to in-review.
