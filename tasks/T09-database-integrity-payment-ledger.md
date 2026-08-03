---
id: T09
title: Database integrity for payment ledger and time windows
status: in-review
owner: OpenCode
priority: P1
depends_on: []
branch: fix/dev-vite-service
scope:
  - apps/app/database/migrations/2026_08_03_020000_add_database_integrity_constraints.php
  - apps/app/tests/Feature/DatabaseIntegrityTest.php
  - tasks/T09-database-integrity-payment-ledger.md
  - tasks/BOARD.md
  - worklogs/2026-08-03-database-integrity-payment-ledger.md
updated: 2026-08-03
---

## Goal
Add PostgreSQL-level integrity protection for documented money, time-window, payment/refund tenant-reference, and payment-ledger invariants. Prove direct database writes violating those constraints are rejected.

## Context / references
- `CLAUDE.md` invariant 6
- `.claude/skills/payment-flow/SKILL.md`
- `.claude/skills/tenant-isolation/SKILL.md`
- `docs/11-diem-vo.md`

## Acceptance criteria
- [x] Additive migration rejects negative money and invalid booking-slot/blackout time ranges.
- [x] Payment/refund tenant relationship is enforced by a composite foreign key.
- [x] Payment amount is immutable and cumulative refunds cannot exceed it.
- [x] PostgreSQL direct-write tests cover rejected violations.
- [x] RLS remains out of scope and is recorded as separate follow-up work.

## Out of scope (do NOT do here)
- RLS policy/session-context design and rollout.
- Changes to historical payment amounts or existing ledger data.
- Application payment/refund workflow changes.

## Verification (agent fills in before setting in-review)
- [x] `vendor/bin/pint --dirty` passes
- [ ] `php artisan test --filter=DatabaseIntegrityTest` current version: prior version passed 5 tests / 8 assertions; shared `san_test` became unavailable before rerunning after the final direct-payment check was added
- [ ] `php artisan test` passes on PostgreSQL: blocked by concurrent/partial `san_test` schema teardown; unrelated tests fail before assertions
- [x] `php artisan migrate:status` reports the migration as pending

## Log
- 2026-08-03 · created and claimed by OpenCode
- 2026-08-03 · implemented and moved to in-review by OpenCode
