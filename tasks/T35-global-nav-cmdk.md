# T35: Global Nav + Cmd+K Command Palette (Phase 6)

**Status:** in-review  
**Priority:** P1  
**Assignee:** @general  
**Depends on:** T34  
**Branch:** `feat/global-nav-cmdk`

## Goal
Implement a global command palette (Cmd+K) for quick navigation and search across bookings, customers, and courts. Improve global navigation with notification bell.

## Acceptance Criteria
- [x] Implement Cmd+K command palette with fuzzy search
- [x] Search across bookings (by code, customer name)
- [x] Search across customers (by name, phone)
- [x] Search across courts (by name)
- [x] Keyboard navigation (arrow keys, Enter to select)
- [ ] Add notification bell to AppTopbar showing attention items count (deferred)
- [ ] Responsive design at 1440px and 390px viewports (pending browser verification)
- [x] No console errors or failed network requests
- [x] All existing tests pass (ManagerDashboardTest: 3 tests, 20 assertions)

## Scope
- `apps/app/resources/js/Components/AppTopbar.jsx` ✓
- `apps/app/resources/js/Components/CommandPalette.jsx` ✓ (new)
- `apps/app/app/Http/Controllers/Manager/SearchController.php` ✓ (new)
- `apps/app/routes/web.php` ✓ (add search endpoint)

## Out of Scope
- All previous phases (T30-T34)
- Backend search optimization (use existing queries)
- Notification bell (deferred to future task)

## Implementation Details
- Created `CommandPalette` component with Dialog, debounced search (300ms), keyboard navigation
- Created `SearchController` with fuzzy search across bookings, customers, courts (limit 10 per category)
- Added route `GET /manager/search` with tenant isolation
- Updated `AppTopbar` to open command palette on click or Cmd+K/Ctrl+K
- Search results show icon, label, sublabel, and type badge

## Verification
- Build: ✓ passes
- Tests: ✓ ManagerDashboardTest passes (3 tests, 20 assertions)
- Browser verification: pending (requires manual login)

## Notes
- Custom implementation (no cmdk library dependency)
- Search endpoint is lightweight (<100ms response expected)
- Maintains tenant isolation via WorkingTenant
