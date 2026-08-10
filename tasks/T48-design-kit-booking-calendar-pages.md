---
id: T48
title: Design-kit booking calendar pages
status: done
owner: "OpenCode"
priority: P1
depends_on: [T47]
branch: feat/design-kit-migration
scope:
  - apps/app/resources/js/Pages/Manager/Bookings/
  - apps/app/resources/js/Pages/Manager/Calendar/
  - apps/app/resources/js/Pages/Manager/Series/
  - tasks/T48-design-kit-booking-calendar-pages.md
  - worklogs/2026-08-10-design-kit-booking-calendar-pages.md
updated: 2026-08-10
---

## Goal
Migrate Manager booking, calendar, and recurring-series pages to the canonical design kit while preserving booking behavior.

## Acceptance criteria
- [x] All page-level UI follows design-system booking, app-ui, and motion/a11y rules.
- [x] Calendar uses court-grid semantics and responsive no-overflow interaction.
- [x] No component-level literals/arbitrary design values are introduced.

## Out of scope (do NOT do here)
- Shared primitives and other Manager/public pages.

## Verification
- [x] Frontend build passes: `docker compose exec -T vite npm run build`.
- [x] Relevant tests pass: 23 tests, 63 assertions.
- [x] Browser check blocked: no CDP endpoint at `127.0.0.1:9222`.

## Log
- 2026-08-10 · created after design-kit foundation migration.
- 2026-08-10 · migrated booking, calendar, and recurring-series pages; ready for review.
