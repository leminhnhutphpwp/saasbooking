---
id: T00
title: <short title>
status: todo            # todo | claimed | in-review | done | blocked
owner: "-"              # id of the agent that claimed it, or "-"
priority: P1            # P0 (blocking) | P1 | P2 | P3
depends_on: []          # task ids that must be done first, e.g. [T01]
branch: <type>/<slug>   # branch for this task
scope:                  # file boundary this task may edit — must NOT overlap other tasks
  - apps/app/...
updated: 2026-07-23
---

## Goal
<1-3 sentences: what and why>

## Context / references
<links to docs, reference files, screenshots, locked design decisions>

## Acceptance criteria
- [ ] ...
- [ ] ...

## Out of scope (do NOT do here)
- ...

## Verification (agent fills in before setting in-review)
- [ ] `npm run build` passes
- [ ] `php artisan test` (if backend touched): X/Y
- [ ] Browser check (owner@pickleball.vn): ...

## Log
- 2026-07-23 · created by manager
