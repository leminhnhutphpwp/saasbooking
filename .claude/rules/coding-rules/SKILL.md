---
name: coding-rules
description: General coding rules for all PHP and JS/React code in the SÂN project
metadata:
  scope: global
  type: rules
---

# Coding Rules

## PHP (Laravel)

1. **Strict typing** — `declare(strict_types=1);` at the top of every PHP file; explicit parameter and return types.
2. **Service layer** — business logic lives in `app/Services/`, never in controllers.
3. **No hardcoding** — use `config()` / `.env`; never inline secrets, keys, or magic values.
4. **Error handling** — wrap external calls (VietQR reconcile webhook, Zalo ZNS) in `try/catch`; log with context via `Log::error(...)`.
5. **Money & time** — money is `BIGINT` integer VND (never float/decimal); timestamps are `timestamptz`; recurring rules store local time + `tz`.

## JS / React (Inertia)

1. **shadcn/ui only** — use primitives from `resources/js/components/ui/`; never hand-roll inputs/buttons/dialogs.
2. **Inertia data flow** — read via Inertia props; no separate API layer for the dashboard.
3. **Named exports** preferred; keep components small and composable.
4. **Path alias** — `@/*` → `resources/js/*`.

## General

1. **Small patches** — keep changes small and independently verifiable.
2. **Tests with code** — add/adjust tests when behavior changes (see the `testing` rule).
3. **No secrets in git** — ever.
4. **Language split** — design docs (`docs/`) are Vietnamese; code, config, and agent-facing files (`CLAUDE.md`, `AGENTS.md`, `.claude/`) are English. End-user UI text is Vietnamese.
5. **Respect the invariants** — before finishing booking/payment/tenant code, run `/check-invariants` (the `invariant-reviewer` agent). See `CLAUDE.md`.

## When to use this skill

Reference this when:
- Writing any new code
- Reviewing code quality
- Setting up linting / static analysis
