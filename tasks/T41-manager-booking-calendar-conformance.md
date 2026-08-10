---
id: T41
title: Manager booking and calendar conformance
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/manager-design-conformance
scope:
  - apps/app/resources/js/Pages/Manager/Bookings/Index.jsx
  - apps/app/resources/js/Pages/Manager/Bookings/Show.jsx
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
  - tasks/T41-manager-booking-calendar-conformance.md
  - worklogs/2026-08-10-manager-booking-calendar-conformance.md
updated: 2026-08-10
---

## Goal
Bring booking, calendar, and recurring-series screens into full DESIGN.md conformance without changing booking behavior.

## Acceptance criteria
- [x] Calendar is keyboard accessible and does not horizontally scroll at 360px.
- [x] Booking and payment records use responsive semantic data tables.
- [x] Series cards, empty states, controls, and spacing meet DESIGN.md.

## Out of scope (do NOT do here)
- Shared primitives and CSS tokens owned by T44.
- Customer, finance, court, and settings pages.

## Verification
- [x] Frontend build passes.
- [x] Relevant tests pass.
- [ ] Browser check records desktop and mobile results (CDP unavailable after retry).

## Log
- 2026-08-10 · created and claimed after DESIGN.md discovery audit.
- 2026-08-10 · in review: responsive semantic booking/payment tables, accessible calendar controls and mobile schedule list, and series card conformance completed. Build and `BookingWorkbenchTest` pass; CDP browser QA is unavailable.
