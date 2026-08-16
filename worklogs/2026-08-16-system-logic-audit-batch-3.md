---
date: 2026-08-16
task: T71 (batch 3 — reporting & performance)
branch: feat/manager-analytics-overhaul
---

## Goal
Remediate the reporting / customer-stats / performance defects from the T71 audit (batch 3):
H2, H4, H5, H6, H7, H8, and assess RLS.

## Changed
- `app/Services/Booking/AvailabilityService.php` — `search()` no longer queries per court. Three
  tenant-scoped batch queries (opening rules, busy slots, blackouts) are loaded once and grouped
  in memory. Removed the now-unused `CatalogService` dependency. Behavior preserved (wall-as-UTC).
- `app/Http/Controllers/Manager/ReportController.php` — `topCustomers` rewritten to a single
  `bookings ⋈ booking_slots` join with a date-bounded slot condition and `COUNT(DISTINCT bookings.id)`
  (was inflating `booking_count` by slot count and could pull out-of-range slots into `total_spent`).
- `tests/Feature/Manager/ReportControllerTest.php` — new `test_top_customer_booking_count_not_inflated_by_slots`
  (failing-first: asserted `booking_count = 2` for a customer with two bookings / three slots; saw 3).
- `tests/Feature/Booking/AvailabilityTest.php` — new `test_search_runs_bounded_queries_regardless_of_court_count`
  (failing-first: asserts ≤6 queries for 8 courts via `DB::listen`).

## Decisions (important — corrected the audit)
Empirically verified the storage convention: **Laravel formats every Carbon binding without a
timezone offset and the Postgres connection is UTC**, so `timestamptz` columns store the venue
wall-clock digits as UTC ("wall-as-UTC"). A tz-aware `parse('19:00', $tz)` and a naive
`parse('19:00')` both persist as `19:00+00:00`. The audit's H4/H5/H7 assumed absolute tz-aware
storage and concluded the naive reads were bugs — but every read path drops the offset identically,
so the system is internally consistent.

Consequence: **H2, H4, H5, H7 are FALSE POSITIVES.** "Fixing" them (adding tz conversion) would
DESYNC the read path from the write path and corrupt reporting. They are documented as such in T71
and must NOT be changed. Only H6 (join math) and H8 (N+1) were genuine defects and are fixed.

RLS: `SeriesService::extendHorizon`, a `BookingService` job query, and `SendBookingReminders`
iterate ALL tenants and rely on RLS with no `app.tenant_id` set in the job context. Under the runtime
role (`NOBYPASSRLS`) an unset `app.tenant_id` makes these return zero rows → rolling horizon and
reminders silently no-op in production. This is cross-tenant job design, NOT a missing
`where('tenant_id')`, so it is split to its own scoped task rather than patched here. Note the test
suite runs on a connection that bypasses RLS, hiding this gap.

## Verification
- `php artisan test` — 326 passed, 1753 assertions (was 324/1738; +2 new tests).
- Pint — AvailabilityService + ReportControllerTest clean; 2 pre-existing failures in
  ReportController + OperationalMetricsService left untouched (pre-existing, out of batch-3 scope).
- `npx vite build` — passes.

## Next
1. RLS cross-tenant job task: decide job runtime context (per-tenant `app.tenant_id` loop, or a
   dedicated bypass role) so `extendHorizon` / reminders actually run; add a test on an RLS-enforced
   connection to catch this class of gap.
2. Customer duplicate backfill (C1 fallout) — own reviewed task; gated on a dry-run.
3. Browser check of manager reports + calendar pages (dashboard already covered by unit tests).
4. Run the pre-existing Pint failures (ReportController, OperationalMetricsService, BookingService)
   down in a dedicated cleanup task if desired.
