---
id: T07
title: Tenant-scoped Zalo ZNS configuration and delivery
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: fix/dev-vite-service
scope:
  - apps/app/app/Models/ZaloOaConfig.php
  - apps/app/app/Models/NotificationMessage.php
  - apps/app/app/Services/Notification/
  - apps/app/app/Notifications/
  - apps/app/app/Jobs/SendBookingReminders.php
  - apps/app/app/Listeners/
  - apps/app/config/services.php
  - apps/app/database/migrations/*zalo*
  - apps/app/database/migrations/*notification*
  - apps/app/tests/Feature/*Zalo*
  - apps/app/tests/Feature/*Notification*
  - apps/app/.env.example
  - docs/07-luong-du-lieu.md
  - docs/08-thiet-ke-module-chi-tiet.md
  - docs/12-lo-trinh.md
  - tasks/BOARD.md
  - tasks/T07-tenant-zalo-zns-delivery.md
  - worklogs/2026-08-03-tenant-zalo-zns-delivery.md
updated: 2026-08-03
---

## Goal
Move Zalo ZNS delivery from global runtime configuration to explicit tenant-scoped OA configuration and logical-template mappings. Preserve safe local logging while making unavailable configuration and provider failures independently observable and retryable.

## Context / references
- `.claude/skills/notification-zalo/SKILL.md`
- `.claude/skills/tenant-isolation/SKILL.md`
- `docs/07-luong-du-lieu.md`
- `docs/08-thiet-ke-module-chi-tiet.md`

## Acceptance criteria
- [x] Each delivery resolves its active, complete OA configuration and template ID by the booking tenant only.
- [x] Missing, inactive, incomplete, and provider-failed delivery paths are explicit, safe, and do not affect booking state.
- [x] Queued delivery has bounded retry/backoff/timeout and durable redrive-ready failure recording consistent with existing patterns.
- [x] Focused PostgreSQL feature coverage proves A/B isolation, mapping, unavailable configuration, and failure semantics.

## Out of scope (do NOT do here)
- Real Zalo credentials, template approval, or network sends.
- Manager configuration UI or any booking/payment lifecycle changes.
- New dependencies or external services.

## Verification (agent fills in before setting in-review)
- [x] Focused PostgreSQL feature tests: 15 passed, 48 assertions
- [x] Full PostgreSQL backend suite: 242 passed, 846 assertions
- [x] Pint for changed PHP files

## Log
- 2026-08-03 · claimed by opencode; scoped around notification-owned runtime configuration and delivery only.
- 2026-08-03 · ready for review; tenant mapping, safe unavailability records, bounded retries, and redrive state verified without real credentials or network calls.
