# Worklog — T64 Bookings daily desk workflow

**Date**: 2026-08-11
**Task**: T64
**Branch**: feat/bookings-desk-workflow

## Goal
Optimize Bookings list for daily desk operations with quick date filters, improved filter context, and mobile-friendly action layout.

## Changed

### `apps/app/resources/js/Pages/Manager/Bookings/Index.jsx`
- Added quick date controls above filter bar: "Hôm nay", "Ngày mai", "Xóa bộ lọc" as pill-shaped buttons using design tokens (bg-sunk, bg-turf-600 for active state)
- Added filter summary below filter bar showing applied filters in Vietnamese ("Đang lọc: [court] · [status] · [date]") using text-ink-soft
- Added helper functions: `toISODate`, `getToday`, `getTomorrow`, `formatShortDate` for date formatting
- Quick date buttons update URL query params via `router.get()` with `date_from` and `date_to` set to same date
- Active state detection for "Hôm nay" and "Ngày mai" buttons
- "Xóa bộ lọc" button appears only when filters are active and clears all filters
- Preserved existing server query parameters, pagination, court/status/search filters, and Back navigation

### `apps/app/resources/js/Pages/Manager/Bookings/Show.jsx`
- Updated action buttons to be mobile-responsive: flex-col on mobile (full-width, 44px height), flex-row on desktop
- Added responsive classes: `w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap` for wrapper
- Added `h-11 w-full sm:h-auto sm:w-auto` to each button for 44px touch target on mobile
- Maintained existing confirmation dialog and state-derived action set

## Decisions
- Used `date_from` and `date_to` (existing params) instead of single `date` param to maintain backend compatibility
- Quick date buttons set both `date_from` and `date_to` to same date for single-day filtering
- Filter summary uses `useMemo` to avoid recomputation on every render
- Used `text-white` for active button text (equivalent to `--ink-invert` token, no utility class exists for it)
- Placed quick date controls outside the filter form card for visual separation
- Filter summary placed between filter form and results for context

## Verification
- Frontend build: passed (1.82s)
- PHP tests: 19/19 passed (BookingWorkbenchTest)
- Browser verification: blocked (no Chrome CDP container at 127.0.0.1:9225)

## Next
- Manual browser verification at 1440px and 390px when Chrome container is available
- Test quick date button interactions and URL updates
- Verify mobile action button layout on Show page
- Confirm filter summary displays correctly with various filter combinations
