---
id: T03
title: Reports
status: in-review
owner: agent
priority: P1
depends_on: [T01]
branch: feat/reports
scope:
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - apps/app/app/Http/Controllers/Manager/ReportController.php
updated: 2026-07-23
---

## Goal
Owners need to see money & performance — there is currently no reporting screen at all.

## Acceptance criteria
- [ ] **Revenue** by day/month (simple bar chart + total), counting only confirmed/collected bookings.
- [ ] **Occupancy** by day / time-slot.
- [ ] **No-show & deposits**: no-show count, deposits collected, refunds.
- [ ] **Top customers** (bookings / revenue).
- [ ] Date-range filter; scoped by `WorkingTenant`; money via `formatVND`.
- [ ] Efficient queries (no N+1); thin controller. Draw charts with SVG/CSS or an already-present lib — **do not add a heavy chart dependency** without asking the manager first.
- [ ] Use foundation components + empty states.

## Out of scope (do NOT do here)
- No Excel/PDF export (later). No layout/palette changes.

## Verification
- [ ] `npm run build` passes · tests if backend touched
- [ ] Browser: numbers match seed data; changing the date range updates correctly.

## Log
- 2026-07-23 · created by manager
