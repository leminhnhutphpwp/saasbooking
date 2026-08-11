# Worklog: Refunds and Reconcile work queues (T66)

**Date**: 2026-08-11
**Task**: T66
**Branch**: feat/manager-analytics-overhaul

## Goal
Optimize Refunds and Reconcile work queues with booking context, customer information, and searchable candidate selection.

## Changed

### Backend (PHP)
- **RefundController.php**: Added eager-loading of `payment.booking.slots` and new props: `booking_code`, `booking_uuid`, `customer_name`, `customer_phone`, `slot_summary` (ISO timestamps)
- **ReconcileController.php**: Replaced `pendingBookings` with `candidates` prop filtered by `whereHas('payments', status=Awaiting)`, added `expected_deposit` and `slot_summary` with ISO timestamps, limited to 50 results

### Frontend (JSX)
- **Refunds/Index.jsx**: Added booking code as clickable link (router.visit), customer name/phone display ("Khách vãng lai" fallback), slot summary formatter ("T3 11/08 · 18:00-19:30"), StatusBadge, formatted date/time
- **Reconcile/Unmatched.jsx**: Replaced Select dropdown with searchable dialog — search input filters candidates by code/name/phone, candidate list with highlight on selection, confirmation preview, empty state message, submit disabled without selection

### Tests
- **RefundControllerTest.php** (new): 3 tests — booking context props, slot summary ISO timestamps, tenant scoping
- **ReconcileTest.php** (added): 3 tests — candidates with customer/slot context, excludes bookings without awaiting payment, slot summary ISO timestamps

## Decisions
- Used `PaymentStatus::Awaiting` (actual enum) instead of `PaymentStatus::AwaitingMatch` (task spec)
- Used `Booking::where('tenant_id', ...)` instead of `Booking::forTenant()` (scope doesn't exist on Booking model)
- Client-side search filter on candidates array (no server round-trip)
- Slot summary format: "T3 11/08 · 18:00-19:30" using first slot only

## Verification
- Pint: PASS
- Tests: 309 passed, 1604 assertions
- Build: built in 1.85s

## Next
- Playwright manual check: login → Reconcile manual-match dialog and Refund confirmation; desktop and 390px
