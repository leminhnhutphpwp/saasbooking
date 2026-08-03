---
id: T02
title: Manager booking and customer operations UI
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: feat/manager-operations-ui
scope:
  - apps/app/resources/js/Pages/Manager/Bookings/Index.jsx
  - apps/app/resources/js/Pages/Manager/Bookings/Show.jsx
  - apps/app/resources/js/Pages/Manager/Customers/Index.jsx
  - apps/app/resources/js/Pages/Manager/Customers/Show.jsx
  - apps/app/resources/js/managerNav.jsx
  - apps/app/resources/js/Components/AppTopbar.jsx
  - tasks/BOARD.md
  - tasks/T02-manager-operations-ui.md
  - worklogs/2026-08-03-manager-operations-ui.md
updated: 2026-08-03
---

## Goal
Provide the missing manager booking and customer pages rendered by the existing controllers, with reachable navigation for daily operations on mobile and desktop.

## Context / references
- `apps/app/app/Http/Controllers/Manager/BookingWorkbenchController.php`
- `apps/app/app/Http/Controllers/Manager/CustomerController.php`
- `.claude/rules/ui-design/SKILL.md`

## Acceptance criteria
- [x] Booking list and detail render existing controller props and lifecycle actions.
- [x] Customer list and profile render existing controller props and supported create/update actions.
- [x] Bookings and customers are reachable from manager navigation, including mobile.
- [x] Frontend build passes.

## Out of scope (do NOT do here)
- Booking, payment, customer, or public booking backend behavior.
- Changes to T01-owned files.

## Verification (agent fills in before setting in-review)
- [x] Static check: `git diff --check` passes
- [x] `npm run build` passes in the Vite container.
- [ ] Browser check: no automated browser renderer is available in this environment.

## Log
- 2026-08-03 · claimed by opencode.
- 2026-08-03 · implemented and ready for review; frontend verification blocked by Docker file sharing.
- 2026-08-03 · Docker Desktop sharing repaired; production frontend build passes.
