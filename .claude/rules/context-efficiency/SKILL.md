---
name: context-efficiency
description: Read SÂN docs/code in a targeted, per-task way — never bulk-read everything
metadata:
  scope: global
  type: rules
---

# Context Efficiency — Read Targeted, Not Everything

The spec is 13 docs plus code. Reading broadly "to be safe" wastes context and slows every task. Default to the **smallest set that answers the task**, and widen only when a specific gap forces it.

## Reading order (cheapest first)

1. **`CLAUDE.md`** (root) — always in context; the non-negotiable invariants. Start here.
2. **`AGENTS.md`** → the **"task → which doc"** navigation table. Use it instead of guessing.
3. **`docs/README.md`** — the 5-part index + dependency map; open the ONE relevant doc, not the folder.
4. **Grep / Glob to locate**, then **Read only the relevant range** (`offset`/`limit`) — not the whole file, unless it is short or you truly need all of it.
5. **Load one Skill** (`architecture`, `booking-engine`, `payment-flow`, `vertical-dispatch`, …) only when its "When to use" matches. One skill, not all.

## Hard rules

- **Don't re-read what's already in context** (CLAUDE.md, loaded skills, files you just edited). The harness tracks file state.
- **Prefer search over Read for a single fact** — if you know the table/column/flag, grep it.
- **Worklogs: the most recent few, or the last ~7 days** — never "read all of `worklogs/`". Grep them by keyword for a specific past change.
- **Reference docs are Vietnamese; config/agent files are English** — don't translate one to read the other.

## When to read more

Escalate deliberately: a failing assumption, a cross-module change, or a contract you must not break (the exclusion constraint, reconcile idempotency, tenant isolation) justifies pulling the matching doc/skill. State *why* you are widening the read.

## When to use this skill

Reference this at the **start of any task** to decide what to read, and whenever you feel the urge to "read everything first".
