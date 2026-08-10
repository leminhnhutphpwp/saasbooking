# T48 - Design Kit Booking Calendar Pages

## Goal

Migrate Manager booking, calendar, and recurring-series page UI to the canonical design kit without changing booking behavior.

## Changed

- Applied canonical cards, tables, numeric treatment, empty states, and mobile reflow to booking and recurring-series pages.
- Reworked the Manager calendar into an unboxed court/time grid with even 44px rows, hairlines, keyboard-operable available slots, and a mobile court list.
- Used Asia/Ho_Chi_Minh for calendar-relative labels and the current-time indicator.

## Decisions

- Did not add drag selection: existing walk-in booking remains the only calendar selection flow.
- Did not apply `.court-mark`: the Manager calendar has no selected-slot state.

## Verification

- `docker compose exec -T app php artisan test tests/Feature/Manager/CalendarTest.php tests/Feature/Manager/BookingWorkbenchTest.php tests/Feature/Manager/SeriesControllerTest.php` - passed, 23 tests and 63 assertions.
- `docker compose exec -T vite npm run build` - passed; Vite reported pre-existing deprecation warnings.
- `git diff --check` - passed.
- Browser check blocked: the browser tool could not connect to `http://127.0.0.1:9222`.

## Next

T48 is ready for review.
