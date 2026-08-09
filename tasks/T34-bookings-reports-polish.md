# T34: Bookings List + Reports Polish (Phase 5)

**Status:** in-review  
**Priority:** P1  
**Assignee:** @general  
**Depends on:** T33  
**Branch:** `feat/bookings-reports-polish`

## Goal
Polish the Bookings list and Reports pages with status filter tabs, improved chart visualizations, and better data presentation.

## Acceptance Criteria
- [x] Bookings: Add status filter tabs (All/Pending/Confirmed/Completed/Cancelled/No-show)
- [x] Bookings: Improve card layout with better visual hierarchy
- [x] Reports: Replace hand-rolled SVG chart with better visualization (hover tooltips, axis labels)
- [x] Reports: Add occupancy visualization (donut/radial chart)
- [x] Reports: Make top customers clickable (link to customer show)
- [ ] Responsive design at 1440px and 390px viewports (pending browser verification)
- [x] No console errors or failed network requests
- [x] All existing tests pass (270 tests, 1052 assertions)

## Scope
- `apps/app/resources/js/Pages/Manager/Bookings/Index.jsx`
- `apps/app/resources/js/Pages/Manager/Reports/Index.jsx`

## Out of Scope
- Calendar (already done in T33)
- Home dashboard (already done in T32)
- Customer pages (already done in T30, T31)
- Global nav + Cmd+K (Phase 6)

## Notes
- Bookings list already has good structure from T28, focus on filter tabs
- Reports uses hand-rolled SVG, consider using existing chart patterns or improving current implementation
- Maintain existing pagination and filter functionality
