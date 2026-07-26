---
id: T38
title: Platform hardening audit fixes
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: fix/platform-hardening
scope:
  - apps/app/app/
  - apps/app/config/
  - apps/app/database/migrations/
  - apps/app/resources/js/
  - apps/app/tests/
  - apps/app/.env.example
  - docs/05-module-map.md
  - docs/06-erd.md
  - worklogs/
updated: 2026-07-26
---

## Goal
Fix verified tenant-isolation, transaction, customer identity, frontend consistency, security-default, and documentation defects found by the parallel audit. Reject speculative findings that would add unsupported schema or behavior.

## Context / references
- [`../CLAUDE.md`](../CLAUDE.md)
- [`../.claude/skills/tenant-isolation/SKILL.md`](../.claude/skills/tenant-isolation/SKILL.md)
- [`../.claude/skills/booking-engine/SKILL.md`](../.claude/skills/booking-engine/SKILL.md)

## Acceptance criteria
- [x] Customer creation always receives UUID/code and concurrent code allocation is serialized per tenant.
- [x] Payment creation and booking confirmation are atomic; lifecycle updates use owning services/Eloquent paths.
- [x] Notification reminder dedupe is tenant-scoped and schema constraints enforce tenant ownership.
- [x] Profile/auth UI is Vietnamese and shared input behavior remains accessible.
- [x] PostgreSQL defaults, session security, Zalo env documentation, and ERD/module docs match implementation.
- [x] Regression tests cover the backend fixes.

## Out of scope (do NOT do here)
- Broad i18n framework or full design-token rewrite.
- Adding SoftDeletes without corresponding migrations and retention policy.
- Deleting the product root page or changing product navigation.

## Verification (agent fills in before setting in-review)
- [x] `vendor/bin/pint --test` passes
- [x] `npm run build` passes
- [x] Relevant PostgreSQL tests pass
- [x] Full `php artisan test` passes: 224 tests, 748 assertions

## Log
- 2026-07-26 · created and claimed by opencode after parallel audit
- 2026-07-26 · verified and moved to in-review by opencode
