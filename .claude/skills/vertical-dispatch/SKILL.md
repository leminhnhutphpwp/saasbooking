---
name: vertical-dispatch
description: How the platform selects engine, calendar, and pricing per tenant type — driver pattern, so new verticals plug in without touching the core
---

# Vertical Dispatch — SÂN

This is how **"one system, many product lines"** is implemented: the system picks the *inventory engine* + *pricing* + *calendar/booking UI* from the **tenant's vertical** — no per-sport code.

## Dispatch by SHAPE, not by sport

- **Badminton, pickleball, tennis, futsal** = the **same shape** (resource-time-slot) → **same driver, same calendar, same flow**. They differ only by `courts.court_type` (a label) + `pricing_rule` + branding. **No per-sport code.**
- **Golf** = **capacity/session** (tee sheet) → a different driver + a different calendar (tee sheet), but reuses the whole lifecycle/deposit/Zalo/tenant/interop. Reserved door, not built now.

## Declared on the tenant

| Column | Example | Role |
|---|---|---|
| `tenants.vertical` | `racket_court` · `golf` · `spa` | Branding, terminology, default config, UI choice |
| derived `inventory_mode` | `resource_time_slot` · `capacity_session` | Selects the ENGINE (driver) |

`court_type` lives at the `courts` level — a label + pricing only, it does **not** change the engine.

## Backend — Strategy / Driver

```php
interface InventoryDriver {
    public function availability(int $tenantId, array $criteria): array;
    public function hold(int $tenantId, HoldRequest $req): Booking; // throws SlotTaken on conflict
    public function release(Booking $b): void;
}
class ResourceTimeSlotDriver implements InventoryDriver { /* exclusion constraint — Phase 1 */ }
class CapacitySessionDriver  implements InventoryDriver { /* counter UPDATE — reserved door */ }
```

```php
// config/booking.php — ADD a vertical = add one line, never edit the core
'verticals' => [
  'racket_court' => ['mode'=>'resource_time_slot','pricing'=>HourlyPeakPricing::class,'ui'=>'CourtGrid'],
  'golf'         => ['mode'=>'capacity_session',  'pricing'=>GreenFeePricing::class,  'ui'=>'TeeSheet'],
  'spa'          => ['mode'=>'resource_time_slot','pricing'=>ServicePricing::class,   'ui'=>'CourtGrid'],
],
'modes' => [
  'resource_time_slot' => ResourceTimeSlotDriver::class,
  'capacity_session'   => CapacitySessionDriver::class,
],
```

`BookingService` is a thin dispatcher + shared lifecycle: it resolves the driver from `tenant.vertical → mode` and delegates `hold/release/availability`; the state machine, deposit, and events are shared.

## Frontend — component registry (Inertia + React)

```js
// resources/js/Booking/registry.js
export const CALENDAR = { CourtGrid: CourtGridCalendar, TeeSheet: TeeSheetCalendar };
export const FLOW     = { CourtGrid: CourtBookingFlow,  TeeSheet: TeeTimeBookingFlow };
```

The controller passes a `ui` prop (from the vertical); the page picks the component. A shared shell (layout, VietQR deposit step, Zalo confirm) wraps every vertical.

## Golden rule

**Never branch per sport in core code** (`if ($court->type === 'pickleball')`). That belongs in config/driver. Adding a vertical = one `config/booking.php` entry + a driver (if a new shape) + a UI component. Use the `/new-vertical` command / workflow.

## When to use

- Adding a new tenant type / vertical (golf, spa, tennis venue).
- Reviewing whether a change wrongly hard-codes a sport into the core.
- Understanding why pickleball and badminton share 100% of the code.

## Related docs

- `docs/08-thiet-ke-module-chi-tiet.md` §0 — the dispatch mechanism
- `docs/09-kien-truc-mo-rong.md` — two inventory shapes, "one system, many product lines"
