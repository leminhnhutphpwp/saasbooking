---
name: documentation
description: Mandatory worklog rules after every task for the SÂN project
metadata:
  scope: global
  type: rules
---

# Documentation Rules — Worklogs

## 🔴 MANDATORY: after every substantial task, write a worklog

No worklog = task not complete. It lets the next agent/session pick up without re-reading everything. See `worklogs/README.md` for the convention.

## File naming

`worklogs/<YYYY-MM-DD>-<task-slug>.md` — use the real date (ask the user or read the environment if unsure).

## Required template

```markdown
# <date> — <task name>

## Overview
2–3 sentences: what was done and why.

## Files Changed
| File | Change |
|------|--------|
| `path/file.php` | ... |

## Key Decisions
1. Decision — reason (link to CLAUDE.md / docs if it became a rule).

## Verification
- [ ] Static/lint: pass / fail
- [ ] Tests: X/Y passed (name the filter)
- [ ] Manual check: steps

## Handoff Notes
- What a future agent MUST know (new config, new API, cross-module impact).

## Status
✅ Completed | 🔄 In Progress | ⚠️ Blocked (reason)
```

## Writing rules

1. **One worklog per task/session.** Don't merge unrelated work.
2. **Write immediately after verify** (tests/lint) — record the results.
3. **Decisions and rationale, not a diff** — git already has the diff.
4. **If a decision becomes a durable rule**, also add it to `CLAUDE.md` / `AGENTS.md` / the relevant `docs/` file — worklogs are history, not the source of truth.
5. **Blocked tasks still get a worklog** stating the blocker.

## When to use this skill

Applies to ALL tasks — a foundational project rule.
