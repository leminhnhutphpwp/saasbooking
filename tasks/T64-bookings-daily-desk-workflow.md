---
id: T64
title: Bookings daily desk workflow
status: done
owner: "OpenCode"
priority: P1
depends_on: [T63]
branch: feat/bookings-desk-workflow
scope:
  - apps/app/resources/js/Pages/Manager/Bookings/Index.jsx
  - apps/app/resources/js/Pages/Manager/Bookings/Show.jsx
  - tasks/T64-bookings-daily-desk-workflow.md
  - worklogs/2026-08-11-bookings-daily-desk-workflow.md
updated: 2026-08-11
---

## Goal
Optimize Bookings list for daily desk operations with quick date filters, improved filter context, and mobile-friendly action layout.

## Context / references
- `.claude/skills/design-system/SKILL.md`
- `.claude/skills/design-system/references/app-ui.md`
- T63 completed: Calendar now deep-links to `/manager/bookings/{uuid}`
- Current issue: Bookings lacks quick date presets for desk operations
- Current issue: Filter context is not legible without increasing density
- Current issue: Mobile actions wrap/overflow

## Acceptance criteria
- [ ] Add Vietnamese quick date controls: "Hôm nay", "Ngày mai", "Xóa bộ lọc"
- [ ] Preserve existing server query parameters, pagination, court/status/search filters, and Back navigation
- [ ] Make applied filters and result context legible without increasing desktop table density
- [ ] On mobile, make valid booking lifecycle actions reachable without wrapping/overflow
- [ ] Retain existing confirmation dialog and state-derived action set
- [ ] Continue using `StatusBadge`, shared formatting, tokens, semantic controls, and reduced-motion/focus behavior
- [ ] No controller, request, route, payment, refund, status-transition, or booking-write change

## Out of scope (do NOT do here)
- Calendar UI changes (T63 owns that)
- Series operations (T65 will do that)
- Backend booking lifecycle or write paths

## Verification (agent fills in before setting in-review)
- [x] Existing `/media/minhnhutpc/DataDisk/www/saasbooking/apps/app/tests/Feature/Manager/BookingWorkbenchTest.php` remains the lifecycle/tenant-isolation regression suite — 19/19 passed (44 assertions)
- [ ] Browser: desktop and 390px list filtering, clear filters, Calendar-to-detail handoff, and each visible action's confirmation dialog; do not submit destructive actions in demo QA — **blocked**: no Chrome CDP container running at `127.0.0.1:9225`
- [x] Frontend build passes — `vite build` completed in 1.82s, no errors

## Log
- 2026-08-11 · claimed by OpenCode to optimize Bookings daily desk workflow.
- 2026-08-11 · implementation complete: quick date controls, filter summary, mobile-responsive actions. Build passes, 19/19 tests pass. Browser verification blocked (no CDP).
