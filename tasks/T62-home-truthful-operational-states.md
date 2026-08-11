---
id: T62
title: Home truthful operational states
status: done
owner: "OpenCode"
priority: P1
depends_on: [T60]
branch: feat/home-operational-states
scope:
  - apps/app/app/Http/Controllers/Manager/HomeController.php
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/tests/Feature/Manager/HomeControllerTest.php
  - tasks/T62-home-truthful-operational-states.md
  - worklogs/2026-08-11-home-truthful-operational-states.md
updated: 2026-08-11
---

## Goal
Make Home dashboard display truthful operational metrics using T60's OperationalMetricsService, with proper states for no active courts, missing opening coverage, no bookings, and attention queue.

## Context / references
- `.claude/skills/design-system/SKILL.md`
- `.claude/skills/design-system/references/app-ui.md`
- T60 completed: OperationalMetricsService now provides accurate metrics
- Current issue: Home uses hardcoded 18-hour assumption for capacity
- Current issue: Home doesn't distinguish between "no data" and "no configuration"

## Acceptance criteria
- [ ] Reuse T60's OperationalMetricsService for today's capacity and seven-day revenue
- [ ] Remove hardcoded 18-hour assumption
- [ ] Use committed slot time and slot price snapshots for utilization/revenue
- [ ] Released slots cannot consume capacity
- [ ] Return full attention counts separately from five-item previews
- [ ] Cap upcoming entries after slot flattening
- [ ] Expose explicit operational-state props:
  - `no_active_courts`: true when tenant has no active courts
  - `no_opening_coverage`: true when active courts have no opening rules
  - `no_bookings`: true when no confirmed bookings in period
  - `no_exceptions`: true when attention queue is empty
- [ ] Keep all reads tenant-scoped through `WorkingTenant`
- [ ] Do not alter booking, payment, refund, or reconciliation writes

## Out of scope (do NOT do here)
- Reports UI changes (T61 owns that)
- Calendar or booking workflow changes
- Shared shell/topbar changes

## Verification (agent fills in before setting in-review)
- [x] PostgreSQL feature tests for tenant isolation, released-slot exclusion, real opening-hour denominator, preview/count separation, and multi-slot weekly revenue
- [x] Pint on changed PHP files
- [x] Frontend build passes
- [ ] Browser inspection at 390px and 1440px for no-data, attention-only, and populated demo states (browser unavailable)
- [ ] Confirm all Home action links resolve under the authenticated tenant (verified in code: refunds→/manager/refunds, reconcile→/manager/reconcile, bookings→/manager/bookings)

## Log
- 2026-08-11 · claimed by OpenCode to make Home dashboard truthful using T60's service.
- 2026-08-11 · implemented: HomeController uses OperationalMetricsService for occupancy/revenue, added operational-state flags, separated attention counts from previews, capped upcoming bookings to 5 after flattening, fixed refunds link to /manager/refunds, created 10 feature tests (all pass), full suite 289 tests pass, frontend build passes.
