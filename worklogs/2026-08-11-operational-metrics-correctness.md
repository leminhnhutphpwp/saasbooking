---
date: 2026-08-11
task: T60
author: OpenCode
---

# Worklog — Operational Metrics Correctness

## Goal
Fix revenue and occupancy calculations to use authoritative data sources instead of assumptions.

## Changed
- Created `apps/app/app/Services/Reporting/OperationalMetricsService.php` with:
  - `revenueByDay()` — sums `booking_slots.price_snapshot` for confirmed bookings, grouped by date
  - `totalRevenue()` — sums all slot prices in range
  - `occupancy()` — calculates using actual opening rules per court per day, subtracts blackouts (court-specific + venue-wide), clips slot minutes to open intervals
  - `utilization()` — hourly utilization with coverage metadata
  - Private `subtractIntervals()` helper (same algorithm as AvailabilityService)

- Updated `apps/app/app/Http/Controllers/Manager/ReportController.php`:
  - Injects `OperationalMetricsService` via constructor
  - Revenue now uses service (slot prices, not `bookings.total_amount`)
  - Occupancy now uses service (actual opening rules, not hardcoded 18h/court/day)
  - Added reversed date range handling (swaps from/to if reversed)
  - Top customers now uses slot price sum instead of booking total_amount
  - All existing Inertia props remain backward-compatible

- Created `apps/app/tests/Feature/Manager/ReportControllerTest.php` with 9 tests:
  - Tenant isolation (revenue only shows own data)
  - Multi-slot booking revenue (no double-counting)
  - Partial-hour slot overlap
  - Blackout subtraction
  - No opening coverage (returns 0 occupancy)
  - Reversed date range handling
  - Revenue by day grouping
  - Only confirmed bookings count toward revenue
  - Venue-wide blackout subtracts from all courts

## Decisions
- Used `CatalogService::openingWindows()` for opening rules (court-specific only, matching existing pattern)
- Blackouts include both court-specific and venue-wide (court_id = null)
- Occupancy numerator clips slots to net-open intervals (after blackout subtraction)
- `diffInMinutes` in Carbon 3 is signed — used `$start->diffInMinutes($end)` for positive values
- Coverage metadata returned as `'full'` or `'none'` string

## Verification
- Pint: passed (0 files changed)
- ReportControllerTest: 9 passed (109 assertions)
- Full suite: 279 passed (1209 assertions)

## Next
- T61 can consume `OperationalMetricsService` for Reports UI
- T62 can consume `OperationalMetricsService` for Home dashboard
