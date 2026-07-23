---
id: T04
title: Owner grid calendar
status: claimed
owner: "opencode-agent"
priority: P1
depends_on: [T01]
branch: feat/grid-calendar
scope:
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/app/Http/Controllers/Manager/CalendarController.php
updated: 2026-07-23
---

## Goal
Replace the current **flat list** with a real **court×time grid** — the owner's everyday tool. Current state: `screenshot-1784790306038-0.jpg`.

## Acceptance criteria
- [ ] **Grid**: axes = courts (columns) × time slots (rows) for one day; cells = booking blocks sized to duration.
- [ ] **Color by status** (reuse the StatusBadge palette): confirmed / awaiting-deposit / walk-in / expired; show customer name + time; hover/click for detail.
- [ ] **Click an empty cell → walk-in booking** (open the existing walk-in dialog pre-filled with court + time).
- [ ] **Day nav** (‹ today ›) and, if feasible, a **week** toggle; a "now" line.
- [ ] Keep the **wall-as-UTC** convention when building/reading slots (do not add tz offsets).
- [ ] All booking actions still go through `BookingService` (no new booking path); scoped by `WorkingTenant`.
- [ ] Responsive: horizontal scroll on mobile; empty state for empty days.

## Out of scope (do NOT do here)
- Drag-to-reschedule (later; note it). No layout/palette changes.

## Verification
- [ ] `npm run build` passes · `php artisan test` (touches CalendarController) stays green
- [ ] Browser: grid matches today's seed bookings; click-empty walk-in works; day nav correct.

## Log
- 2026-07-23 · created by manager
