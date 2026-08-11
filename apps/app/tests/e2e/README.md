# Playwright E2E

These Chromium smoke tests run against the Docker development stack. They use only the idempotent `DemoSeeder` data and do not submit public holds, payments, or external API requests.

## Run

From `apps/app/`, install the browser once on the machine that runs Playwright:

```bash
npm run test:e2e:install
```

Prepare the local stack and demo fixture, then run the suite:

```bash
npm run test:e2e:prepare
npm run test:e2e
```

When the host does not have Node.js, as in the Docker-first development environment, run Chromium in the matching Playwright container instead. Host networking preserves the existing `localhost:8000` application origin and its `localhost:5173` Vite module origin:

```bash
docker compose up -d
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan db:seed --class=DemoSeeder --force
docker run --rm --network host -e PLAYWRIGHT_BASE_URL=http://localhost:8000 \
  -v "$PWD/apps/app":/work -w /work \
  mcr.microsoft.com/playwright:v1.62.1-noble npm run test:e2e
```

Run those commands from the repository root. On a machine with npm but without local browser dependencies, `npm run test:e2e:docker` provides the same containerized runner from `apps/app/`.

`test:e2e:prepare` starts the existing Compose services, applies migrations, and runs the idempotent `DemoSeeder`. It does not reset or truncate the database. The default target is `http://127.0.0.1:8000` and the default fixture is `pickleball-mvp` with the documented demo owner `owner@pickleball.vn` / `password`.

Use a different already-seeded target without editing tests:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 PLAYWRIGHT_TENANT=pickleball-mvp npm run test:e2e
```

For an authenticated manager smoke test against a different non-production fixture, set `PLAYWRIGHT_MANAGER_EMAIL` and `PLAYWRIGHT_MANAGER_PASSWORD`. Never supply production credentials.

Failure traces and screenshots are written to `/tmp/san-playwright-results` by default so test output does not dirty the repository. Set `PLAYWRIGHT_OUTPUT_DIR` to retain them elsewhere.

## Manager workflow tests

Three additional spec files cover authenticated Manager workflows:

| File | Workflows covered |
|---|---|
| `manager-calendar-bookings-series.spec.js` | Calendar date navigation, walk-in dialog, booked-slot detail, duration selector; Bookings filtering, quick dates, detail actions; Series end/cancel dialogs |
| `manager-courts-customers-refunds.spec.js` | Courts list, opening/pricing rules navigation, create dialog; Customers search, pagination, detail history; Refunds list, booking-code navigation, mark-done dialog; Reconcile unmatched list, manual match dialog |
| `manager-settings.spec.js` | Venue Profile form edit/cancel; Branding form, logo removal, color reset |

### Preflight

Before running Manager E2E tests, ensure:

1. **Docker stack is running**: `docker compose up -d` from the repository root.
2. **Migrations applied**: `docker compose exec -T app php artisan migrate --force`.
3. **DemoSeeder executed**: `docker compose exec -T app php artisan db:seed --class=DemoSeeder --force`. This creates the demo tenant (`pickleball-mvp`) and the demo owner (`owner@pickleball.vn` / `password`).
4. **`.env.testing` or environment variables**: the tests read `PLAYWRIGHT_MANAGER_EMAIL` and `PLAYWRIGHT_MANAGER_PASSWORD` (defaults: `owner@pickleball.vn` / `password`). Set `PLAYWRIGHT_BASE_URL` if the app is not at `http://127.0.0.1:8000`.

### Run Manager tests only

```bash
npm run test:e2e -- tests/e2e/manager-calendar-bookings-series.spec.js
npm run test:e2e -- tests/e2e/manager-courts-customers-refunds.spec.js
npm run test:e2e -- tests/e2e/manager-settings.spec.js
```

### Viewing traces and screenshots on failure

Traces and screenshots are written to `/tmp/san-playwright-results/` (or `PLAYWRIGHT_OUTPUT_DIR`). Open a trace with:

```bash
npx playwright show-trace /tmp/san-playwright-results/<test-name>/trace.zip
```

Screenshots are named after the failing test and saved as PNG in the same directory.
