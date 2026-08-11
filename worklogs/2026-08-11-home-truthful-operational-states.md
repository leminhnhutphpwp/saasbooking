# 2026-08-11 · Home truthful operational states (T62)

## Goal
Make Home dashboard display truthful operational metrics using T60's OperationalMetricsService, with proper states for no active courts, missing opening coverage, no bookings, and attention queue.

## Changed
- **HomeController.php**: Injected OperationalMetricsService, replaced hardcoded 18-hour capacity with `occupancy()`, replaced inline revenue queries with `revenueByDay()` and `totalRevenue()`, added operational-state flags (no_active_courts, no_opening_coverage, no_bookings, no_exceptions), separated attention counts from preview items, capped upcoming bookings to 5 after slot flattening
- **Index.jsx**: Added operational state props, rendered distinct empty states for each condition, fixed refunds link to `/manager/refunds`, showed full attention counts without truncation, distinguished "no revenue" from "no configuration"
- **HomeControllerTest.php**: Created 10 feature tests covering tenant isolation, released-slot exclusion, real opening-hour denominator, preview/count separation, multi-slot weekly revenue, and all operational-state flags

## Decisions
- Used `OperationalMetricsService::occupancy()` which respects opening rules and blackouts instead of hardcoded 18-hour assumption
- Separated attention counts (full) from preview items (capped at 5) to show truthful totals while keeping UI compact
- Flattened booking slots before capping to 5 items so multi-slot bookings display correctly
- Added explicit operational-state props so frontend can distinguish between "no data" and "missing configuration"
- Fixed refunds action link from `/manager/reconcile` to `/manager/refunds` (correct destination)

## Next
- Browser verification at 390px and 1440px (browser unavailable during implementation)
- Consider adding visual regression tests for empty states

## Test results
- HomeControllerTest: 10/10 passed (128 assertions)
- Full suite: 289/289 passed (1337 assertions)
- Frontend build: success
- Pint: 2 files fixed (style issues)
