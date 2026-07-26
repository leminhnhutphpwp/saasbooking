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
interface InventoryDriver
{
    /**
     * Hold the given slots for the booking. MUST be atomic and throw
     * SlotTakenException when a slot loses the race.
     */
    public function hold(Booking $booking, array $slots): void;

    /** Free the booking's slots (expired / cancelled). */
    public function release(Booking $booking): void;

    /** Commit the booking's slots (deposit confirmed). */
    public function commit(Booking $booking): void;
}
```

### Concrete drivers

```php
// Phase 1 — resource-time-slot (courts, spa)
class ResourceTimeSlotDriver implements InventoryDriver
{
    public function hold(Booking $booking, array $slots): void
    {
        try {
            foreach ($slots as $slot) {
                BookingSlot::create([
                    'tenant_id' => $booking->tenant_id,
                    'booking_id' => $booking->id,
                    'court_id' => $slot['court_id'],
                    'start_at' => $slot['start_at'],
                    'end_at' => $slot['end_at'],
                    'price_snapshot' => $slot['price_snapshot'],
                    'hold_status' => HoldStatus::Holding,
                ]);
            }
        } catch (QueryException $e) {
            if ($e->getCode() === '23P01') { // exclusion_violation
                throw new SlotTakenException;
            }
            throw $e;
        }
    }

    public function release(Booking $booking): void
    {
        $booking->slots()->update(['hold_status' => HoldStatus::Released]);
    }

    public function commit(Booking $booking): void
    {
        $booking->slots()->update(['hold_status' => HoldStatus::Committed]);
    }
}
```

### Config registry (the only place to add a vertical)

```php
// config/booking.php
'verticals' => [
    'racket_court' => [
        'mode' => 'resource_time_slot',
        'ui' => 'CourtGrid',
    ],
    // 'golf' => ['mode' => 'capacity_session', 'ui' => 'TeeSheet'],   // reserved door
    // 'spa'  => ['mode' => 'resource_time_slot', 'ui' => 'CourtGrid'], // reserved door
],

'modes' => [
    'resource_time_slot' => ResourceTimeSlotDriver::class,
    // 'capacity_session' => CapacitySessionDriver::class,   // reserved door
],
```

### driverFor() — how BookingService selects the driver

```php
// BookingService.php
private function driverFor(Tenant $tenant): InventoryDriver
{
    $vertical = $tenant->vertical ?? config('booking.default_vertical');
    $mode = config("booking.verticals.{$vertical}.mode");
    $driverClass = config("booking.modes.{$mode}");

    return app($driverClass);
}
```

**Adding a new vertical = add one entry to `verticals` + one entry to `modes` + implement the Driver class.** Never edit BookingService lifecycle code.

## Frontend — component registry (Inertia + React)

```js
// resources/js/Booking/registry.js
export const CALENDAR = {
    CourtGrid: CourtGridCalendar,
    TeeSheet: TeeSheetCalendar,
};

export const FLOW = {
    CourtGrid: CourtBookingFlow,
    TeeSheet: TeeTimeBookingFlow,
};
```

The controller passes a `ui` prop (from the vertical config); the Inertia page picks the component from the registry. A shared shell (layout, VietQR deposit step, Zalo confirm) wraps every vertical.

## Step-by-step: adding a new vertical

### 1. Pick the inventory shape
- **Resource-time-slot** (courts, spa): uses `ResourceTimeSlotDriver`, exclusion constraint anti-double-book.
- **Capacity/session** (golf, classes): needs a new `CapacitySessionDriver` (reserved door — not built yet).

### 2. Register it
Add ONE entry to `config/booking.php`:

```php
'verticals' => [
    'spa' => [
        'mode' => 'resource_time_slot',
        'ui' => 'CourtGrid',  // reuse existing calendar
    ],
],
```

### 3. Pricing (if different shape)
Add a `PricingStrategy` class only if the pricing model differs:

```php
// app/Services/Catalog/PricingStrategies/ServicePricing.php
class ServicePricing implements PricingStrategy
{
    public function resolve(int $tenantId, int $serviceId, CarbonInterface $startAt, CarbonInterface $endAt): int
    {
        // spa: price per service × duration, not per hour
    }
}
```

### 4. Frontend (if different UI)
Add React components and register in `resources/js/Booking/registry.js`:

```js
import TeeSheetCalendar from './TeeSheet/Calendar';
import TeeTimeBookingFlow from './TeeSheet/BookingFlow';

export const CALENDAR = { CourtGrid: CourtGridCalendar, TeeSheet: TeeSheetCalendar };
export const FLOW = { CourtGrid: CourtBookingFlow, TeeSheet: TeeTimeBookingFlow };
```

### 5. Migrations (only new tables)
Add ONLY new tables (e.g. `sessions`, `booking_participants` for capacity). Do NOT alter `bookings`, `payments`, `notifications`, or tenant tables.

### 6. Tests
- Concurrency test: 2 parallel holds → 1 wins, 1 gets 409.
- Booking lifecycle: hold → confirm → release works with the new driver.
- Pricing: new strategy resolves correctly.

## Golden rule

**Never branch per sport in core code** (`if ($court->type === 'pickleball')`). That belongs in config/driver. Adding a vertical = one `config/booking.php` entry + a driver (if a new shape) + a UI component. Use the `/new-vertical` command / workflow.

## When to use

- Adding a new tenant type / vertical (golf, spa, tennis venue).
- Reviewing whether a change wrongly hard-codes a sport into the core.
- Understanding why pickleball and badminton share 100% of the code.

## Related docs

- `docs/08-thiet-ke-module-chi-tiet.md` §0 — the dispatch mechanism
- `docs/09-kien-truc-mo-rong.md` — two inventory shapes, "one system, many product lines"
- `.claude/commands/new-vertical.md` — step-by-step command for adding verticals
