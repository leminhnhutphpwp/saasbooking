---
id: T59
title: RLS tenant context before route binding
status: in-review
owner: "OpenCode"
priority: P1
depends_on: [T58]
branch: feat/manager-analytics-overhaul
scope:
  - apps/app/bootstrap/app.php
  - apps/app/tests/Feature/Tenant/RlsCourtRouteBindingTest.php
  - tasks/BOARD.md
  - tasks/T59-rls-route-binding-order.md
  - worklogs/2026-08-11-rls-route-binding-order.md
updated: 2026-08-11
---

## Goal
Ensure authenticated manager court route binding executes only after the WorkingTenant and PostgreSQL RLS context are established.

## Context / references
- `.claude/skills/tenant-isolation/SKILL.md`
- `.claude/skills/court-catalog/SKILL.md`
- `apps/app/bootstrap/app.php`

## Acceptance criteria
- [x] Own opening-rules and pricing-rules UUID routes return 200 through the runtime RLS role.
- [x] A foreign court UUID remains unavailable.
- [x] Binding occurs after WorkingTenant and RLS context middleware.

## Out of scope (do NOT do here)
- Controller or route URL changes owned by T58.
- RLS policy changes or tenant identifiers from request payloads.

## Verification (agent fills in before setting in-review)
- [x] Relevant PostgreSQL catalog and RLS feature tests pass: 27 tests, 266 assertions.
- [x] Full PostgreSQL suite passes: 270 tests, 1100 assertions.
- [x] `vendor/bin/pint --test bootstrap/app.php tests/Feature/Tenant/RlsCourtRouteBindingTest.php` passes.
- [x] Browser checks pass for the Sân A opening-rules and pricing-rules URLs at `http://localhost:8000`.

## Log
- 2026-08-11 · Claimed by OpenCode after T58’s canonical URL fix still reproduced a browser 404 under runtime RLS.
- 2026-08-11 · Confirmed `SubstituteBindings` preceded tenant context; priority now runs authenticated tenant resolution and RLS context first.
- 2026-08-11 · Ready for review.
