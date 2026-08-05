---
id: T13
title: Tenant isolation hardening
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: security/tenant-isolation-hardening
scope:
  - apps/app/app/Http/Controllers/Manager/HomeController.php
  - apps/app/app/Http/Controllers/Manager/ReconcileController.php
  - apps/app/app/Http/Controllers/Manager/ReportController.php
  - apps/app/tests/Feature/Tenant/TenantResourceIsolationTest.php
  - docs/13-tenant-isolation-rls-readiness.md
  - tasks/T13-tenant-isolation-hardening.md
  - tasks/BOARD.md
  - worklogs/2026-08-03-tenant-isolation-hardening.md
updated: 2026-08-03
---

## Goal
Harden operational route-model bindings against cross-tenant identifiers and prove isolation for booking, payment, customer, and court resources.

## Context / references
- `CLAUDE.md` invariant 3
- `.claude/skills/tenant-isolation/SKILL.md`

## Acceptance criteria
- [x] Manager route identifiers are constrained to `WorkingTenant`.
- [x] Focused two-tenant regression coverage prevents viewing or mutating another tenant's resources.
- [x] RLS is not enabled without a safe non-superuser application role and per-request session context.

## Out of scope (do NOT do here)
- Reworking booking concurrency or module services.
- Enabling PostgreSQL RLS before its deployment prerequisites are met.

## Verification (agent fills in before setting in-review)
- [x] Targeted `vendor/bin/pint` passes for T13 PHP files
- [x] Focused PostgreSQL feature tests: 55 passed, 308 assertions
- [x] Full PostgreSQL suite: 256 passed, 989 assertions

## Log
- 2026-08-03 · claimed by opencode
- 2026-08-03 · hardened working-tenant reads and reconciliation inbox lookup; ready for review
