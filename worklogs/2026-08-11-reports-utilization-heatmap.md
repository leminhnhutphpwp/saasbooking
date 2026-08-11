# 2026-08-11 — T61 Reports utilization heatmap

## Goal
Add hourly utilization heatmap to Reports page using T60's OperationalMetricsService data, with Vietnamese quick ranges and accessibility.

## Changed
- `apps/app/app/Http/Controllers/Manager/ReportController.php`: call `utilization()` and pass data to Inertia props
- `apps/app/resources/js/Pages/Manager/Reports/Index.jsx`:
  - Added `UtilizationHeatmap` component with CSS Grid layout
  - Added Vietnamese quick ranges: "Hôm nay", "7 ngày qua", "30 ngày qua", "Tháng này"
  - Added client-side validation to prevent invalid range submission (from > to)
  - Heatmap shows hourly utilization with color-coded cells (turf-100 to turf-700)
  - Keyboard navigation: arrow keys move between cells, Enter/Space toggles tooltip
  - ARIA labels on each cell with full context (hour, rate, booked/available minutes)
  - Distinct states: no coverage (link to court settings), no data, partial coverage (grayed cells)
  - Responsive: horizontal scroll with overflow-x-auto for narrow viewports

## Decisions
- Single-row heatmap (hours on X-axis only) because T60's service returns hourly aggregates without weekday breakdown
- Weekday×hour grid would require backend changes, which is out of scope for T61
- Used inline styles for heatmap colors to access CSS variables directly (no Tailwind utilities for turf-300/700 backgrounds)
- Quick ranges trigger immediate navigation rather than just updating state

## Next
- T62 will add similar metrics to Home dashboard
- Consider enhancing T60's service to return weekday×hour data for a 2D heatmap in a future iteration
