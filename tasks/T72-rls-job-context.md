---
id: T72
title: RLS cross-tenant job context (extendHorizon + expireStaleHolds)
status: claimed
owner: "OpenCode"
priority: P1
depends_on: [T71]
branch: feat/rls-job-context
scope:
  - apps/app/app/Services/Booking/SeriesService.php
  - apps/app/app/Services/Booking/BookingService.php
  - apps/app/app/Jobs/SendBookingReminders.php
  - apps/app/tests/Feature/Booking/SeriesTest.php
  - apps/app/tests/Feature/Booking/BookingServiceTest.php
  - apps/app/app/Support/RlsTenantContext.php
updated: 2026-08-16
---

## Goal
Make the two cross-tenant job sweeps (`SeriesService::extendHorizon`,
`BookingService::expireStaleHolds`) run correctly under Row-Level Security. Today they query
tenant-scoped tables with no `app.tenant_id` context, so under the runtime role `san_app`
(`NOBYPASSRLS`) the RLS policy `tenant_id = app_current_tenant_id()` evaluates to `tenant_id = NULL`
→ **zero rows returned** → the rolling horizon and the stale-hold sweeper silently no-op in
production. `SendBookingReminders` already wraps each tenant in `RlsTenantContext::run` and is fine.

## Context / references
- Verified empirically (2026-08-16): `postgres` (test/migrator role) has `rolbypassrls=t`, `san_app`
  has `rolbypassrls=f`. Under `san_app` with `app.tenant_id` unset, `SELECT count(*) FROM
  recurring_series WHERE status='active'` returns 0; with it set to the tenant id it returns the
  correct count. Proof in worklogs/2026-08-16-system-logic-audit-batch-3.md (follow-up).
- The test suite runs on the `migrator` connection = `postgres` (BYPASSRLS), so it NEVER exercises
  RLS — which is exactly why this production bug is invisible in CI. A regression test must run the
  fixed code on the RLS-enforced `pgsql` (`san_app`) connection.
- Pattern to mirror: `app/Jobs/SendBookingReminders.php` enumerates `Tenant::query()->select('id')`
  and wraps each tenant's work in `RlsTenantContext::run($tenant->id, ...)`.
- T71 audit (deferred list) flagged this; H2/H4/H5/H7 from that same audit were REVISED to false
  positives — this one is genuine.

## Acceptance criteria
- [x] `extendHorizon()` enumerates every tenant and generates occurrences for each (per-tenant
      `RlsTenantContext::run`), not a single cross-tenant query with no context.
- [x] `expireStaleHolds()` expires holds per tenant under `RlsTenantContext::run`.
- [x] A failing-first regression test runs the service on the `pgsql` (`san_app`, RLS-enforced)
      connection and asserts occurrences are generated / holds expired; it FAILS on the pre-fix code
      (returns 0 rows under RLS) and PASSES on the fix.
- [x] `php artisan test` full suite passes; `npx vite build` passes.

## Out of scope (do NOT do here)
- Adding `FORCE ROW LEVEL SECURITY` (insufficient on its own; the real gap is the missing job context).
- New DB roles / connections; reuse the existing `RlsTenantContext` + `Tenant` enumeration.
- Changing `SendBookingReminders` (already correct — it already wraps each tenant in `RlsTenantContext`).
- Backfill / data repair.

## Verification
- [x] Regression tests on `pgsql` (san_app) connection: occurrences generated + stale hold expired
      under RLS. Both verified to FAIL on the pre-fix (context-less) code, PASS on the fix.
- [x] `php artisan test` full suite — 328 passed, 1756 assertions (baseline 324/1707; +2 RLS tests).
- [x] `npx vite build` passes.
- [x] Pint clean on touched files (SeriesService, BookingService, ExpireStaleHolds, 2 test files).

## Log
- 2026-08-16 · claimed by OpenCode; root cause verified on live `san_test` (postgres BYPASSRLS vs
  san_app NOBYPASSRLS; a context-less tenant-scoped query returns 0 rows under RLS).
- 2026-08-16 · fixed `SeriesService::extendHorizon` and `BookingService::expireStaleHolds` to
  enumerate `tenants` (no RLS policy) and run each tenant's work inside `RlsTenantContext::run`,
  mirroring `SendBookingReminders`. Simplified `ExpireStaleHolds` job to call the method directly
  (the method now owns the per-tenant context). Added two failing-first regression tests that run on
  the RLS-enforced `pgsql` connection (overriding its `database` to `san_test`, manual rollback to
  avoid polluting the shared DB). Confirmed both fail pre-fix, pass post-fix. Worklog:
  worklogs/2026-08-16-rls-job-context.md.
