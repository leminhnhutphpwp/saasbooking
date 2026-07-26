# BOARD — SÂN task ledger

> Updated: 2026-07-26 · Protocol: [`README.md`](README.md). An agent picks a `todo` task (deps all `done`), **claims it by editing the file**, works within `scope`, and hands back `in-review` for the manager to verify + merge.

## Open (Re-theme v3 — match the QwenCloud reference; owner: emerald look is "gớm")

| id | Task | status | owner | prio | depends_on | scope (short) |
|----|------|--------|-------|------|-----------|---------------|
| [T32](T32-public-booking-selection-remake.md) | Public booking read model and selection remake | todo | - | P1 | T31 | Public controller + Show page + worklog |
| [T33](T33-public-booking-status-receipt.md) | Public booking payment status receipt remake | todo | - | P1 | T32 | Public Status page + worklog |
| [T35](T35-smart-pricing-rules.md) | Smart pricing rules | in-review | opencode | P1 | - | Catalog pricing + opening rules + venue settings + manager calendar |

## Manager-only actions (not delegated)
- [x] Merge T22, T23, T24, T27, T28, T29, T30 into `main` — all verified (200 tests + pint clean).

## Backlog (no task file yet — opened when it's their turn)
- Backend / go-live: run `migrate` on deploy · real Zalo ZNS HTTP transport · `scripts/deploy.sh` · backup cron + restore test · security headers/CSP · error monitoring. (See `../worklogs/2026-07-23-m6-audit-fixes.md` handoff.)

## Done
- **T30** Customer and recurrence operations (feat/customer-recurrence-operations).
- **T29** Booking operations workbench (feat/booking-operations-workbench).
- **T28** Venue readiness and money config (feat/venue-readiness-money-config).
- **T27** Tenant resource category foundation (feat/tenant-resource-categories).
- **T24** Complete court table interactions (feat/complete-court-table-interactions).
- **T23** Court query and bulk status API (feat/court-query-bulk-status).
- **T22** Modern court operations table (feat/modern-court-table).
- **T34** Public booking regression and browser coverage — feature tests passed.
- **T31** Public booking visual primitives — in-review.
- **T26** Canonical platform definition contract — completed (docs).
- **T25** Canonical product and operations reset — completed (docs).
- **T20** Wide court configuration containers · **T21** Calendar container normalization — completed locally.
- **T14** DemoSeeder — completed on branch.
- **T13** v3 aesthetic sweep — completed on branch.
- **T12** Home dashboard redesign — completed on branch.
- **T11** Re-theme violet + shell (topbar/light sidebar) — extracted clean, verified + merged.
- **Polish pass**: T07 foundation (#13) · T08 public redesign (#14) · T09 config (#15) · T10 operational (#16) — all verified + merged.
- **T06** Config screens (PR #12) · **T05** Public booking UX (PR #11) · **T03** Reports (PR #10) · **T04** Grid calendar (PR #7) · **T02** Dashboard home (PR #9) · **T01** App shell & IA (PR #8) · Task-ledger (PR #6) · Design-system phase 1 (PR #5) · mass-assignment #10 (PR #4) · M6 audit fixes (PR #3). All on `main`.
