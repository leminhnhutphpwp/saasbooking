---
name: booking-engine
description: How the booking core works — the single concurrency chokepoint, exclusion-constraint anti-double-book, holds, availability, recurring series
---

# Booking Engine — SÂN

`BookingService` (in `app/Services/Booking/`) is the **ONLY place that touches concurrency**. Every path that reserves a court time — single booking, recurring series, owner walk-in — goes through it in one `DB::transaction`. There is no second reservation path.

## Anti-double-book: exclusion constraint (not check-then-act)

The database is the referee, never application code:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE booking_slots ADD CONSTRAINT no_double_book
  EXCLUDE USING gist (
    tenant_id WITH =, court_id WITH =, tstzrange(start_at, end_at) WITH &&
  ) WHERE (hold_status IN ('holding','committed'));
```

`createHold()` inserts the `booking_slot`; on `SQLSTATE 23P01` (exclusion_violation) it throws `SlotTakenException` → HTTP 409. **Never** `SELECT availability then INSERT` — that races.

## The booking lifecycle — complete flow

```
User selects court + time slot
    │
    ▼
PublicBookingController::hold()
    │
    ├── Validate input (court_id, start_at, end_at)
    │
    ▼
BookingService::createHold($tenant, $params)
    │
    ├── 1. Resolve price
    │   ├── PricingService::resolve()         // court-catalog module
    │   └── Snapshots price into $slots[]['price_snapshot']
    │
    ├── 2. Create booking record
    │   ├── Booking::forceCreate([
    │   │   'status' => BookingStatus::PendingDeposit,
    │   │   │   'hold_expires_at' => now() + 10 min,
    │   │   'total_amount' => $total,
    │   │   ...
    │   │   ])
    │   │
    │   └── 3. Hold slots via driver
    │       └── driverFor($tenant)->hold($booking, $slots)
    │           │
    │           ├── ResourceTimeSlotDriver::hold()
    │           │   ├── BookingSlot::create(...) for each slot
    │           │   └── Postgres exclusion constraint catches races
    │           │       └── SQLSTATE 23P01 → SlotTakenException → HTTP 409
    │           │
    │           └── CapacitySessionDriver::hold()  (reserved door)
    │               └── UPDATE counter ≤ capacity
    │
    └── Return $booking (status=pending_deposit)
            │
            ▼
PaymentService::initDeposit($booking, $amount)
    │
    ├── Create Payment row (status=pending)
    ├── Generate VietQR payload (memo = $booking->code)
    └── Return QR to frontend
            │
            ▼
User scans QR → bank transfer
            │
            ▼
Bank webhook → ReconcileService::ingest()
    │
    ├── Match memo → booking.code
    ├── Verify amount
    │
    ├── Branch 1: pending_deposit + within hold
    │   └── BookingService::confirmDeposit($booking)
    │       ├── status → confirmed
    │       ├── driver->commit($booking)  // hold_status → committed
    │       └── event(BookingConfirmed)
    │           └── NotificationListener → send Zalo ZNS
    │
    ├── Branch 2: expired + slot still free
    │   └── Grace re-confirm (same as branch 1)
    │
    └── Branch 3: expired + slot lost
        └── markPaymentOrphaned() + create refund
```

## Holds are just a booking state

A hold = `bookings.status = 'pending_deposit'` + `hold_expires_at` (e.g. now + 10 min). No separate holds table. `ExpireStaleHolds` (scheduled every minute) flips expired holds to released; the exclusion predicate frees the slot automatically.

```php
// ExpireStaleHolds job (runs every minute)
Booking::where('status', BookingStatus::PendingDeposit)
    ->where('hold_expires_at', '<', now())
    ->each(function (Booking $booking) {
        app(BookingService::class)->release($booking);
    });
```

## The four sub-services

| Service | Responsibility |
|---|---|
| `AvailabilityService` | **Compute-on-read** for time-slot: opening_rule − blackout − held/committed slots. Never materialize a slot grid. Cache 30–60s per (court, date). |
| `BookingService` | `createHold` / `release` / `confirmDeposit` / `markPaymentOrphaned` / `cancel` / `markNoShow`. Holds the state machine (status enum). |
| `SeriesService` | Weekly recurring bookings: snapshot price/deposit onto `recurring_series`; generate occurrences within a rolling horizon (e.g. 4 weeks) through `createHold`; conflicts are reported, not silently dropped; `GenerateSeriesOccurrences` job rolls forward to `end_date`. |
| `PricingService` | Resolve peak/off-peak price at hold time; the result is **snapshotted** onto `booking_slots.price_snapshot`. |

## AvailabilityService — how slots are computed

```php
AvailabilityService::search($tenantId, $date, $courtType, $durationMin)
// Returns: array of courts with their free intervals
```

**Algorithm:**
1. Get all active courts for tenant (filtered by `court_type` if provided).
2. For each court:
   a. Get opening windows from `CatalogService::openingWindows()`.
   b. Get busy intervals from `BookingSlot` (holding/committed) + `Blackout`.
   c. Subtract busy from open → free intervals.
   d. If `durationMin` provided, cut free intervals into fixed-size slots.
3. Return array of `[{court_id, court_uuid, court_name, free: [{start, end}]}]`.

**No slot materialization** — availability is computed on demand, not stored. The exclusion constraint guarantees correctness at write time.

## SeriesService — recurring bookings

```php
SeriesService::create($tenant, $params)
// Returns: SeriesResult($series, $generatedBookings, $conflicts)
```

**Flow:**
1. Create `RecurringSeries` with price/deposit snapshotted.
2. Generate occurrences on a rolling 4-week horizon.
3. Each occurrence goes through `BookingService::createHold()` + `confirmDeposit()`.
4. Conflicts (slot taken) are collected as `$conflicts`, not silently dropped.
5. `GenerateSeriesOccurrences` job extends the horizon weekly.

## Booking status state machine

```
pending_deposit ──→ confirmed ──→ completed
      │                 │
      │ hold expires    │ cancel
      ▼                 ▼
   expired ──→ released      cancelled
      │
      │ grace re-confirm (if slot free)
      └──→ confirmed

no_show (manual, after booking time passes)
```

## Non-negotiables

- Price / deposit / cancel-policy are snapshotted at booking time — never read live `pricing_rule` for an existing booking.
- Money is `BIGINT` VND; times are `timestamptz`; recurring rules store local time + `tz`.
- Status is an enum with a defined state machine; every transition is audited.
- `BookingService` is the ONLY concurrency chokepoint. No second anti-overlap path.

## When to use

- Implementing or reviewing hold / availability / cancellation / series logic.
- Debugging double-book, stuck holds, or series generation.
- Writing the concurrency Feature test (2 parallel holds → 1 wins, 1 gets 409).
- Adding a new booking channel (e.g. walk-in, API) — must go through `BookingService::createHold()`.

## Related docs

- `docs/06-erd.md` — `bookings`, `booking_slots`, `recurring_series` + the constraint
- `docs/07-luong-du-lieu.md` — booking + availability + cancellation flows
- `docs/08-thiet-ke-module-chi-tiet.md` §3 — BookingService interface
- `docs/11-diem-vo.md` — the pitfalls this design prevents
