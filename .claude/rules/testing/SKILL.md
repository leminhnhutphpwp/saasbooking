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

## Browser observation and failure triage

Use Playwright as a browser observation tool, not only as an assertion runner, for changed UI flows:

```bash
mkdir -p /tmp/san-ux
```

```js
const problems = [];
page.on('console', message => {
    if (message.type() === 'error') problems.push(message.text());
});
page.on('pageerror', error => problems.push(error.message));
page.on('requestfailed', request => problems.push(`failed: ${request.url()}`));

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('/');
await page.screenshot({ path: '/tmp/san-ux/home-desktop.png', fullPage: true });
expect(problems).toEqual([]);
```

- Review changed interactions at approximately `390px` and `1440px`; include hover, pointer cursor, keyboard focus, and overflow checks where applicable.
- Save ad-hoc UX screenshots outside the repository, such as `/tmp/san-ux/`. Do not add generated screenshots to Git unless a task explicitly requires a durable fixture.
- A Playwright launch error such as a missing Chromium executable is a runner-image problem, not evidence of an application regression. Use the project's pinned Playwright Docker image (`npm run test:e2e:docker`) or its equivalent `docker run` command when the host or `vite` container has no browser binary.
- Once the browser launches, a console/page error, failed request, or reproducible interaction/assertion failure is an application or test issue and must be investigated before reporting success. Inspect Playwright's trace and error-context artifacts when available.
- For direct CDP browser review, first call `browser_list` against the DevTools endpoint (such as `http://127.0.0.1:9225`), choose the tab `target_id`, and only then navigate it to the app URL. `browser_url` is never the application's `http://localhost:8000` URL.

## When to use this skill

Reference this when:
- Writing or reviewing tests
- Building the booking engine / reconcile flow (write the concurrency test first)
- Setting up CI
