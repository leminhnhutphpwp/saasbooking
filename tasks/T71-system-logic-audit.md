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
  - worklogs/2026-08-16-system-logic-audit-batch-1.md
  - worklogs/2026-08-16-system-logic-audit-batch-3.md
  updated: 2026-08-16
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

- [x] Map each module's public methods and verify against its business contract
- [x] Check tenant scoping / WorkingTenant usage on every query and mutation
- [x] Verify BookingService is the only concurrency chokepoint; no second anti-overlap path
- [x] Verify price/deposit/policy snapshotting at booking time
- [x] Check VND stored as integer BIGINT, timestamptz, recurring wall time + tz
- [x] Verify status enums/state machines; every transition audited
- [x] Find and report redundant/dead code, duplicated helpers, unused props
- [x] Fix confirmed bugs with minimal changes + failing test first — batch 1 (C1,H1,C4,C2,C3) and
      batch 3 (H6,H8) done; H2/H4/H5/H7 revised as false positives; RLS split to its own task
- [x] Full test suite passes; frontend build clean

## Audit outcome

Invariants that held: single anti-overlap path (exclusion constraint is the only arbiter),
integer VND end-to-end with correct `intdiv` rounding, price/deposit/cancel-policy snapshotting,
half-open timestamp ranges in the booking queries.

**Storage convention (verified empirically, 2026-08-16):** Laravel formats every Carbon binding
*without a timezone offset* and the Postgres connection is UTC, so `timestamptz` columns store the
**venue wall-clock digits as UTC** ("wall-as-UTC"). A `parse('19:00', $tz)` and a naive
`parse('19:00')` both land as `19:00+00:00`. Every read path (filters, `DATE()`, `now($tz)` in PHP)
drops the offset the same way, so the system is internally consistent. **Do not "convert" timezone
in reports** — that would DESYNC the read path from the write path and corrupt reporting.

Confirmed defects, fixed in batch 1:

- C1 · public booking stored raw phone → one customer fragmented into up to three records
- H1 · `CustomerController::update` edited by phone, not the bound customer → duplicates on edit
- C4 · refunds could exceed the payment in total, and could be raised against unpaid money
- C2 · `extendHorizon` discarded conflicts and advanced the cursor past them → sessions lost forever
- C3 · `confirmDeposit` race in both walk-in paths → HTTP 500 plus an orphaned hold

Confirmed defects, fixed in batch 3 (reporting / performance):

- H6 · `ReportController::topCustomers` double-joined `bookings` + `booking_slots` with no `COUNT(DISTINCT)`
      and no date filter on the slot join → `booking_count` inflated by slot count and `total_spent`
      could pull out-of-range slots. Fixed: single join with date-bounded `booking_slots` and
      `COUNT(DISTINCT bookings.id)`.
- H8 · `AvailabilityService::search` ran `openingWindows` + `booking_slots` + `blackouts` queries
      **per court** (≈3N). Refactored to three tenant-scoped batch queries grouped in memory; an
      8-court search now runs ≤6 queries (was ~24). Behavior preserved (wall-as-UTC).

Audit findings REVISED as false positives under the wall-as-UTC convention (NOT bugs — do not change):

- H2 · dashboard `confirmedCount` is correctly named and counts `Confirmed`; no "completed" metric exists.
- H4 · report day boundary `DATE(start_at)` returns the wall date — correct under wall-as-UTC.
- H5 · occupancy/utilization parse opening windows naively — consistent with stored wall-as-UTC.
- H7 · weekly deposit filters `matched_at` naively — consistent; not a tz bug.

Confirmed defect, deferred to its OWN scoped task (architectural, not a quick fix):

- RLS · `SeriesService::extendHorizon`, `BookingService` job query, `SendBookingReminders` iterate
  **all tenants** and rely on RLS with no `app.tenant_id` set in the job context. Under the runtime
  role (`NOBYPASSRLS`) an unset `app.tenant_id` makes these return zero rows — the rolling horizon and
  reminders would silently no-op in production. This is cross-tenant job design, not a missing
  `where('tenant_id')`, so it needs a dedicated task (likely a job runtime role / per-tenant context
  loop). Note: tests currently run on a connection that bypasses RLS, which is why this is invisible
  in the suite. `FORCE ROW LEVEL SECURITY` alone is insufficient and risky without resolving this.

## Out of scope (do NOT do here)

- New features or UI redesigns
- Schema changes unless required to fix a confirmed bug
- Refactoring that is not strictly required to fix confirmed issues
- Backfill/merge of customer duplicates already created by C1 (needs its own reviewed task)

## Verification (agent fills in before setting in-review)

- [x] `npx vite build` passes
- [x] `php artisan test` full suite passes — 326 passed, 1753 assertions (baseline 314/1707; +2 batch-3 tests)
- [x] Pint clean on changed PHP (AvailabilityService, ReportControllerTest fixed this batch; 2
      pre-existing failures in ReportController + OperationalMetricsService left untouched per scope)
- [ ] Browser check of affected pages

## Log

- 2026-08-11 · claimed by OpenCode to audit system logic and business operations.
- 2026-08-16 · audit completed; batch 1 remediation landed (C1, H1, C4, C2, C3) with 10 new
  tests written failing-first. Remaining confirmed defects listed above and in the worklog.
- 2026-08-16 · batch 3 landed (H6 top-customer double join, H8 availability N+1). Verified the
  wall-as-UTC storage convention empirically (Laravel drops Carbon offset → naive UTC); this REVISED
  H2/H4/H5/H7 from "defects" to false positives — fixing them would corrupt reporting. RLS cross-tenant
  job issue split to its own task. Worklog: worklogs/2026-08-16-system-logic-audit-batch-3.md.
- 2026-08-16 · RLS cross-tenant job fixed in T72 (extendHorizon + expireStaleHolds now set per-tenant
  RlsTenantContext; verified they returned 0 rows under san_app RLS pre-fix). 328 tests pass.
  Worklog: worklogs/2026-08-16-rls-job-context.md.
