---
name: module-connections
description: How to connect modules — OWNS/REFERENCES rules, Service calls, domain events, cross-module patterns
---

# Module Connections — SÂN

Modules are logically separated (Model + Service + Controller + Job per module), but live in one Laravel monolith on one PostgreSQL. **Modules NEVER read/write another module's tables directly.** Communication goes through one of three sanctioned paths.

## The OWNS / REFERENCES contract

Every table belongs to exactly one module (OWNS). Other modules may hold a foreign key reference (REFERENCES) but must never INSERT, UPDATE, or DELETE rows they do not own.

| Term | Right | Example |
|---|---|---|
| **OWNS** | INSERT / UPDATE / DELETE | `court-catalog` owns `pricing_rules` |
| **REFERENCES** | SELECT only + FK snapshot | `booking` reads `courts.name` but snapshots price at hold time |

The boundary exists so that a change in one module (e.g. renaming a court) never breaks the data integrity of another module (e.g. a historical booking slot's price snapshot).

## Three sanctioned connection paths

### 1. Call the owning module's public Service

The preferred path for synchronous, in-process reads and writes across module boundaries.

```php
// Booking needs a price → calls PricingService (owned by court-catalog)
$price = $this->pricing->resolve($tenantId, $courtId, $startAt, $endAt);

// Payment needs to confirm a booking → calls BookingService (owned by booking)
$this->bookings->confirmDeposit($booking);

// ❌ NEVER: direct cross-module query
PricingRule::where('court_id', $courtId)->first(); // WRONG — bypasses court-catalog
```

**Rule:** the Service method is the public API of the module. If it does not exist, add it to the owning module's Service — do NOT reach into its tables.

### 2. Domain events (queued listener, afterCommit)

Asynchronous, decoupled side-effects. One module emits an event inside a `DB::transaction`; other modules listen via Horizon-queued listeners that fire after the transaction commits.

```php
// booking emits event
event(new BookingConfirmed($booking));

// notification listens (queued, afterCommit)
class BookingConfirmedListener
{
    public function handle(BookingConfirmed $event): void
    {
        $this->zalo->sendConfirmation($event->booking);
    }
}
```

**When to use:**
- Side-effects that must not block or fail the originating transaction (notifications, webhooks, audit logs).
- The emitting module does not need to know who listens.

**Registration:** listeners are auto-discovered by Laravel or registered in `EventServiceProvider`. Use `ShouldQueue` + `afterCommit` for transactional safety.

### 3. FK-snapshot (read-only, historical)

A referencing module stores a **point-in-time copy** (snapshot) of data it reads from another module. The snapshot is written once at creation time and never updated.

```php
// booking_slot stores price_snapshot from pricing_rule at hold time
BookingSlot::create([
    'court_id' => $courtId,                       // FK reference
    'price_snapshot' => $resolvedPrice,           // snapshot — never re-read live
    'start_at' => $startAt,
    'end_at' => $endAt,
]);
```

**Why snapshots matter:**
- Pricing rules change over time. Historical bookings must not be affected.
- A booking's deposit amount is the snapshot value, not the current live price.
- Refund calculations use the snapshot, never re-resolve.

## What is forbidden

| Violation | Why |
|---|---|
| `SELECT` from another module's table | Bypasses Service logic; breaks encapsulation |
| `INSERT / UPDATE / DELETE` on another module's table | Only the owning module may mutate its data |
| Reading live `pricing_rule` for an existing booking | Price must be snapshotted at creation (invariant #1) |
| `JOIN` across module-owned tables in business queries | Use Service method instead |
| Emitting events for another module's internal state changes | Only the owning module emits its own events |

## Concrete cross-module flows

### Booking → Court-Catalog (synchronous read)
```
BookingService::createHold()
    → PricingService::resolve()        // reads pricing_rules (court-catalog OWNS)
    → price_snapshot stored in booking_slot
```

### Booking → Payment (synchronous write)
```
PublicBookingController::hold()
    → BookingService::createHold()
    → PaymentService::initDeposit()    // creates payment record (payment OWNS)
```

### Payment → Booking (synchronous write)
```
ReconcileService::ingest()
    → BookingService::confirmDeposit()  // updates booking.status (booking OWNS)
```

### Booking → Notification (async event)
```
BookingService::confirmDeposit()
    → event(new BookingConfirmed($booking))
    → BookingConfirmedListener (queued)
        → ZaloService::sendConfirmation()
```

## When to use

- Adding a new module or feature that reads/writes data owned by another module.
- Reviewing whether code violates OWNS/REFERENCES boundaries.
- Deciding whether to use a Service call or a domain event for cross-module communication.
- Debugging data inconsistency caused by direct cross-module queries.

## Related docs

- `docs/05-module-map.md` — module ownership table (OWNS / REFERENCES columns)
- `docs/08-thiet-ke-module-chi-tiet.md` — module interfaces and public Service contracts
- `docs/11-diem-vo.md` — data invariants this pattern protects
