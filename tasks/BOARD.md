# BOARD — SÂN task ledger

> Updated: 2026-07-23 · Protocol: [`README.md`](README.md). An agent picks a `todo` task (deps all `done`), **claims it by editing the file**, works within `scope`, and hands back `in-review` for the manager to verify + merge.

## Open (UI overhaul — after court-owner feedback)

| id | Task | status | owner | prio | depends_on | scope (short) |
|----|------|--------|-------|------|-----------|---------------|
| [T01](T01-app-shell-ia.md) | App shell & IA + palette v2 (grouped/wide/darker sidebar, unify to one shell, fix orphaned /dashboard, less-bright palette) | in-review | opencode-agent | **P0** | — | Layouts, nav, app.css, tailwind, routes, Home/Reports stubs |
| [T02](T02-dashboard-home.md) | Dashboard = real home (today overview + quick actions + cross-links) | todo | - | P1 | T01 | Pages/Manager/Home + HomeController |
| [T03](T03-reports.md) | Reports (revenue / occupancy / no-show / top customers) | todo | - | P1 | T01 | Pages/Manager/Reports + ReportController |
| [T04](T04-grid-calendar.md) | Owner grid calendar (court×time grid, colored blocks, click-to-book) | claimed¹ | opencode-agent | P1 | T01 | Pages/Manager/Calendar + CalendarController |
| [T05](T05-public-booking.md) | Public booking page (mobile-first, tenant branding, slot price/state, nicer QR) | todo | - | P1 | T01 | Pages/Public/Booking + PublicBookingController |
| [T06](T06-config-screens.md) | Config screens (weekly opening grid, pricing bands, branding uploader+preview) | todo | - | P2 | T01 | Pages/Manager/Courts/{Opening,Pricing}Rules + Settings/Branding + controllers |

¹ T04 — PR #7 submitted & manager-reviewed; **changes requested** (rebase onto #5, use StatusBadge, drop raw date input + `.codegraph`). Functionally verified green.

## Manager-only actions (not delegated)
- [x] Merge **PR #4 / #5 / #6** into `main` (done 2026-07-23; main verified 108/108 + build + pint green).
- [ ] T04 (PR #7): tell the worker to **rebase onto current `main`** (now has #5) + apply review fixes.
- [ ] Next dispatch: **T01** (P0) — unblocks T02/T03/T05/T06.

## Backlog (no task file yet — opened when it's their turn)
- Backend / go-live: run `migrate` on deploy · real Zalo ZNS HTTP transport · `scripts/deploy.sh` · backup cron + restore test · security headers/CSP · error monitoring. (See `../worklogs/2026-07-23-m6-audit-fixes.md` handoff.)

## Done
- Task-ledger workflow (PR #6) · Design-system foundation phase 1 (PR #5) · mass-assignment #10 (PR #4) · M6 audit fixes (PR #3). All on `main`.
