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
2. **`AGENTS.md`** → the "Smart navigation" table — maps your task to the 1–2 relevant `docs/` files. Start there instead of reading all docs.
3. **`docs/README.md`** — the 5-part doc index (Direction → UI → Architecture → Risk → Delivery).
4. Load the matching **rule/skill** only when its "When to use" fits (e.g. `booking-engine`, `payment-reconcile`, `vertical-dispatch`). One skill, not all.

> Read the smallest set that answers the task. Pair with the `context-efficiency` rule before reading broadly.

## Follow the plan

Work follows the phased plan in **`docs/12-lo-trinh.md`** (M0→M7). Phase 1 build order:

1. `identity` + tenant (`WorkingTenant`, `ResolveWorkingTenant`, Breeze auth, RLS migration)
2. `court-catalog` (courts, opening hours, pricing rules + `PricingService`)
3. `booking` engine — **write the concurrency Feature test FIRST** (2 parallel holds → 1 wins, 1 gets 409), then `BookingService` → `AvailabilityService` → `SeriesService`
4. `payment` — VietQR + SePay/Casso reconcile (3 branches) + idempotency test
5. `notification` — Zalo ZNS confirm + reminders
6. UI — booking page (Public) + owner dashboard (Manager), Inertia + shadcn

`interop` and `billing` are Phase 2.

## By task type

- **Backend feature** → read `.claude/rules/laravel`, the relevant module in `docs/08`, put logic in `app/Services/`, heavy/async in `app/Jobs/` (Horizon).
- **Booking / availability / holds** → load skill `booking-engine`. All holds go through `BookingService` / an `InventoryDriver` — never raw-insert `booking_slots`.
- **Payment / deposit / reconcile** → load skill `payment-reconcile`.
- **New sport / vertical (golf, spa)** → load skill/workflow `vertical-dispatch` and run `/new-vertical`. Extend by config + driver + component; never branch per sport in core.
- **UI** → shadcn/ui only, `DashboardLayout`/`GuestLayout`, Inertia props; the calendar component comes from the vertical registry (`docs/08` §0).

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
