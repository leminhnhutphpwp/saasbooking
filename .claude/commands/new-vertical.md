---
description: Add a new booking vertical (e.g. golf, spa) via the vertical-driver pattern, without touching the core
argument-hint: <vertical-name>
---

Add a new booking vertical named **$ARGUMENTS** to the Sân platform following `docs/08-thiet-ke-module-chi-tiet.md` §0 (vertical driver dispatch) and the "one system, many product lines" principle in `CLAUDE.md`. The whole point is to extend by ADDING, never by editing the core.

## Step-by-step checklist

### Phase 1: Research & design

- [ ] **1.1 Identify inventory shape:**
  - `resource_time_slot` (courts, spa, anything with time slots per resource) → uses existing `ResourceTimeSlotDriver`
  - `capacity/session` (golf tee-time, classes, events with capacity) → needs new `CapacitySessionDriver` (reserved door)

- [ ] **1.2 Check existing infrastructure:**
  - Does `CapacitySessionDriver` exist? If not, implement it first (or mark as reserved door).
  - Is the UI component (`$ARGUMENTS` → `TeeSheet`, `CourtGrid`, etc.) already registered?

- [ ] **1.3 Classify:**
  - `do now` — building this now
  - `reserved door` — design the interface, but do not implement the driver yet
  - `not doing` — explicitly out of scope

### Phase 2: Backend registration

- [ ] **2.1 Register vertical in config:**

```php
// config/booking.php
'verticals' => [
    '$ARGUMENTS' => [
        'mode' => 'resource_time_slot',  // or 'capacity_session'
        'ui' => 'CourtGrid',             // or 'TeeSheet'
    ],
],
'modes' => [
    // existing drivers...
    // 'capacity_session' => CapacitySessionDriver::class,  // if new shape
],
```

- [ ] **2.2 Add PricingStrategy (if different pricing shape):**

```php
// app/Services/Catalog/PricingStrategies/$ARGUMENTSPricing.php
class $ARGUMENTSPricing implements PricingStrategy
{
    public function resolve(int $tenantId, int $resourceId, CarbonInterface $startAt, CarbonInterface $endAt): int
    {
        // Implement pricing logic for this vertical
    }
}
```

Register in `config/booking.php` under the vertical's `pricing` key.

- [ ] **2.3 Implement Driver (if new inventory shape):**

```php
// app/Services/Booking/Drivers/$ARGUMENTSDriver.php
class $ARGUMENTSDriver implements InventoryDriver
{
    public function hold(Booking $booking, array $slots): void
    {
        // Implement anti-overlap logic for this shape
    }

    public function release(Booking $booking): void
    {
        // Free slots
    }

    public function commit(Booking $booking): void
    {
        // Commit slots after deposit confirmed
    }
}
```

### Phase 3: Frontend

- [ ] **3.1 Create React components (if new UI):**

```
resources/js/Booking/$ARGUMENTS/
├── Calendar.jsx      // Calendar/availability view
├── BookingFlow.jsx   // Multi-step booking form
└── index.js          // Export
```

- [ ] **3.2 Register in component registry:**

```js
// resources/js/Booking/registry.js
import $ARGUMENTSCalendar from './$ARGUMENTS/Calendar';
import $ARGUMENTSBookingFlow from './$ARGUMENTS/BookingFlow';

export const CALENDAR = {
    CourtGrid: CourtGridCalendar,
    TeeSheet: TeeSheetCalendar,
    $ARGUMENTS: $ARGUMENTSCalendar,
};

export const FLOW = {
    CourtGrid: CourtBookingFlow,
    TeeSheet: TeeTimeBookingFlow,
    $ARGUMENTS: $ARGUMENTSBookingFlow,
};
```

### Phase 4: Migrations & seeders

- [ ] **4.1 Add ONLY new tables** (if needed):

```php
// migrations/xxxx_create_$ARGUMENTS_sessions_table.php
Schema::create('$ARGUMENTS_sessions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id');
    // ... columns specific to this vertical
});
```

- [ ] **4.2 DO NOT alter existing tables** (`bookings`, `payments`, `notifications`, tenant tables).

- [ ] **4.3 Update DemoSeeder** to seed sample data for the new vertical.

### Phase 5: Tests

- [ ] **5.1 Concurrency test:**

```php
// tests/Feature/Booking/$ARGUMENTSDoubleBookTest.php
public function test_two_parallel_holds_on_same_slot_one_wins(): void
{
    // Create tenant with $ARGUMENTS vertical
    // Hold same slot concurrently
    // Assert exactly one succeeds, one gets 409
}
```

- [ ] **5.2 Booking lifecycle test:**

```php
// tests/Feature/Booking/$ARGUMENTSLifecycleTest.php
public function test_hold_confirm_release_lifecycle(): void
{
    // Test full lifecycle: hold → confirm → release
}
```

- [ ] **5.3 Pricing test:**

```php
// tests/Feature/Booking/$ARGUMENTSPricingTest.php
public function test_pricing_resolves_correctly(): void
{
    // Test new pricing strategy
}
```

### Phase 6: Documentation

- [ ] **6.1 Update AGENTS.md** (§7 Pointers) if adding new skills/agents.

- [ ] **6.2 Write worklog** per `worklogs/README.md`.

## Files to list at the end

After implementation, list all files added/modified:

```
Files added:
- app/Services/Booking/Drivers/$ARGUMENTSDriver.php
- app/Services/Catalog/PricingStrategies/$ARGUMENTSPricing.php
- resources/js/Booking/$ARGUMENTS/Calendar.jsx
- resources/js/Booking/$ARGUMENTS/BookingFlow.jsx
- tests/Feature/Booking/$ARGUMENTSDoubleBookTest.php

Files modified:
- config/booking.php (verticals + modes registry)
- resources/js/Booking/registry.js (component registry)
- database/seeders/DemoSeeder.php (sample data)
```

## Verification

- [ ] **NO core files modified:** BookingService lifecycle, payment, notification, WorkingTenant — unchanged.
- [ ] **Concurrency test passes:** 2 parallel holds → 1 wins, 1 gets 409.
- [ ] **Pricing resolves correctly:** no price=0 for slots within opening hours.
- [ ] **Run invariant-reviewer agent** to check for OWNS/REFERENCES violations.

## Suggested next steps

1. Run `php artisan test --filter=$ARGUMENTS` to verify all tests pass.
2. Run `./vendor/bin/pint` to ensure code style.
3. Run `npm run build` to verify frontend compiles.
4. Suggest running the `invariant-reviewer` agent on the diff.
