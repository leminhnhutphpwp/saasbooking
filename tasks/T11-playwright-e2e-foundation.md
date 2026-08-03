---
id: T11
title: Playwright E2E foundation
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: test/playwright-e2e
scope:
  - apps/app/package.json
  - apps/app/package-lock.json
  - apps/app/playwright.config.js
  - apps/app/tests/e2e/
  - tasks/BOARD.md
  - tasks/T11-playwright-e2e-foundation.md
  - worklogs/2026-08-03-playwright-e2e-foundation.md
updated: 2026-08-03
---

## Goal
Add a deterministic Playwright smoke-test foundation for the Docker development stack. Cover public booking, login, authenticated manager navigation when the demo seed is available, and a mobile public-booking viewport without external integrations or credentials.

## Context / references
- `docker-compose.yml`
- `apps/app/database/seeders/DemoSeeder.php`
- `tasks/T06-public-booking-sheet-visibility.md`

## Acceptance criteria
- [x] Playwright scripts and Chromium-only configuration are available through npm.
- [x] Browser specs validate the public booking selection state, login page, mobile viewport, and demo manager navigation.
- [x] Setup and deterministic data requirements are documented.
- [x] Build, Pint, and relevant automated checks are recorded with actual results.

## Out of scope (do NOT do here)
- Application, route, Docker topology, seed-data, or authentication behavior changes.
- Real payment, bank, Zalo, or other external API calls.
- Changes owned by T01-T10.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T vite npm run build` passes
- [x] `docker compose exec -T app vendor/bin/pint --test` passes (218 files)
- [x] `docker run --rm --network host ... mcr.microsoft.com/playwright:v1.62.1-noble npm run test:e2e` passes (4 tests)
- [x] `docker compose exec -T app php artisan test tests/Feature/Booking/PublicBookingTest.php` passes (7 tests, 57 assertions)

## Log
- 2026-08-03 · claimed by opencode.
- 2026-08-03 · ready for review; Chromium browser smoke suite passes against the running Docker development stack.
