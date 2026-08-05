---
id: T10
title: Operational reliability slice
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: fix/dev-vite-service
scope:
  - tasks/BOARD.md
  - tasks/T10-operational-reliability.md
  - apps/app/app/Jobs/ExpireStaleHolds.php
  - apps/app/app/Jobs/GenerateSeriesOccurrences.php
  - apps/app/app/Jobs/SendBookingReminders.php
  - apps/app/routes/console.php
  - apps/app/routes/api.php
  - apps/app/app/Http/Controllers/Health/ReadinessController.php
  - apps/app/tests/Feature/Operations/
  - docs/13-van-hanh-production.md
  - worklogs/2026-08-03-operational-reliability.md
updated: 2026-08-03
---

## Goal
Add verified queue failure policy, single-host scheduler locking, and a dependency-aware readiness endpoint without asserting that production infrastructure is deployed.

## Context / references
- `docker-compose.yml`
- `apps/app/routes/console.php`
- `docs/12-lo-trinh.md`

## Acceptance criteria
- [x] Critical jobs define bounded retries, backoff, timeout, and failed-job behavior.
- [x] Hold expiry, series generation, and reminder schedules prevent overlapping runs on the single scheduler host.
- [x] A non-secret readiness response reports required local dependencies safely.
- [x] Focused tests and production handoff documentation are present.

## Out of scope (do NOT do here)
- Production deployment, credentials, alerting vendors, or backup automation ownership changes.
- Changes to T01-T09 implementation files outside this scoped reliability work.

## Verification (agent fills in before setting in-review)
- [x] Pint passes for changed PHP files.
- [x] Focused PostgreSQL feature test: 4 passed, 37 assertions.
- [x] Full PostgreSQL suite: 253 passed, 944 assertions.
- [x] Live compose check: `GET http://localhost:8000/api/ready` returned `{"status":"ready"}`.

## Log
- 2026-08-03 · claimed by opencode for queue, scheduler, readiness, and operational handoff hardening.
- 2026-08-03 · ready for review; bounded retries and Redis overlap locks cover critical jobs, scheduler mutexes are configured, and readiness is verified locally without production credentials.
