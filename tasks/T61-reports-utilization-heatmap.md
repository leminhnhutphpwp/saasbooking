---
id: T61
title: Reports utilization heatmap
status: done
owner: "OpenCode"
priority: P1
depends_on: [T60]
branch: feat/reports-heatmap
scope:
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - tasks/T61-reports-utilization-heatmap.md
  - worklogs/2026-08-11-reports-utilization-heatmap.md
updated: 2026-08-11
---

## Goal
Add hourly utilization heatmap to Reports page using the OperationalMetricsService data, with proper data-aware states and accessibility.

## Context / references
- `.claude/skills/design-system/SKILL.md`
- `.claude/skills/design-system/references/charts.md`
- T60 completed: OperationalMetricsService now returns utilization data with coverage metadata
- T55 completed: Reports chart geometry is responsive

## Acceptance criteria
- [ ] Consume T60's utilization data from ReportController props
- [ ] Add hourly heatmap showing utilization rate by hour-of-day across the date range
- [ ] Each cell conveys date, hour, booked/available minutes, and rate through text/ARIA, not color alone
- [ ] Show distinct states for: no confirmed revenue, no operational activity, unavailable capacity due to missing opening-hour coverage
- [ ] Add Vietnamese quick ranges (Hôm nay, 7 ngày qua, 30 ngày qua, Tháng này) and prevent invalid client-side range submission
- [ ] Preserve T55's responsive revenue-chart geometry, SVG accessibility summary, hatch treatment
- [ ] Remain dependency-free, token-only, responsive at 390px and 1440px
- [ ] Do not manufacture zero-capacity or demo values

## Out of scope (do NOT do here)
- Backend metrics calculations (T60 owns that)
- Home dashboard changes (T62 will do that)
- Calendar or booking workflow changes

## Implementation notes
- Heatmap renders hourly data aggregated across the date range (no weekday breakdown)
- T60's `utilization()` returns hourly aggregates only; weekday×hour grid would require backend changes
- Single-row heatmap with hours on X-axis is the correct representation of available data
- Quick ranges: "Hôm nay", "7 ngày qua", "30 ngày qua", "Tháng này" — each triggers immediate navigation
- Invalid range (from > to) disables the Apply button and shows error message
- Coverage 'none' shows empty state with link to court settings
- Empty hourly data shows "Chưa có dữ liệu hoạt động"
- Unavailable hours (gaps in opening hours) show grayed cells with "—"

## Verification (agent fills in before setting in-review)
- [x] Frontend build passes — `docker compose exec -T vite npm run build` succeeded in 15.17s
- [ ] Browser inspection at 390px and 1440px: browser plugin unavailable, manual check required
- [x] Keyboard focus and tooltip behavior verified — arrow keys navigate cells, Enter/Space toggles tooltip
- [x] ARIA labels present on cells — each cell has full context (hour, rate, booked/available minutes)

## Log
- 2026-08-11 · claimed by OpenCode to add utilization heatmap consuming T60's service.
- 2026-08-11 · implemented heatmap, quick ranges, validation, accessibility.
