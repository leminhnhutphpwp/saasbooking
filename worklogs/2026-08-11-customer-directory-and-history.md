---
task: T67
title: Customer directory and history
date: 2026-08-11
---

## Goal
Complete Customer directory with URL-backed search, pagination, and bounded booking history.

## Changed
- `CustomerService.php`: added `searchPaginated()`, `getStats()`, `getHistoryPaginated()` methods; `paginate()` now calls `withQueryString()`
- `CustomerController.php`: `index()` unified to always paginate (search or browse), returns `filters` + `pagination` meta; `show()` uses paginated history + separate stats query
- `Index.jsx`: reads `filters.q` instead of `query`; `goPage()` preserves `q` in URL; added "Xóa bộ lọc" button
- `Show.jsx`: accepts `pagination` prop; adds prev/next controls for booking history; uses `formatDate`/`formatTime` for slot display
- `CustomerOperationsTest.php`: added 5 new tests (search by phone HTTP, search by name ILIKE HTTP, paginated filtered results, preserved query string, history pagination)

## Decisions
- Booking history ordered by `created_at desc` (bookings table has no `start_at`; that column lives on `booking_slots`)
- Stats computed via separate DB queries (not from paginated result) so counts are always accurate
- `withQueryString()` requires the actual HTTP request context; test for preserved query string uses HTTP assertion instead of direct service call

## Next
- Playwright tests for responsive behavior at desktop and 390px (not done in this session)
