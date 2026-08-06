# 2026-08-05 - E2E migrator role

## Goal
Run the local E2E fixture migration and seed through the PostgreSQL owner connection while preserving the runtime RLS boundary.

## Changed
- `test:e2e:prepare` now uses `DB_CONNECTION=migrator` for both migration and `DemoSeeder`.
- E2E documentation uses the same safe commands.
- Public availability now excludes past venue wall-clock slots so the UI cannot offer a slot that hold validation rejects.

## Verification
- Migrated and seeded the existing local database without resetting data.
- `bash scripts/dev.sh test` passed: 269 tests, 1,050 assertions.
- Playwright Chromium passed: 17 tests.

## Status
In review
