---
name: testing
description: Testing guidelines for SÂN — PHPUnit/Pest feature tests on real PostgreSQL + Playwright
metadata:
  scope: global
  type: rules
---

# Testing Guidelines

## Framework

- **PHPUnit / Pest** feature tests, run against a **real PostgreSQL** (the anti-double-book guarantee is a Postgres exclusion constraint — SQLite cannot test it).
- **Playwright** for the end-to-end booking flow.

## Must-have tests (write these first)

1. **Concurrency / exclusion constraint** — fire two parallel `createHold` requests for the same court + time; assert exactly one succeeds and the other gets a `409` (SQLSTATE `23P01` → `SlotTakenException`). This is the single most important test.
2. **Reconcile idempotency** — deliver the same bank webhook twice; assert the deposit is confirmed exactly once and counters are not double-applied (`unique(bank_txn_id)`).
3. **Three reconcile branches** — within hold → confirm; expired but slot free → grace re-confirm; slot lost → orphaned + auto refund.
4. **Series** — generate a weekly series; cancel one occurrence and assert the series stays active and the others are untouched.

## Structure

```php
it('rejects a second hold on the same court slot', function () {
    // arrange a court + slot
    // act: two concurrent createHold calls
    // assert: 1 booking created, 1 SlotTakenException / 409
});
```

- Use factories for test data; test happy path AND edge cases (see `docs/10`).
- Keep tests independent; run in CI.

## 🔴 NEVER clear the database during testing

- `migrate:fresh`, `db:wipe`, and manual bulk `DELETE` are **forbidden** unless the user explicitly asks. Seed/demo data is real test material.
- Only `db:seed --class=SpecificSeeder` when adding NEW seed data.

## Running tests (inside Docker)

```bash
docker compose exec app php artisan test
docker compose exec app php artisan test --filter=BookingConcurrencyTest
```

## When to use this skill

Reference this when:
- Writing or reviewing tests
- Building the booking engine / reconcile flow (write the concurrency test first)
- Setting up CI
