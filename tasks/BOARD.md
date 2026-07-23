# BOARD — SÂN task ledger

> Updated: 2026-07-23 · Protocol: [`README.md`](README.md). An agent picks a `todo` task (deps all `done`), **claims it by editing the file**, works within `scope`, and hands back `in-review` for the manager to verify + merge.

## Open (UI polish pass — after owner review of the built pages)

Owner: pages still look plain / inconsistent containers / booking page ugly + hard to use. Raise the craft bar (see `.claude/rules/ui-design` → Craft & consistency checklist). T07 is the foundation (blocks the rest).

| id | Task | status | owner | prio | depends_on | scope (short) |
|----|------|--------|-------|------|-----------|---------------|
| [T07](T07-polish-foundation.md) | Polish foundation — PageContainer + EmptyState v2 + consistent cards | todo | - | **P0** | — | Components/{PageContainer,EmptyState,PageHeader,StatCard,ui/card} + app.css |
| [T08](T08-public-booking-redesign.md) | Public booking redesign v2 (hero, time-of-day slots, premium & easy) | todo | - | P1 | T07 | Pages/Public/Booking/{Show,Status} |
| [T09](T09-config-polish.md) | Config screens polish (pricing/opening/branding, 2-col branding, rich empty states) | todo | - | P1 | T07 | Pages/Manager/Courts/{Opening,Pricing}Rules + Settings/Branding |
| [T10](T10-operational-polish.md) | Operational pages polish (home/calendar/reports/lists — consistent container) | todo | - | P2 | T07 | Pages/Manager/{Home,Calendar,Reports,Courts,Refunds,Reconcile,Series} |

## Manager-only actions (not delegated)
- [x] Merge PR #4/#5/#6, T01 (#8), **T02 (#9)**, **T04 (#7)** into `main` — all verified (build + 108 tests + browser).
- Note: workers should edit only their own task file's claim fields, NOT `BOARD.md` (manager owns it) — avoids the ledger merge conflicts seen on #7/#9 (code merged clean; only ledger files collided).

## Backlog (no task file yet — opened when it's their turn)
- Backend / go-live: run `migrate` on deploy · real Zalo ZNS HTTP transport · `scripts/deploy.sh` · backup cron + restore test · security headers/CSP · error monitoring. (See `../worklogs/2026-07-23-m6-audit-fixes.md` handoff.)

## Done
- **T06** Config screens (PR #12) · - **T05** Public booking UX (PR #11) · **T03** Reports (PR #10) · **T04** Grid calendar (PR #7) · **T02** Dashboard home (PR #9) · **T01** App shell & IA (PR #8) · Task-ledger (PR #6) · Design-system phase 1 (PR #5) · mass-assignment #10 (PR #4) · M6 audit fixes (PR #3). All on `main`.
