---
name: vertical-tester
description: Tests new verticals according to checklist — config, driver, pricing, concurrency, lifecycle
---

# Vertical Tester — Sân

A testing agent that verifies a new vertical is correctly implemented. It runs through a comprehensive checklist covering config, driver, pricing, concurrency, and lifecycle.

## When to use

- After implementing a new vertical (e.g. golf, spa, tennis).
- Before merging a PR that adds a new vertical.
- When verifying that a vertical dispatch correctly.

## Checklist

### 1. Config registration

- [ ] **Vertical registered in `config/booking.php`:**
  ```php
  'verticals' => [
      'your_vertical' => [
          'mode' => 'resource_time_slot', // or 'capacity_session'
          'ui' => 'CourtGrid',            // or 'TeeSheet'
      ],
  ],
  ```

- [ ] **Driver registered in `config/booking.php`:**
  ```php
  'modes' => [
      'resource_time_slot' => ResourceTimeSlotDriver::class,
      // or
      'capacity_session' => CapacitySessionDriver::class,
  ],
  ```

- [ ] **Default vertical fallback works:**
  - If tenant has no `vertical` column, `config('booking.default_vertical')` is used.

### 2. Driver implementation

- [ ] **Driver implements `InventoryDriver` interface:**
  ```php
  class YourDriver implements InventoryDriver
  {
      public function hold(Booking $booking, array $slots): void { ... }
      public function release(Booking $booking): void { ... }
      public function commit(Booking $booking): void { ... }
  }
  ```

- [ ] **`hold()` is atomic:**
  - Uses `DB::transaction()` or relies on Postgres constraints.
  - Throws `SlotTakenException` on conflict (exclusion constraint or counter overflow).

- [ ] **`release()` frees slots correctly:**
  - Updates `hold_status` to `Released`.
  - Exclusion constraint predicate frees the range.

- [ ] **`commit()` commits slots correctly:**
  - Updates `hold_status` to `Committed`.

### 3. Pricing strategy

- [ ] **PricingStrategy class exists (if different from default):**
  ```php
  class YourPricing implements PricingStrategy
  {
      public function resolve(int $tenantId, int $resourceId, CarbonInterface $startAt, CarbonInterface $endAt): int { ... }
  }
  ```

- [ ] **Pricing covers full opening hours:**
  - No gaps where `price = 0` (except free slots intentionally).
  - `pricing_rules.end_local` >= `opening_rules.close_local`.

- [ ] **Price snaps back correctly:**
  - `BookingService::createHold()` snapshots price into `booking_slots.price_snapshot`.
  - Existing bookings do NOT re-read live pricing.

### 4. Concurrency test

- [ ] **Two parallel holds on same slot → one wins, one gets 409:**

```php
// tests/Feature/Booking/YourVerticalDoubleBookTest.php
public function test_two_parallel_holds_one_wins_one_409(): void
{
    $tenant = Tenant::factory()->create(['vertical' => 'your_vertical']);
    $court = Court::factory()->create(['tenant_id' => $tenant->id]);

    $start = CarbonImmutable::tomorrow()->hour(10);
    $end = $start->addHour();

    $params = [
        'slots' => [['court_id' => $court->id, 'start_at' => $start, 'end_at' => $end]],
        'customer_id' => Customer::factory()->create(['tenant_id' => $tenant->id])->id,
        'channel' => 'web',
        'payment_mode' => 'full',
    ];

    // Run 2 concurrent holds
    $results = Parallel::run([
        fn () => BookingService::createHold($tenant, $params),
        fn () => BookingService::createHold($tenant, $params),
    ]);

    // Exactly one succeeds, one throws SlotTakenException
    $successes = collect($results)->filter(fn ($r) => $r instanceof Booking);
    $failures = collect($results)->filter(fn ($r) => $r instanceof SlotTakenException);

    $this->assertCount(1, $successes);
    $this->assertCount(1, $failures);
}
```

### 5. Booking lifecycle test

- [ ] **Full lifecycle works:**

