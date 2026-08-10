# 2026-08-10 - Manager booking and calendar conformance

**Goal:** Bring the manager booking, calendar, and recurring-series views into DESIGN.md conformance without changing booking behavior.

**Changed:** `Bookings/Index.jsx`, `Bookings/Show.jsx`, `Calendar/Index.jsx`, and `Series/Index.jsx` now use semantic desktop tables with mobile alternatives, accessible calendar controls and actions, left-aligned actionable empty states, and consistent card/status/icon treatment.

**Decisions:** The calendar keeps its full schedule above `md`; below it, a per-court list exposes booked blocks as links to a filtered booking list and open slots as real buttons, preventing horizontal scroll at 360px. Existing shared primitives and token utilities were used unchanged.

**Next:** CDP/browser QA remains pending because `http://127.0.0.1:9222` was unreachable after two attempts.

## Verification

- `git diff --check -- <T41 page files>` passed.
- `docker compose exec vite npm run build` passed (Vite emitted existing deprecation warnings).
- `docker compose exec app php artisan test tests/Feature/Manager/BookingWorkbenchTest.php` passed: 19 tests, 44 assertions.
- Browser QA blocked: CDP endpoint unavailable.

## Status

In review.
