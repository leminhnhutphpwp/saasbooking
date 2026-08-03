---
id: T01
title: Run frontend commands in Vite service
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: fix/dev-vite-service
scope:
  - scripts/dev.sh
  - scripts/lib/docker.sh
  - apps/app/.gitignore
  - apps/app/storage/framework/cache/data/.gitignore
  - apps/app/storage/framework/sessions/.gitignore
  - apps/app/storage/framework/views/.gitignore
  - apps/app/vite.config.js
  - docker-compose.yml
  - apps/app/app/Http/Controllers/Public/PublicBookingController.php
  - apps/app/tests/Feature/Booking/PublicBookingTest.php
  - worklogs/2026-08-02-dev-setup.md
  - worklogs/README.md
updated: 2026-08-02
---

## Goal
Run frontend dependency and build commands in the Docker service that provides Node.js so the documented first-run setup completes.

## Context / references
- `scripts/README.md`
- `docker-compose.yml`

## Acceptance criteria
- [x] `bash scripts/dev.sh setup` completes its frontend dependency step.
- [x] `bash scripts/dev.sh build` runs in the Vite service.
- [x] Fresh clones include the Laravel runtime cache directories.
- [x] Development pages load Vite modules from a browser-reachable origin.
- [x] Public holds reject catalog-invalid slots without creating records.
- [x] Automatic reconciliation rejects overpayments.
- [x] Docker Desktop starts the complete development stack with shared source mounts.

## Out of scope (do NOT do here)
- Changes to the application runtime topology.
- Production deployment configuration.

## Verification (agent fills in before setting in-review)
- [x] `npm run build` passes in the Vite container.
- [x] Setup script completes migrations.
- [x] `php artisan test`: 230 passed.

## Log
- 2026-08-02 · claimed by opencode after setup exposed that `app` has no Node.js runtime.
- 2026-08-02 · ready for review; runtime setup, demo seed, build, migrations and HTTP checks pass.
- 2026-08-02 · resumed after browser testing identified an invalid `0.0.0.0` Vite hot-file origin.
- 2026-08-02 · Vite hot file now uses `http://localhost:5173`; HMR client and public booking modules return HTTP 200 with a localhost origin.
- 2026-08-02 · expanded for the first P0 booking safety slice: server-side public slot admissibility without a second overlap check.
- 2026-08-02 · added exact-amount reconciliation as an independent P0 invariant.
- 2026-08-03 · Docker Desktop file sharing repaired; setup, full test suite, Pint and frontend build pass.
