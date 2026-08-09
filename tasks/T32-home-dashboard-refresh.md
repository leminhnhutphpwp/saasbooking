# T32: Home Dashboard Refresh (Phase 3)

**Status:** claimed  
**Priority:** P1  
**Assignee:** @general  
**Depends on:** T31  
**Branch:** `feat/home-dashboard-refresh`

## Goal
Refresh the Home dashboard with sparkline charts, occupancy gauge, real-time court status, and improved attention panel to provide better operational insights at a glance.

## Acceptance Criteria
- [ ] Add sparkline chart to revenue metric card using existing `revenueSeries` data
- [ ] Add occupancy gauge visualization (radial/progress bar)
- [ ] Add "Court status now" section showing real-time occupied/available courts
- [ ] Use shared `StatCard` component instead of inline `MetricCard`
- [ ] Add `QuickLinks` component below header (currently unused)
- [ ] Improve Attention panel with direct action buttons
- [ ] Responsive design at 1440px and 390px viewports
- [ ] No console errors or failed network requests
- [ ] All existing tests pass

## Scope
- `apps/app/resources/js/Pages/Manager/Home/Index.jsx`
- `apps/app/app/Http/Controllers/Manager/HomeController.php` (if backend changes needed)
- `apps/app/resources/js/Components/QuickLinks.jsx` (if modifications needed)

## Out of Scope
- Customer pages (already done in T30, T31)
- Calendar polish (Phase 4)
- Bookings list + Reports (Phase 5)

## Notes
- Extract inline `MetricCard` and `ActionRow` to shared components if reusable
- Use existing `StatCard` component with `chart` slot for sparklines
- Court status query should be lightweight (< 20 courts typical)
- Maintain existing data structure from HomeController
