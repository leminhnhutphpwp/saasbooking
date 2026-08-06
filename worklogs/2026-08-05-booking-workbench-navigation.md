# 2026-08-05 - Booking workbench navigation

**Goal:** Fix booking-card detail navigation under runtime RLS and make the booking list faster to scan.
**Changed:** Resolved booking UUIDs inside `BookingWorkbenchController` after RLS context, and rebuilt booking filters/cards in `Manager/Bookings/Index`.
**Decisions:** Do not reorder global middleware. The controller keeps explicit WorkingTenant ownership checks while avoiding implicit binding, which occurs before appended RLS middleware. On mobile, amount and deposit move to a card footer so customer and schedule remain readable.
**Next:** Runtime browser detail URL that previously returned 404 now renders correctly; screenshot `/tmp/san-ux/booking-list-mobile-refined.png` records the 390px list state.
