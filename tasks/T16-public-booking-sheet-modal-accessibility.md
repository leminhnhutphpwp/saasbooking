---
id: T16
title: Public booking sheet modal accessibility
status: in-review
owner: opencode
priority: P2
depends_on: [T06, T11]
branch: fix/public-booking-sheet-modal-accessibility
scope:
  - apps/app/resources/js/Pages/Public/Booking/Show.jsx
  - apps/app/tests/e2e/public-booking.spec.js
  - tasks/BOARD.md
  - tasks/T16-public-booking-sheet-modal-accessibility.md
  - worklogs/2026-08-03-public-booking-sheet-modal-accessibility.md
updated: 2026-08-03
---

## Goal
Make the public booking sheet behave as a true modal when it declares `aria-modal`, including keyboard focus containment and restoration to its selected court.

## Context / references
- Reviewed P2 accessibility issue in `apps/app/resources/js/Pages/Public/Booking/Show.jsx`
- `tasks/T06-public-booking-sheet-visibility.md`
- `tasks/T11-playwright-e2e-foundation.md`

## Acceptance criteria
- [x] Opening the sheet moves focus into the dialog and Tab/Shift+Tab remain within it.
- [x] Escape closes the sheet and focus returns to the court trigger, with a safe fallback when it is gone.
- [x] Pointer selection and mobile booking remain usable.
- [x] Playwright coverage verifies the public booking flow and modal keyboard behavior through the Docker runner.

## Out of scope (do NOT do here)
- Backend, booking, payment, route, or dependency changes.
- Changes outside the public booking sheet and its focused E2E coverage.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T vite npm run build` passes.
- [x] `docker run --rm --network host ... mcr.microsoft.com/playwright:v1.62.1-noble npm run test:e2e` passes (5 tests).
- [x] `docker compose exec -T app php artisan test tests/Feature/Booking/PublicBookingTest.php` passes (7 tests, 57 assertions).
- [x] `docker compose exec -T app vendor/bin/pint --test` passes (222 files).

## Log
- 2026-08-03 · claimed by opencode.
- 2026-08-03 · ready for review; court triggers receive focus after modal dismissal, or booking main receives focus if the trigger disappeared. The modal focus loop and Escape behavior are covered in Chromium E2E.
