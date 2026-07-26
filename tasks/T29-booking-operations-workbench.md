# T29 — Booking operations workbench

**Status:** done
**Owner:** backend-agent
**Depends on:** —
**Scope:** Controller, routes, form requests, and feature tests for the booking operations workbench (owner/receptionist). No React/UI changes.

## Goal

Turn the calendar and booking list into a real owner/receptionist workbench:
- Paginated booking list with filters (date range, court, status, search by code/customer phone/name)
- Single booking detail with payments, slots, customer info
- Staff-assisted/walk-in booking through BookingService (the ONLY concurrency path)
- Lifecycle actions: check-in, complete, no-show, cancel (with reason)

## Acceptance Criteria

1. `BookingWorkbenchController` with index/show/store/updateStatus
2. All queries scoped by `WorkingTenant::id($request)`
3. Walk-in booking goes through `BookingService::createHold` — no direct slot insert
4. Status transitions validated against the enum state machine
5. Tenant forging rejected (cross-tenant access = 403)
6. Feature tests covering list filters, detail, walk-in booking, invalid transitions, tenant forging, money invariants
7. Routes added to web.php under manager middleware

## Files to create/modify

- `app/Http/Controllers/Manager/BookingWorkbenchController.php` (NEW)
- `app/Http/Requests/Manager/StoreWalkInBookingRequest.php` (NEW)
- `app/Http/Requests/Manager/UpdateBookingStatusRequest.php` (NEW)
- `routes/web.php` (MODIFY — add routes)
- `tests/Feature/Manager/BookingWorkbenchTest.php` (NEW)
- `tasks/T29-booking-operations-workbench.md` (this file)
