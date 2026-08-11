# 2026-08-11 · Workflow E2E coverage (T70)

## Goal
Add deterministic Manager workflow browser QA covering Calendar, Bookings, Series, Courts, Customers, Refunds, Reconcile, and Settings.

## Changed
- Created `apps/app/tests/e2e/manager-calendar-bookings-series.spec.js` (13 tests)
- Created `apps/app/tests/e2e/manager-courts-customers-refunds.spec.js` (14 tests)
- Created `apps/app/tests/e2e/manager-settings.spec.js` (6 tests)
- Updated `apps/app/tests/e2e/README.md` with Manager test documentation

## Decisions
- Used per-test `login()` helper instead of `test.use({ storageState })` because Playwright's `test.use` applies to `beforeAll` hooks, causing ENOENT errors when the auth file doesn't exist yet.
- Filtered React `Warning:` messages from console error assertions — pre-existing duplicate-key warnings in Calendar and icon-casing warnings in EmptyState are not test concerns.
- Used `{ force: true }` on calendar free-slot clicks because the z-0 free-slot buttons sit behind z-10 booked-slot overlays.
- Used `/manager/venue` (actual route) instead of `/manager/venue-profile` (task description).
- Used `.first()` on ambiguous `getByText('Lịch sử đặt sân')` selector in customer detail page.

## Results
- 33/33 tests passed in 1.4m via Playwright Docker runner
- All tests run at both 1440px and 390px viewports
- No horizontal overflow detected
- No destructive actions submitted (dialogs opened and closed with Escape)

## Next
- Fix pre-existing React duplicate-key warnings in Calendar/Index.jsx (free_intervals use non-unique keys across courts)
- Fix EmptyState component icon casing warning (resolvedIcon)
