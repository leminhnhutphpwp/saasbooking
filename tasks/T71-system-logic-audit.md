---
id: T71
title: System logic & business-operation audit
status: claimed
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/manager-analytics-overhaul
scope:
  - apps/app/app/Http/Controllers/Manager/
  - apps/app/app/Services/
  - apps/app/app/Models/
  - apps/app/app/Enums/
  - apps/app/resources/js/Pages/Manager/
  - apps/app/resources/js/Components/
  - apps/app/routes/web.php
  - apps/app/tests/
  - tasks/T71-system-logic-audit.md
  - worklogs/2026-08-11-system-logic-audit.md
updated: 2026-08-11
---

## Goal

Review the whole system for logic errors, method defects, and business-operation
misalignment — find bugs, redundancies, and violated invariants (tenant isolation,
booking concurrency, price snapshotting, VND integer money, status state machines).

## Context / references

- `CLAUDE.md` — six non-negotiable invariants
- `.claude/skills/architecture/SKILL.md`, `booking-engine`, `tenant-isolation`, `payment-flow`, `court-catalog`
- `docs/README.md` (read only relevant docs)
- Focus: booking lifecycle, availability, calendar, walk-in, customers, refunds/reconcile, series, reports/metrics, settings

## Acceptance criteria

- [ ] Map each module's public methods and verify against its business contract
- [ ] Check tenant scoping / WorkingTenant usage on every query and mutation
- [ ] Verify BookingService is the only concurrency chokepoint; no second anti-overlap path
- [ ] Verify price/deposit/policy snapshotting at booking time
- [ ] Check VND stored as integer BIGINT, timestamptz, recurring wall time + tz
- [ ] Verify status enums/state machines; every transition audited
- [ ] Find and report redundant/dead code, duplicated helpers, unused props
- [ ] Fix confirmed bugs with minimal changes + failing test first
- [ ] Full test suite passes; frontend build clean

## Out of scope (do NOT do here)

- New features or UI redesigns
- Schema changes unless required to fix a confirmed bug
- Refactoring that is not strictly required to fix confirmed issues

## Verification (agent fills in before setting in-review)

- [ ] `npx vite build` passes
- [ ] `php artisan test` full suite passes
- [ ] Pint clean on changed PHP
- [ ] Browser check of affected pages

## Log

- 2026-08-11 · claimed by OpenCode to audit system logic and business operations.
