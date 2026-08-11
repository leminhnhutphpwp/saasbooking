---
id: T55
title: Reports chart label geometry
status: done
owner: "OpenCode"
priority: P1
depends_on: [T49]
branch: feat/manager-analytics-overhaul
scope:
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - tasks/BOARD.md
  - tasks/T55-reports-chart-label-geometry.md
  - worklogs/2026-08-11-reports-chart-label-geometry.md
updated: 2026-08-11
---

## Goal
Correct the Reports revenue chart axis and label geometry at desktop and mobile widths without changing its data or filtering behavior.

## Context / references
- `.claude/skills/design-system/SKILL.md`
- `.claude/skills/design-system/references/charts.md`
- User screenshot: `/tmp/browser-screenshot-1786381418091.png`

## Acceptance criteria
- [ ] Y-axis labels, bar labels, and date labels are visible without clipping or overlap at 1440px and 390px.
- [ ] Turf hatch bars, zero baseline, Vietnamese currency, accessibility summary, and data filters remain intact.
- [ ] Frontend build, relevant PHP test, and Chrome visual QA pass.

## Out of scope (do NOT do here)
- Report data queries or manager layout changes.

## Verification
- [x] `docker compose exec -T vite npm run build` passes.
- [x] `docker compose exec -T app php artisan test tests/Feature/Manager/StaffOperationsAuthorizationTest.php` passes: 5 tests, 21 assertions.
- [x] Chrome CDP visual review passes at 1440px: `/tmp/browser-screenshot-1786381823323.png`.
- [x] Chrome CDP visual review passes at 390px: `/tmp/browser-screenshot-1786381787487.png`.

## Log
- 2026-08-11 · claimed for user-reported revenue chart clipping and label overlap regression.
- 2026-08-11 · reserved responsive SVG gutter, shortened labels, retained the peak data day, and verified no label clipping or overlap at both required widths.
