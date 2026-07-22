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

## Holds are just a booking state

A hold = `bookings.status = 'pending_deposit'` + `hold_expires_at` (e.g. now + 10 min). No separate holds table. `ExpireStaleHolds` (scheduled every minute) flips expired holds to released; the exclusion predicate frees the slot automatically.

## The four sub-services

| Service | Responsibility |
|---|---|
| `AvailabilityService` | **Compute-on-read** for time-slot: opening_rule − blackout − held/committed slots. Never materialize a slot grid. Cache 30–60s per (court, date). |
| `BookingService` | `createHold` / `release` / `confirmDeposit` / `markPaymentOrphaned` / `cancel` / `markNoShow`. Holds the state machine (status enum). |
| `SeriesService` | Weekly recurring bookings: snapshot price/deposit onto `recurring_series`; generate occurrences within a rolling horizon (e.g. 4 weeks) through `createHold`; conflicts are reported, not silently dropped; `GenerateSeriesOccurrences` job rolls forward to `end_date`. |
| `PricingService` | Resolve peak/off-peak price at hold time; the result is **snapshotted** onto `booking_slots.price_snapshot`. |

## Non-negotiables

- Price / deposit / cancel-policy are snapshotted at booking time — never read live `pricing_rule` for an existing booking.
- Money is `BIGINT` VND; times are `timestamptz`; recurring rules store local time + `tz`.
- Status is an enum with a defined state machine; every transition is audited.

## When to use

- Implementing or reviewing hold / availability / cancellation / series logic.
- Debugging double-book, stuck holds, or series generation.
- Writing the concurrency Feature test (2 parallel holds → 1 wins, 1 gets 409).

## Related docs

- `docs/06-erd.md` — `bookings`, `booking_slots`, `recurring_series` + the constraint
- `docs/07-luong-du-lieu.md` — booking + availability + cancellation flows
- `docs/08-thiet-ke-module-chi-tiet.md` §3 — BookingService interface
- `docs/11-diem-vo.md` — the pitfalls this design prevents
