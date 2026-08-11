# 2026-08-11 · Series end/occurrence operations (T65)

## Goal
Expose existing end-series and cancel-occurrence operations in the recurring-workflow UI, distinguishing "Kết thúc lịch" from "Hủy lịch".

## Changed
- **`apps/app/app/Http/Controllers/Manager/SeriesController.php`**: Added `occurrences` prop to `index()` — filters upcoming bookings (start_at >= now), sorts by start time, limits to 10, includes uuid/start_at/end_at/status/can_cancel.
- **`apps/app/app/Models/RecurringSeries.php`**: Added missing `customer()` relationship (BelongsTo Customer).
- **`apps/app/resources/js/Pages/Manager/Series/Index.jsx`**: 
  - Display upcoming occurrences per active series card with date/time, StatusBadge, and cancel button (when can_cancel).
  - Added "Kết thúc lịch" (outline button) and "Hủy lịch" (ghost/destructive button) for active series.
  - Three confirmation dialogs: cancel series, end series, cancel occurrence — each with distinct copy.
  - Mobile-friendly: stacked occurrences, full-width action buttons on small screens.
- **`apps/app/tests/Feature/Manager/SeriesControllerTest.php`**: Added 7 new tests covering occurrence props, past exclusion, tenant isolation on index, can_cancel guard, end-series behavior, invalid occurrence cancel, and price snapshot immutability.

## Decisions
- Used `PendingDeposit` (not `Pending`) for `can_cancel` check — matches the actual `BookingStatus` enum and the server-side guard in `cancelOccurrence()`.
- Used actual route paths (`/cancel-occurrence/{booking}`, `/end`) rather than the task description's suggested paths — routes already exist.
- Occurrences sorted in PHP collection (not SQL join) since start_at lives on `booking_slots`, not `bookings`.
- End-series dialog uses `variant="neutral"` to visually distinguish from destructive cancel.

## Next
- Browser verification at 1440px and 390px when browser plugin is available.
- Set task to `in-review` after manual browser check.
