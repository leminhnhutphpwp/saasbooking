---
description: Add a new booking vertical (e.g. golf, spa) via the vertical-driver pattern, without touching the core
argument-hint: <vertical-name>
---

Add a new booking vertical named **$ARGUMENTS** to the SÂN platform following `docs/08-thiet-ke-module-chi-tiet.md` §0 (vertical driver dispatch) and the "one system, many product lines" principle in `CLAUDE.md`. The whole point is to extend by ADDING, never by editing the core.

Do the following and stop for review:

1. **Pick the inventory shape:** `resource_time_slot` (courts, spa) or `capacity_session` (golf tee-time, classes, events). If it needs `capacity_session` and no `CapacitySessionDriver` exists yet, implement that driver as a new `InventoryDriver` — do NOT fork `BookingService`.
2. **Register it:** add ONE entry to `config/booking.php` under `verticals` → `['<name>' => ['mode' => ..., 'pricing' => ...Pricing::class, 'ui' => '...']]`.
3. **Pricing:** add a `PricingStrategy` class only if the pricing shape differs (e.g. `GreenFeePricing` for golf: member/guest/visitor, 9-18 holes, twilight, caddie/buggy).
4. **Frontend:** add the calendar + booking-flow React components and register them in `resources/js/Booking/registry.js`. Reuse the shared shell (layout, VietQR deposit step, Zalo confirm).
5. **Migrations:** add ONLY new tables (e.g. `sessions`, `booking_participants` for capacity). Do NOT alter `bookings`, `payments`, `notifications`, or tenant tables.
6. **Tests:** add `tests/Feature` for the driver's concurrency guarantee and for booking-lifecycle reuse.

At the end, list the files you added and confirm that NO core files were modified (BookingService lifecycle, payment, notification, WorkingTenant). Then suggest running the `invariant-reviewer` agent.
