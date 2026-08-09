# 2026-08-06 - Bookings List + Reports Polish (Phase 5)

## What we did
Implemented Phase 5 of the UI/UX overhaul plan, focusing on polishing the Bookings list and Reports pages.

### Bookings List (`/manager/bookings`)
- Added status filter tabs (Tất cả / Chờ cọc / Đã xác nhận / Hoàn tất / Đã hủy / Bom sân / Hết hạn)
- Tabs use rounded pill buttons with active state highlighting
- Clicking a tab filters the list and updates URL params
- Maintained existing filter form (search, date range, court, status dropdown)

### Reports (`/manager/reports`)
- **RevenueChart improvements**:
  - Added Y-axis labels with grid lines (dashed)
  - Formatted labels: M for millions, K for thousands
  - Increased chart height from 160px to 200px for better readability
  - Added padding for axis labels (padX=40, padY=20)
  - Increased hover area for data points (r=12 transparent circle)
  - Added X-axis date labels with better spacing
  
- **Occupancy visualization**:
  - Replaced StatCard with dedicated Card component
  - Integrated OccupancyGauge component (circular progress)
  - Shows occupancy rate percentage and booked/total minutes
  
- **Top customers**:
  - Made customer items clickable (Link component)
  - Navigate to customer show page on click
  - Updated ReportController to select `customers.uuid` in query

## Verification results
- ✅ Build: passes (no errors, no warnings)
- ✅ Tests: 270 tests, 1052 assertions pass
- ⏳ Browser verification: pending (requires manual login)

## Files changed
- `apps/app/resources/js/Pages/Manager/Bookings/Index.jsx` - Added status filter tabs
- `apps/app/resources/js/Pages/Manager/Reports/Index.jsx` - Enhanced chart, occupancy gauge, clickable customers
- `apps/app/app/Http/Controllers/Manager/ReportController.php` - Added uuid to top customers query

## Next steps
- User manual browser verification at 1440px and 390px
- Move to Phase 6: Global nav + Cmd+K (if approved)