```php
// tests/Feature/Booking/YourVerticalLifecycleTest.php
public function test_hold_confirm_release_lifecycle(): void
{
    $tenant = Tenant::factory()->create(['vertical' => 'your_vertical']);
    $court = Court::factory()->create(['tenant_id' => $tenant->id]);

    $start = CarbonImmutable::tomorrow()->hour(10);
    $end = $start->addHour();

    // 1. Hold
    $booking = BookingService::createHold($tenant, [
        'slots' => [['court_id' => $court->id, 'start_at' => $start, 'end_at' => $end]],
        'customer_id' => Customer::factory()->create(['tenant_id' => $tenant->id])->id,
        'channel' => 'web',
        'payment_mode' => 'full',
    ]);

    $this->assertEquals(BookingStatus::PendingDeposit, $booking->status);
    $this->assertNotNull($booking->hold_expires_at);

    // 2. Confirm
    BookingService::confirmDeposit($booking);
    $booking->refresh();

    $this->assertEquals(BookingStatus::Confirmed, $booking->status);
    $this->assertNull($booking->hold_expires_at);

    // 3. Release
    BookingService::release($booking);
    $booking->refresh();

    $this->assertEquals(BookingStatus::Released, $booking->status);
}
```

### 6. Availability computation

- [ ] **AvailabilityService returns correct free slots:**

```php
// tests/Feature/Booking/YourVerticalAvailabilityTest.php
public function test_availability_computes_correctly(): void
{
    $tenant = Tenant::factory()->create(['vertical' => 'your_vertical']);
    $court = Court::factory()->create(['tenant_id' => $tenant->id]);

    // Seed opening rules (06:00-23:00)
    // Seed pricing rules (price > 0 for all hours)

    $date = CarbonImmutable::tomorrow();
    $availability = AvailabilityService::search($tenant->id, $date);

    $this->assertCount(1, $availability);
    $this->assertEquals($court->id, $availability[0]['court_id']);
    $this->assertNotEmpty($availability[0]['free']);
}
```

### 7. Frontend components

- [ ] **Calendar component registered in `registry.js`:**
  ```js
  export const CALENDAR = {
      CourtGrid: CourtGridCalendar,
      TeeSheet: TeeSheetCalendar,
      YourVertical: YourVerticalCalendar,
  };
  ```

- [ ] **BookingFlow component registered in `registry.js`:**
  ```js
  export const FLOW = {
      CourtGrid: CourtBookingFlow,
      TeeSheet: TeeTimeBookingFlow,
      YourVertical: YourVerticalBookingFlow,
  };
  ```

- [ ] **Controller passes `ui` prop correctly:**
  ```php
  return Inertia::render('Public/Booking/Show', [
      'ui' => config("booking.verticals.{$tenant->vertical}.ui"),
      // ... other props
  ]);
  ```

### 8. No core files modified

- [ ] **BookingService lifecycle unchanged:**
  - `createHold()`, `release()`, `confirmDeposit()`, `cancel()` — not modified.

- [ ] **Payment module unchanged:**
  - `PaymentService`, `ReconcileService` — not modified.

- [ ] **Notification module unchanged:**
  - `NotificationService`, listeners — not modified.

- [ ] **WorkingTenant unchanged:**
  - `Support/WorkingTenant` — not modified.

## How to use

1. Run the checklist above.
2. For each item, verify it passes.
3. Report findings:
   - **PASS** — item verified.
   - **FAIL** — item failed, with details.
   - **SKIP** — item not applicable (e.g. reserved door).

## Example output

```
## Vertical Tester: spa

### Config registration
- PASS: Vertical 'spa' registered in config/booking.php
- PASS: Driver 'resource_time_slot' registered in modes
- PASS: Default vertical fallback works

### Driver implementation
- PASS: SpaDriver implements InventoryDriver
- FAIL: SpaDriver::hold() does not throw SlotTakenException on conflict
  → Fix: Add try/catch for QueryException code 23P01

### Concurrency test
- PASS: Two parallel holds → one wins, one gets 409

### No core files modified
- PASS: BookingService lifecycle unchanged
- PASS: Payment module unchanged
- PASS: Notification module unchanged

Summary: 8/9 PASS, 1 FAIL
```

## Related skills

- `vertical-dispatch` — driver pattern, config registry
- `booking-engine` — concurrency, exclusion constraint, lifecycle
- `court-catalog` — pricing rules, opening rules
- `module-connections` — OWNS/REFERENCES, cross-module patterns
