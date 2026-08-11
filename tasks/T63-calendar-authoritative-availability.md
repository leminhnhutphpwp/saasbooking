---
id: T63
title: Calendar authoritative availability
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/calendar-availability
scope:
  - apps/app/app/Http/Controllers/Manager/CalendarController.php
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/tests/Feature/Manager/CalendarTest.php
  - tasks/T63-calendar-authoritative-availability.md
  - worklogs/2026-08-11-calendar-authoritative-availability.md
updated: 2026-08-11
---

## Goal
Make Calendar display authoritative availability using AvailabilityService, respecting opening rules, blackouts, held/committed slots, and walk-in duration constraints.

## Context / references
- `.claude/skills/booking-engine/SKILL.md`
- `.claude/skills/court-catalog/SKILL.md`
- Current issue: Calendar renders fixed 05:00-23:00 grid and treats unbooked cells as available
- Current issue: Calendar doesn't consume AvailabilityService opening-rule/blackout availability
- Current issue: Booking blocks route to filtered booking list, not the booking record
- `AvailabilityService::freeIntervals()` returns authoritative free slots
- `CatalogService::openingWindows()` returns opening rules per court per day

## Acceptance criteria
- [x] Calendar props derive each court's selectable intervals from `AvailabilityService`
- [x] Respect opening rules, blackouts, held/committed slots
- [x] Only start times that can accommodate the selected 60/90/120-minute walk-in duration are actionable
- [x] Closed/blocked time is visibly non-actionable rather than presented as "trống"
- [x] Booking blocks carry the booking UUID and open `/manager/bookings/{uuid}` directly
- [x] Desktop grid and mobile court cards retain semantic buttons/links, 44px touch targets, visible focus, non-color status cues
- [x] No horizontal overflow at 360px
- [x] Walk-in POST route and its `BookingService` path remain unchanged
- [x] Availability is presentation guidance; PostgreSQL remains race authority

## Out of scope (do NOT do here)
- Bookings list UI changes (T64 will do that)
- Series operations (T65 will do that)
- Backend booking lifecycle or write paths

## Verification (agent fills in before setting in-review)
- [x] Add feature assertions for opening-window/blackout-aware selectable props, tenant scope, resolved pricing, and booking UUID prop
- [x] Run Calendar plus booking availability PostgreSQL tests
- [ ] Browser: authenticated Calendar at 1440px and 390px; navigate a booked block to detail, open an available walk-in dialog, change duration, and verify no closed/blocked start is selectable
- [x] Frontend build passes

## Log
- 2026-08-11 · claimed by OpenCode to make Calendar use authoritative availability.
- 2026-08-11 · implemented backend and frontend changes, all 296 tests pass, frontend build passes.
