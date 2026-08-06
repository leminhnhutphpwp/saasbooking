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
docker compose exec -T -e DB_CONNECTION=migrator app php artisan migrate --database=migrator --force
docker compose exec -T -e DB_CONNECTION=migrator app php artisan db:seed --class=DemoSeeder --force
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
