---
id: T24
title: Full website UI overhaul
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: feat/ui-overhaul
scope:
  - apps/app/resources/css/app.css
  - apps/app/resources/js/
  - worklogs/2026-08-05-ui-overhaul.md
updated: 2026-08-05
---

## Goal
Unify the website around the approved green token system with readable typography, responsive layouts, and accessible shared UI across public, manager, legacy, and marketing surfaces.

## Context / references
Approved green visual direction and `.claude/rules/ui-design/SKILL.md`.

## Acceptance criteria
- [x] Public, auth, manager, legacy, and marketing pages use the shared token system responsively.
- [x] Booking behavior and existing Playwright selectors remain intact.
- [x] Build, tests, Playwright, and available browser checks are recorded.
- [x] Manager dashboard has a grouped operational sidebar and responsive navigation drawer.
- [x] Manager calendar supports low-noise schedule scanning, court filtering, and mobile-safe walk-in booking.

## Out of scope (do NOT do here)
- Backend behavior, data models, dependencies, and protected T23 files.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T vite npm run build` passes
- [x] `./scripts/dev.sh test` passes: 268 tests, 1,038 assertions
- [x] Playwright suite: 17/17 passed
- [x] Browser checks at 390px and 1440px: existing Playwright overflow/mobile smoke cases passed
- [x] Browser review for manager home: 1440px expanded/collapsed sidebar, 390px mobile drawer, hover cursor, and runtime error checks passed.
- [x] Browser review for manager calendar: 1440px schedule hierarchy and 390px court filter/empty-slot walk-in flow passed without overflow or runtime errors.

## Log
- 2026-08-05 · claimed by opencode
- 2026-08-05 · introduced tokenized typography, public booking shell, responsive manager actions, and tokenized shared marketing/auth/legacy surfaces
- 2026-08-05 · unified the dashboard and all shared surfaces on the approved green token system; verified and moved to in-review
- 2026-08-05 · reopened for the manager home and navigation refinement requested after browser review.
- 2026-08-05 · reorganized the manager workspace and fixed the mobile sidebar trigger; verified and moved to in-review.
- 2026-08-05 · reopened for calendar usability refinement after direct desktop and mobile browser audit.
- 2026-08-05 · rebuilt calendar controls and schedule density around fast day/court selection and low-noise empty-slot booking; verified and moved to in-review.
