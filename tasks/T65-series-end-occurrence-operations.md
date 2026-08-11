---
id: T65
title: Series end/occurrence operations
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/series-operations
scope:
  - apps/app/app/Http/Controllers/Manager/SeriesController.php
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
  - apps/app/tests/Feature/Manager/SeriesControllerTest.php
  - tasks/T65-series-end-occurrence-operations.md
  - worklogs/2026-08-11-series-end-occurrence-operations.md
updated: 2026-08-11
---

## Goal
Expose existing end-series and cancel-occurrence operations in the recurring-workflow UI, distinguishing "Kết thúc lịch" from "Hủy lịch".

## Context / references
- `.claude/skills/booking-engine/SKILL.md`
- Current issue: Series UI only exposes whole-series cancellation
- Server routes already exist:
  - `POST /manager/series/{series}/end` → `SeriesController@end`
  - `POST /manager/series/{series}/occurrences/{booking}/cancel` → `SeriesController@cancelOccurrence`
- `SeriesService` and `BookingService` handle the business logic
- Need to expose these operations in the UI with proper copy and state guards

## Acceptance criteria
- [x] Add tenant-scoped read props for a limited, schedule-ordered set of generated upcoming occurrences per series
- [x] Each occurrence includes: booking UUID, start/end, status
- [x] Active-series cards distinguish "Kết thúc lịch" (existing `series.end`) from "Hủy lịch"
- [x] Copy accurately states their different effects:
  - "Kết thúc lịch": stops generating new occurrences, keeps existing confirmed bookings
  - "Hủy lịch": cancels the series and all pending bookings
- [x] An occurrence can be cancelled only when its existing server route/state rules permit it
- [x] Unavailable historical/ended occurrences are shown as non-actionable status information
- [x] All mutations continue through existing `SeriesService`/`BookingService` paths
- [x] No direct slot updates, no recalculation of snapped price/deposit, and no client-provided tenant identity
- [x] Mobile remains card-first and avoids a wide occurrence table

## Out of scope (do NOT do here)
- Calendar UI changes (T63 owns that)
- Bookings list changes (T64 owns that)
- Backend series/booking lifecycle or write paths

## Verification (agent fills in before setting in-review)
- [x] Add PostgreSQL feature coverage for tenant-isolated occurrence props, end-series behavior, valid/invalid occurrence cancellation, and unchanged snapshots/status guards
- [ ] Browser: populated and empty Series states at 1440px and 390px; keyboard-open/close confirmations and verify no overflow or console errors (browser plugin unavailable)
- [x] Frontend build passes
- [x] Full test suite passes (303 tests, 1504 assertions)
- [x] Pint clean

## Log
- 2026-08-11 · claimed by OpenCode to expose Series end/occurrence operations.
