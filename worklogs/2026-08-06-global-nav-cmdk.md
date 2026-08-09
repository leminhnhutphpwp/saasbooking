# 2026-08-06 - Global Nav + Cmd+K Command Palette (Phase 6)

## What we did
Implemented Phase 6 (final phase) of the UI/UX overhaul plan: Global navigation with Cmd+K command palette.

### Command Palette (`Cmd+K` / `Ctrl+K`)
- Created `CommandPalette.jsx` component with:
  - Dialog-based UI with search input
  - Debounced search (300ms delay) to reduce API calls
  - Keyboard navigation: Arrow keys to move, Enter to select, Esc to close
  - Visual feedback: selected item highlighted, type badges (Đơn/Khách/Sân)
  - Icons for each result type: Calendar (booking), User (customer), MapPin (court)
  - Footer with keyboard shortcuts hint

### Search Backend (`SearchController.php`)
- Created invokable controller with fuzzy search across:
  - **Bookings**: by code or customer name/phone (limit 10)
  - **Customers**: by name, phone, or email (limit 10)
  - **Courts**: by name (limit 10)
- Tenant isolation via `WorkingTenant::id()`
- Minimum 2 characters required to trigger search
- Returns JSON with bookings, customers, courts arrays

### AppTopbar Integration
- Replaced read-only search input with clickable button
- Opens command palette on click
- Keyboard shortcut: `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- Shows `⌘K` hint badge on desktop
- Search icon and placeholder text preserved

### Route
- Added `GET /manager/search` endpoint
- Protected by auth + tenant middleware
- Named route: `manager.search`

## Key decisions
- **Custom implementation** instead of cmdk library to avoid new dependency
- **Debounced search** (300ms) to balance responsiveness and API load
- **Limit 10 results per category** to keep UI clean and fast
- **Dialog component** from shadcn/ui for consistent styling
- **Deferred notification bell** to future task (not in original scope)

## Verification results
- ✅ Build: passes (no errors, no warnings)
- ✅ Tests: ManagerDashboardTest passes (3 tests, 20 assertions)
- ⏳ Browser verification: pending (requires manual login)

## Files changed
- `apps/app/resources/js/Components/CommandPalette.jsx` (new)
- `apps/app/resources/js/Components/AppTopbar.jsx` (updated)
- `apps/app/app/Http/Controllers/Manager/SearchController.php` (new)
- `apps/app/routes/web.php` (added search route + import)

## Next steps
- User manual browser verification at 1440px and 390px
- Test command palette with real data
- Verify keyboard navigation works correctly
- **UI/UX overhaul complete!** All 6 phases done (T30-T35)

## Summary of all phases
1. ✅ T30: Customer Show page - Hero section, stats, favorite court, filter tabs
2. ✅ T31: Customer Index page - Filter tabs, debounced search, sortable columns
3. ✅ T32: Home Dashboard refresh - Sparkline, occupancy gauge, court status
4. ✅ T33: Calendar polish - Mobile timeline, booking type icons, slide-over panel
5. ✅ T34: Bookings list + Reports - Status tabs, chart improvements, clickable customers
6. ✅ T35: Global nav + Cmd+K - Command palette with fuzzy search
