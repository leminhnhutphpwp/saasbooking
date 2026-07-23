# BOARD — SÂN task ledger

> Updated: 2026-07-23 · Protocol: [`README.md`](README.md). An agent picks a `todo` task (deps all `done`), **claims it by editing the file**, works within `scope`, and hands back `in-review` for the manager to verify + merge.

## Open (UI overhaul — after court-owner feedback)

_All UI-overhaul tasks (T01–T06) done — see Done. Next focus: go-live backlog._

| id | Task | status | owner | prio | depends_on | scope (short) |
|----|------|--------|-------|------|-----------|---------------|

## Manager-only actions (not delegated)
- [x] Merge PR #4/#5/#6, T01 (#8), **T02 (#9)**, **T04 (#7)** into `main` — all verified (build + 108 tests + browser).
- Note: workers should edit only their own task file's claim fields, NOT `BOARD.md` (manager owns it) — avoids the ledger merge conflicts seen on #7/#9 (code merged clean; only ledger files collided).

## Backlog (no task file yet — opened when it's their turn)
- Backend / go-live: run `migrate` on deploy · real Zalo ZNS HTTP transport · `scripts/deploy.sh` · backup cron + restore test · security headers/CSP · error monitoring. (See `../worklogs/2026-07-23-m6-audit-fixes.md` handoff.)

## Done
- **T06** Config screens (PR #12) · - **T05** Public booking UX (PR #11) · **T03** Reports (PR #10) · **T04** Grid calendar (PR #7) · **T02** Dashboard home (PR #9) · **T01** App shell & IA (PR #8) · Task-ledger (PR #6) · Design-system phase 1 (PR #5) · mass-assignment #10 (PR #4) · M6 audit fixes (PR #3). All on `main`.
