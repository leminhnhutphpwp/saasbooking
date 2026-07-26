---
name: development-workflow
description: Development workflow for the SÂN court-booking platform (Laravel + Inertia monolith)
metadata:
  scope: global
  type: workflow
---

# Development Workflow

## Before starting — read selectively, not everything

1. **`CLAUDE.md`** (root) — the 6 non-negotiable invariants. Always in context.
2. **`AGENTS.md`** — working rules and source-of-truth pointers.
3. **`docs/README.md`** — open only the relevant product/architecture docs.
4. Load the matching rule/skill only when its task description fits.

> Read the smallest set that answers the task. Pair with the `context-efficiency` rule before reading broadly.

## Follow current priorities

Check `tasks/BOARD.md` for active work and `docs/12-lo-trinh.md` for go-live priorities. Do not recreate completed milestones from old worklogs.

## By task type

- **Backend feature** → read `.claude/rules/laravel`, the relevant module in `docs/08`, put logic in `app/Services/`, heavy/async in `app/Jobs/` (Horizon).
- **Booking / availability / holds** → load skill `booking-engine`. All holds go through `BookingService` / an `InventoryDriver` — never raw-insert `booking_slots`.
- **Payment / deposit / reconcile** → load skill `payment-flow`.
- **New sport / vertical (golf, spa)** → load skill/workflow `vertical-dispatch` and run `/new-vertical`. Extend by config + driver + component; never branch per sport in core.
- **UI** → preserve the existing design system, layouts and Inertia patterns; verify mobile and desktop.

## Verify & finish

1. Run tests through Docker: `docker compose exec app php artisan test` (target with `--filter` where possible). PHPUnit/Pest; Playwright for booking E2E.
2. Run `php artisan pint` for style.
3. **Run `/check-invariants`** (the `invariant-reviewer` agent) before committing any booking / payment / tenant change.
4. **No commit / push unless the user explicitly asks.**
5. Write a worklog to `worklogs/` (see `worklogs/README.md`).

## General principles

- Small, verifiable patches.
- Never run `migrate:fresh` / `db:wipe` without explicit confirmation (guarded in `.claude/settings.json`).
- UI text is Vietnamese; code and agent docs are English.

## When to use this skill

At the start of any development task, or when setting up / running the stack.
