# 2026-08-05 - Venue-first booking experience

## Overview
Reworked the public booking, payment receipt, and manager home views around day-to-day court operations. The payment flow continues to render the server-provided VietQR payload and does not alter holds, reconciliation, cancellation, or refunds.

## Files Changed
| File | Change |
|------|--------|
| `apps/app/resources/js/Pages/Public/Booking/Show.jsx` | Replaced decorative court cards and filters with venue, date, court availability, slot, and order-summary flow. |
| `apps/app/resources/js/Pages/Public/Booking/Status.jsx` | Made the real QR, deposit, recipient, and transfer memo the primary receipt content; removed token-sharing copy. |
| `apps/app/resources/js/Pages/Manager/Home/Index.jsx` | Focused the dashboard on today’s schedule and reconciliation exceptions. |
| `apps/app/tests/e2e/public-booking.spec.js` | Added stable summary and seeded VietQR flow checks. |
| `docker-compose.yml` | Moves only the host PostgreSQL forward port to configurable `5433` by default; container traffic remains `db:5432`. |

## Key Decisions
1. QR is only rendered when the existing server `qr` payload exists; no image, fallback QR, or payment behavior was introduced.
2. Kept the booking sheet focus trap, Escape dismissal, trigger focus restoration, routes, and existing selectors used by browser tests.
3. Kept manager colors on app design tokens; public screens use the tenant brand only as their accent.

## Verification
- [x] `git diff --check` passed.
- [x] `docker compose exec -T vite npm run build` passed.
- [x] `docker compose exec -T app php artisan test` passed: 268 tests, 1,038 assertions.
- [x] Playwright Chromium passed: 17 tests.
- [ ] Pint reports a pre-existing style issue in `app/Services/Booking/BookingService.php`; T22 changed no PHP production files.

## Handoff Notes
- Use `DB_FORWARD_PORT` to override the local PostgreSQL host port if `5433` is also occupied. Containers always use `db:5432`.
- A production QR requires the tenant's active bank account configuration. The seeded E2E flow verifies a scanable VietQR payload and never marks payment paid without reconciliation.

## Status
In review
