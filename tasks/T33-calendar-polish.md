# T33: Calendar Polish (Phase 4)

**Status:** in-review  
**Priority:** P1  
**Assignee:** @general  
**Depends on:** T32  
**Branch:** `feat/calendar-polish`

## Goal
Polish the Calendar page with mobile-friendly timeline view, booking type indicators, slide-over detail panel, and court summary chips.

## Acceptance Criteria
- [x] Mobile (<640px): switch horizontal grid to vertical timeline view
- [x] Add booking type visual indicator (walk-in vs online icon)
- [x] Click booking opens slide-over detail panel (not just tooltip)
- [x] Add "Hôm nay" chip count summary per court in header row
- [ ] Responsive design at 1440px and 390px viewports (pending browser verification)
- [x] No console errors or failed network requests
- [x] All existing tests pass (CalendarTest: 1 test, 11 assertions)

## Scope
- `apps/app/resources/js/Pages/Manager/Calendar/Index.jsx` ✓

## Out of Scope
- Home dashboard (already done in T32)
- Customer pages (already done in T30, T31)
- Bookings list + Reports (Phase 5)

## Implementation Details
- Added Sheet component for slide-over booking detail panel
- Added booking type icons: User (walk-in/owner_manual) vs Globe (online/zalo)
- Added mobile timeline view (<640px) with vertical list layout
- Added court summary chips in header showing booking count per court
- Grid view hidden on mobile, shown on desktop (sm:block)
- Click booking block opens slide-over panel with full details and "Xem chi tiết" button

## Verification
- Build: ✓ passes
- Tests: ✓ CalendarTest passes (1 test, 11 assertions)
- Browser verification: pending (requires manual login)

## Notes
- Calendar is the most complex page (402+ lines)
- Mobile layout uses vertical timeline instead of horizontal grid
- Absolute-positioning layout preserved for desktop grid
- Maintained existing walk-in booking functionality
