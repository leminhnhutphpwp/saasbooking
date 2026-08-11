---
id: T60
title: Operational metrics correctness
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/operational-metrics
scope:
  - apps/app/app/Services/Reporting/OperationalMetricsService.php
  - apps/app/app/Http/Controllers/Manager/ReportController.php
  - apps/app/tests/Feature/Manager/ReportControllerTest.php
  - tasks/T60-operational-metrics-correctness.md
  - worklogs/2026-08-11-operational-metrics-correctness.md
updated: 2026-08-11
---

## Goal
Fix revenue and occupancy calculations to use authoritative data sources instead of assumptions, preventing multi-slot booking double-counting and hardcoded capacity.

## Context / references
- `.claude/skills/booking-engine/SKILL.md`
- `.claude/skills/court-catalog/SKILL.md`
- Current issue: `ReportController` sums `bookings.total_amount` which overstates revenue for multi-slot bookings
- Current issue: Occupancy denominator uses hardcoded 18 hours/court/day instead of actual opening rules
- `booking_slots.price_snapshot` is the immutable per-slot revenue source
- `opening_rules` and `blackouts` define actual operational capacity

## Acceptance criteria
- [x] Create `OperationalMetricsService` that calculates revenue from confirmed slot `price_snapshot` values
- [x] Revenue-by-day and total revenue sum slot prices, not booking totals
- [x] Occupancy denominator uses actual opening-window minutes of active courts per day, with blackout intervals removed
- [x] Occupancy numerator uses committed slot overlap clipped to open intervals
- [x] Date parameters are tenant-timezone aware, ordered, bounded to a documented maximum window
- [x] Return compact hourly utilization dataset only for periods with known available minutes
- [x] Every query is scoped with `WorkingTenant`; no booking lifecycle or write path changes
- [x] All existing ReportController props remain backward-compatible

## Out of scope (do NOT do here)
- Reports UI changes (T61 will consume this service)
- Home dashboard changes (T62 will consume this service)
- Calendar or booking workflow changes

## Verification (agent fills in before setting in-review)
- [x] PostgreSQL feature tests for tenant isolation, multi-slot revenue, partial-hour slot overlap, blackout subtraction, no opening coverage, and invalid/reversed date ranges
- [x] Pint on changed PHP files
- [x] Full test suite passes (279 tests, 1209 assertions)

## Log
- 2026-08-11 · claimed by OpenCode to fix revenue double-counting and hardcoded capacity assumptions.
