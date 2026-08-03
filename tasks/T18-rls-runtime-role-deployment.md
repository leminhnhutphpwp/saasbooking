---
id: T18
title: RLS runtime role deployment
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: security/rls-runtime-role-deployment
scope:
  - apps/app/config/database.php
  - apps/app/bootstrap/app.php
  - apps/app/app/Support/RlsTenantContext.php
  - apps/app/app/Http/Middleware/ApplyRlsTenantContext.php
  - apps/app/app/Jobs/ExpireStaleHolds.php
  - apps/app/app/Jobs/GenerateSeriesOccurrences.php
  - apps/app/app/Jobs/SendBookingReminders.php
  - apps/app/app/Listeners/SendBookingConfirmation.php
  - apps/app/app/Notifications/BookingConfirmedNotification.php
  - apps/app/app/Notifications/BookingReminderNotification.php
  - apps/app/app/Http/Controllers/Webhook/BankReconcileController.php
  - apps/app/database/migrations/2026_08_03_040000_create_rls_runtime_role_and_policies.php
  - apps/app/database/rls/
  - apps/app/tests/Feature/Tenant/RlsRuntimeRoleTest.php
  - apps/app/phpunit.xml
  - apps/app/.env.example
  - scripts/dev.sh
  - scripts/migrate.sh
  - docs/operations/rls-runtime-deployment.md
  - worklogs/2026-08-03-rls-runtime-role-deployment.md
  - tasks/T18-rls-runtime-role-deployment.md
  - tasks/BOARD.md
updated: 2026-08-03
---

## Goal
Deploy PostgreSQL RLS safely through a dedicated non-owner NOBYPASSRLS Laravel runtime role, transaction-local trusted tenant context, and an independently privileged migration connection.

## Context / references
- `CLAUDE.md` invariant 3
- `.claude/skills/tenant-isolation/SKILL.md`
- `docs/13-tenant-isolation-rls-readiness.md`

## Acceptance criteria
- [x] Runtime and migrator connections use distinct credentials.
- [x] Tenant context is transaction-local for HTTP and tenant-aware queued execution.
- [x] Tenant-owned tables enforce RLS for the runtime role and tests prove allow/deny behavior.
- [x] Production and Docker-compatible deployment, verification, rollback, and secret requirements are documented.

## Out of scope (do NOT do here)
- Altering existing application-level tenant query scoping.
- Changing T01/T13-owned Docker topology or readiness-document files.

## Verification (agent fills in before setting in-review)
- [x] `vendor/bin/pint --test` passes
- [x] `php artisan test`: 265 passed, 1025 assertions
- [x] Runtime-role PostgreSQL smoke: `san_app`, `rolbypassrls = false`, no tenant context

## Log
- 2026-08-03 · claimed by opencode
- 2026-08-03 · role/policy migration, runtime context, tests, Docker smoke, and runbook complete; ready for review
