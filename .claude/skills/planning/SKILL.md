---
name: planning
description: Planning methodology for SÂN — research first, phase-scope, classify do-now / reserved-door / not-doing, keep the invariants
---

# Planning Methodology — SÂN

How to turn a request into a plan that fits the project without breaking it.

## 1. Research first (read targeted, not everything)

- Start at `AGENTS.md` and `docs/README.md` — open the 1–3 docs the task maps to, not the whole folder.
- Re-read `CLAUDE.md` invariants before designing.
- Check `worklogs/` (the most recent few) for what a previous session did.

## 2. Scope to current priorities

Anchor every plan to `tasks/BOARD.md` and `docs/12-lo-trinh.md`. Core MVP modules already exist; do not plan them again. Pull a reserved door forward only with an explicit business reason.

## 3. Classify every item: do-now / 🚪 reserved-door / ❌ not-doing

This is the core discipline (see `docs/09`). Extend by **adding** (table, module, config entry, driver, component), never by editing the core. Anything golf/capacity/spa/builder/metered/gateway is a reserved door or a later phase — not Phase 1.

## 4. Define success

State measurable acceptance criteria and, for experiments, a stop/continue signal.

## 5. Keep the six invariants (always)

One system many product lines · extend by adding · `WorkingTenant` is the only tenant source · `BookingService` is the only concurrency chokepoint · two inventory shapes meet at booking · data invariants (snapshot price/deposit, BIGINT money, timestamptz, status enum, refund ledger). Run `/check-invariants` before committing.

## When to use

- Breaking down a feature request into tasks.
- Deciding what belongs in this phase vs a reserved door.
- Writing or reviewing a plan / roadmap change.

## Related docs

- `docs/12-lo-trinh.md` — current priorities and reserved doors
- `docs/02-yeu-cau-chuc-nang.md` — functional requirements / use cases
- `docs/09-kien-truc-mo-rong.md` — do-now / reserved-door / not-doing framework
