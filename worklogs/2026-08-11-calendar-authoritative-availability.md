# 2026-08-11 · Calendar authoritative availability (T63)

## Goal
Make Calendar display authoritative availability using AvailabilityService, respecting opening rules, blackouts, held/committed slots, and walk-in duration constraints.

## Changed
- **CalendarController.php**: Injected `AvailabilityService` and `CatalogService`. Replaced hardcoded 05:00-23:00 time slots with authoritative availability from `AvailabilityService::search()`. Added opening windows, free intervals with resolved pricing, and booked slots with UUID for deep-linking. Added duration parameter (60/90/120 min) support.
- **Index.jsx**: Removed hardcoded `DAY_START`/`DAY_END` constants. Grid now renders based on opening windows from props. Free intervals are actionable buttons, booked slots link to `/manager/bookings/{uuid}`, closed time is visually disabled. Added duration selector that updates availability in real-time. Mobile view shows court cards with free intervals and booked slots.
- **CalendarTest.php**: Added 7 new tests covering tenant isolation, opening-window-aware availability, blackout subtraction, held/committed slot exclusion, duration constraint, booking UUID prop, and resolved pricing.

## Decisions
- Used `AvailabilityService::search()` with duration parameter to get pre-cut slots, rather than calling `freeIntervals()` directly and cutting on the frontend.
- Booked slots include `uuid` for direct navigation to `/manager/bookings/{uuid}` instead of the filtered booking list.
- Opening windows determine the grid range per court (not a fixed 05:00-23:00).
- Closed/blocked time (outside opening windows) is rendered with `opacity-40 pointer-events-none` to be visibly non-actionable.
- Duration selector triggers a full page reload via `router.get()` to fetch updated availability from the backend.

## Next
- Browser verification at 1440px and 390px (browser plugin was unavailable during implementation).
- T64 will update the Bookings list UI.
- T65 will add series operations.

## Test results
- Calendar tests: 8 passed (109 assertions)
- Full suite: 296 passed (1435 assertions)
- Frontend build: passed
- Pint: passed
