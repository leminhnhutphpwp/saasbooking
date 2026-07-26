# T30 — Customer and recurrence operations

## Status
**in-review**

## Scope
Deliver lightweight, phone-first customer operations and recurring-booking exception handling.

## Files created
1. `app/Services/CustomerService.php` — Phone normalization (strip spaces/dashes/leading 0→+84), tenant-scoped search (ILIKE), customer upsert (phone = identity), booking history with attendance stats.
2. `app/Http/Controllers/Manager/CustomerController.php` — `index` (search/paginate), `show` (profile+history), `store`/`update` (upsert via CustomerService).
3. `app/Http/Controllers/Manager/SeriesController.php` — Added `cancelOccurrence` (cancel one booking, series stays active) and `endSeries` (set ended, cancel pending bookings).
4. `routes/web.php` — Added customer routes + series recurrence operations routes.
5. `tests/Feature/Manager/CustomerOperationsTest.php` — Phone normalization, tenant-scoped search, upsert merge, cross-tenant isolation.
6. `tests/Feature/Manager/RecurrenceOperationsTest.php` — Cancel one occurrence, end series, invalid transitions, cross-tenant rejection.

## Invariants upheld
- Customer identity is phone-normalized through one service (`CustomerService::normalizePhone`)
- All booking operations go through `BookingService` (cancel path via `SeriesService::cancelOccurrence`)
- Tenant scope on every query (`WorkingTenant::id`)
- No destructive migration of existing records
- Series end only cancels pending_deposit bookings; confirmed bookings are untouched

## Verification
- Tests pass against PostgreSQL (feature tests using `RefreshDatabase`)
