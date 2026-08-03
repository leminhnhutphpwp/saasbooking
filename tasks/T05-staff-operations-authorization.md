---
id: T05
title: Staff operations authorization
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: fix/dev-vite-service
scope:
  - apps/app/app/Providers/AppServiceProvider.php
  - apps/app/tests/Feature/Manager/StaffOperationsAuthorizationTest.php
  - tasks/T05-staff-operations-authorization.md
updated: 2026-08-03
---

## Goal
Allow active tenant staff to perform Phase-1 reception operations while denying owner-only configuration, payment, reporting, and destructive operations.

## Context / references
- `docs/02-yeu-cau-chuc-nang.md` section 5
- `.claude/skills/tenant-isolation/SKILL.md`
- `apps/app/routes/web.php` manager route group (owned by T04; not modified here)

## Acceptance criteria
- [x] A staff user with an active `staff` membership may access manager home, calendar, booking workbench, walk-in creation, and supported non-financial lifecycle actions.
- [x] Staff are forbidden from owner-only manager routes and booking cancellation.
- [x] Authorization reads the resolved `WorkingTenant` and current membership only.
- [x] Focused PostgreSQL tests and Pint pass.

## Out of scope (do NOT do here)
- Changes to manager routes, controllers, booking services, or manager UI owned by T01-T04.
- Membership invitation or revocation UI.

## Verification (agent fills in before setting in-review)
- [x] Targeted PostgreSQL feature tests: 8 passed (24 assertions).
- [x] Pint passes for changed PHP files.

## Log
- 2026-08-03 · claimed by opencode; route file is actively owned by T04, so precise authorization is implemented through its existing manager gate.
- 2026-08-03 · ready for review; staff access is constrained to reception route names, supported non-financial lifecycle actions, and the resolved tenant's `staff` membership.
