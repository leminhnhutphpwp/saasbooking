---
id: T17
title: Database integrity validation preflight
status: in-review
owner: OpenCode
priority: P1
depends_on: [T09]
branch: fix/dev-vite-service
scope:
  - apps/app/app/Console/Commands/CheckDatabaseIntegrity.php
  - apps/app/tests/Feature/CheckDatabaseIntegrityCommandTest.php
  - docs/operations/database-integrity-validation.md
  - tasks/T17-database-integrity-preflight.md
  - tasks/BOARD.md
  - worklogs/2026-08-03-database-integrity-preflight.md
updated: 2026-08-03
---

## Goal
Provide a read-only PostgreSQL preflight for violations covered by T09's not-valid integrity constraints and triggers. Operators must be able to identify affected tenants before manually validating the constraints.

## Context / references
- `tasks/T09-database-integrity-payment-ledger.md`
- `CLAUDE.md` invariant 6
- `.claude/skills/payment-flow/SKILL.md`
- `.claude/skills/tenant-isolation/SKILL.md`

## Acceptance criteria
- [x] Command audits all tenants and reports affected tenant identifiers without bank account details.
- [x] Command exits nonzero when any T09 invariant is violated and never mutates data.
- [x] Documentation gives exact preflight and manually-run validation commands.
- [x] PostgreSQL feature tests cover clean and invalid fixtures.

## Out of scope (do NOT do here)
- Validating constraints automatically.
- Repairing historical data.
- Editing T09's migration or application payment workflows.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T app vendor/bin/pint --dirty` passes
- [x] `docker compose exec -T app php artisan test --filter=CheckDatabaseIntegrityCommandTest` passes: 2 tests / 8 assertions
- [x] `docker compose exec -T app php artisan test --filter=DatabaseIntegrityTest` passes: 5 tests / 9 assertions
- [x] `docker compose exec -T app php artisan test` passes: 264 tests / 1,015 assertions

## Log
- 2026-08-03 · created and claimed by OpenCode
- 2026-08-03 · implemented and moved to in-review by OpenCode
