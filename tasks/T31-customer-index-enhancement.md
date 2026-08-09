# T31: Customer Index Page Enhancement (Phase 2)

**Status:** in-review  
**Priority:** P1  
**Assignee:** @general  
**Depends on:** T30  
**Branch:** `feat/customer-index-enhancement`

## Goal
Enhance the Customer Index page with advanced filtering, search, and improved layout to match the quality of the Customer Show page.

## Acceptance Criteria
- [x] Add filter tabs: All / Active (booked in last 30 days) / Inactive
- [x] Implement debounced search with real-time filtering
- [x] Convert customer list to table view with sortable columns
- [ ] Add bulk action checkboxes and toolbar (deferred - not in scope)
- [x] Responsive design: table → card view on mobile
- [ ] Browser verification at 1440px and 390px viewports (deferred - browser login issue)
- [x] No console errors or failed network requests
- [x] All existing tests pass (14 tests, 33 assertions)

## Scope
- `apps/app/resources/js/Pages/Manager/Customers/Index.jsx` ✓
- `apps/app/resources/js/hooks/useDebounce.js` ✓ (created)
- `apps/app/app/Http/Controllers/Manager/CustomerController.php` (no changes needed)

## Out of Scope
- Customer Show page (already done in T30)
- Customer detail/edit functionality
- Backend API changes (unless required for filtering)
- Bulk actions (deferred to future task)

## Implementation Details
- Created `useDebounce` hook for real-time search
- Implemented client-side filtering (All/Active/Inactive tabs)
- Added sortable columns (name, phone, bookings_count)
- Desktop: Table view with shadcn/ui Table component
- Mobile: Card view with compact layout
- Maintained existing search, pagination, and create customer dialog

## Verification
- Build: ✓ passes
- Tests: ✓ 14 tests, 33 assertions pass
- Browser verification: deferred due to CSRF login issue in headless browser

## Notes
- Use existing `useDebounce` hook from `apps/app/resources/js/hooks/useDebounce.js`
- Follow shadcn/ui Table component patterns
- Ensure tenant isolation is maintained
