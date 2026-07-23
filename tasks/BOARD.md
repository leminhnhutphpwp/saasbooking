# BOARD — SÂN task ledger

> Updated: 2026-07-23 · Protocol: [`README.md`](README.md). An agent picks a `todo` task (deps all `done`), **claims it by editing the file**, works within `scope`, and hands back `in-review` for the manager to verify + merge.

## Open (Re-theme v3 — match the QwenCloud reference; owner: emerald look is "gớm")

Switch the whole app to a modern **violet/indigo** palette + the airy card/shell aesthetic of the reference. T11 is the foundation (blocks the rest).

| id | Task | status | owner | prio | depends_on | scope (short) |
|----|------|--------|-------|------|-----------|---------------|
| [T11](T11-retheme-violet-shell.md) | Re-theme v3 (violet/indigo) + airy card & shell (sidebar + top-bar) | todo | - | **P0** | — | app.css, tailwind, ManagerLayout, nav, ui/{card,button}, PageContainer/Header, StatCard, AppTopbar |
| [T12](T12-home-dashboard-redesign.md) | Home dashboard redesign (hero + quick-links row + insight cards w/ charts) | todo | - | P1 | T11 | Pages/Manager/Home + QuickLinks |
| [T13](T13-retheme-sweep.md) | v3 sweep — remaining pages (reports charts, calendar, config, lists, login) | todo | - | P2 | T11 | remaining Manager pages + Auth/Login |

## Manager-only actions (not delegated)
- [x] Merge PR #4/#5/#6, T01 (#8), **T02 (#9)**, **T04 (#7)** into `main` — all verified (build + 108 tests + browser).
- Note: workers should edit only their own task file's claim fields, NOT `BOARD.md` (manager owns it) — avoids the ledger merge conflicts seen on #7/#9 (code merged clean; only ledger files collided).

## Backlog (no task file yet — opened when it's their turn)
- Backend / go-live: run `migrate` on deploy · real Zalo ZNS HTTP transport · `scripts/deploy.sh` · backup cron + restore test · security headers/CSP · error monitoring. (See `../worklogs/2026-07-23-m6-audit-fixes.md` handoff.)

## Done
- **Polish pass**: T07 foundation (#13) · T08 public redesign (#14) · T09 config (#15) · T10 operational (#16) — all verified + merged.
- **T06** Config screens (PR #12) · - **T05** Public booking UX (PR #11) · **T03** Reports (PR #10) · **T04** Grid calendar (PR #7) · **T02** Dashboard home (PR #9) · **T01** App shell & IA (PR #8) · Task-ledger (PR #6) · Design-system phase 1 (PR #5) · mass-assignment #10 (PR #4) · M6 audit fixes (PR #3). All on `main`.
