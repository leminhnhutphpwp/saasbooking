---
id: T28
title: Fix booking navigation and list UX
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: fix/booking-workbench-navigation
scope:
  - apps/app/app/Http/Controllers/Manager/BookingWorkbenchController.php
  - apps/app/resources/js/Pages/Manager/Bookings/Index.jsx
  - apps/app/tests/Feature/Manager/BookingWorkbenchTest.php
  - tasks/BOARD.md
  - tasks/T28-booking-workbench-navigation.md
  - worklogs/2026-08-05-booking-workbench-navigation.md
updated: 2026-08-05
---

## Goal
Make booking cards reliably open their detail page under runtime RLS and improve list scanning/filtering for daily operations.

## Context / references
Browser reproduction: `/manager/bookings/{uuid}` returns 404 for a UUID rendered by the list. Laravel implicit binding resolves before the appended tenant/RLS middleware; the runtime database role therefore cannot see the row at binding time.

## Acceptance criteria
- [x] Booking detail and status routes resolve after tenant context is applied and retain tenant ownership checks.
- [x] Booking list presents filters and cards with clear operational hierarchy on desktop and mobile.
- [x] Focused booking tests and direct browser click verification pass.

## Out of scope (do NOT do here)
- Booking lifecycle, pricing, payment, or database schema changes.

## Verification (agent fills in before setting in-review)
- [x] Focused PostgreSQL feature tests pass: 21 tests, 67 assertions.
- [x] Browser checks at desktop and mobile pass: direct runtime card click, 1440px review, and 390px overflow/runtime check.

## Log
- 2026-08-05 · claimed by opencode after reproducing booking card 404 under the runtime RLS database role.
- 2026-08-05 · resolved booking UUIDs after RLS context instead of implicit binding; rebuilt booking filters/cards and verified the formerly failing runtime URL; moved to in-review.
