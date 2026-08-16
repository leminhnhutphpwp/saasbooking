---
date: 2026-08-16
task: T72 (RLS cross-tenant job context)
branch: feat/rls-job-context
---

## Goal
Make the two cross-tenant job sweeps (`SeriesService::extendHorizon`,
`BookingService::expireStaleHolds`) actually run under Row-Level Security. Under the runtime role
`san_app` (`NOBYPASSRLS`) a context-less query against a tenant-scoped table hits the policy
`tenant_id = app_current_tenant_id()` → `tenant_id = NULL` → **zero rows**, so in production the
rolling horizon and the stale-hold sweeper silently no-op.

## Changed
- `app/Services/Booking/SeriesService.php` — `extendHorizon()` now enumerates `tenants` (no RLS
  policy on that table) and wraps each tenant's series generation in `RlsTenantContext::run`. Was a
  single context-less `RecurringSeries::query()->where('status','active')`.
- `app/Services/Booking/BookingService.php` — `expireStaleHolds()` now enumerates `tenants` and wraps
  each tenant's sweep in `RlsTenantContext::run`. Was a single context-less `Booking::query()`.
- `app/Jobs/ExpireStaleHolds.php` — simplified `handle()` to call `$bookings->expireStaleHolds()`
  directly; the method now owns the per-tenant RLS context (previously the job double-wrapped). Removed
  now-unused `Tenant` / `RlsTenantContext` imports.
- `tests/Feature/Booking/SeriesTest.php`, `tests/Feature/Booking/BookingLifecycleTest.php` — two
  failing-first regression tests that run the service on the RLS-enforced `pgsql` (`san_app`)
  connection (overriding `database.connections.pgsql.database` to `san_test`) and assert occurrences
  are generated / the stale hold is expired. They explicitly clear the leaked `app.tenant_id` between
  seeding (which needs context for RLS WITH CHECK inserts) and the call, so the tested code path is
  genuinely context-less until the fix sets it. Manual `beginTransaction`/`rollBack` keeps the seeded
  rows from committing to the shared `san_test` DB.

## Decisions
- `tenants` is intentionally excluded from the RLS policy list (`tenantTables` in the RLS migration),
  so enumerating it needs no context — this is the safe pivot for cross-tenant jobs.
- Reused the existing `RlsTenantContext` rather than adding a new role/connection. `SendBookingReminders`
  already used this pattern and was correct; the other two jobs now match.
- Verified empirically on `san_test`: `postgres` (test role) is `BYPASSRLS`; `san_app` (runtime role)
  is `NOBYPASSRLS`. A context-less `SELECT count(*) FROM recurring_series WHERE status='active'` as
  `san_app` returns 0; with `app.tenant_id` set it returns the right count.
- `FORCE ROW LEVEL SECURITY` was deliberately NOT added: it would not fix the missing job context and
  would risk blocking legitimate cross-tenant maintenance. The real defect was the missing context.
- The test-suite connection is `migrator` = `postgres` (BYPASSRLS), so it never exercised RLS — which
  is exactly why this production bug was invisible. The new tests switch to `pgsql` to catch it.

## Verification
- Full suite: 328 passed, 1756 assertions (baseline 314/1707; +2 RLS tests).
- Both new tests confirmed to FAIL on the pre-fix code (context-less queries → 0 rows) and PASS post-fix.
- `npx vite build` passes; Pint clean on touched files.

## Next
- Consider adding a CI connection that runs a subset of tests as `san_app` (RLS-enforced) to keep this
  class of gap visible going forward.
- The pre-existing `FORCE ROW LEVEL SECURITY` decision remains open but is independent of this fix.
