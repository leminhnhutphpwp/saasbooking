# 2026-08-03 — Database Integrity Validation Preflight

## Overview
Added a read-only PostgreSQL artisan preflight for historical data covered by T09's `NOT VALID` constraints. Operators can now identify counts by tenant before manually validating the constraints.

## Files Changed
| File | Change |
|------|--------|
| `apps/app/app/Console/Commands/CheckDatabaseIntegrity.php` | Added tenant-aware integrity preflight command. |
| `apps/app/tests/Feature/CheckDatabaseIntegrityCommandTest.php` | Covered clean and simulated legacy-invalid PostgreSQL rows. |
| `docs/operations/database-integrity-validation.md` | Documented safe execution and explicit manual validation SQL. |

## Key Decisions
1. Audit every tenant, rather than resolving `WorkingTenant`, because this is a privileged deployment operation whose purpose is database-wide validation.
2. Report only constraint/trigger names, tenant ID/slug, and counts; bank account and transaction details never enter the output.
3. Treat payment immutability as a trigger-status check because current rows cannot prove whether an amount changed before the trigger was installed.

## Verification
- [x] Static/lint: `docker compose exec -T app vendor/bin/pint --dirty`
- [x] Tests: `CheckDatabaseIntegrityCommandTest` 2 tests / 8 assertions; `DatabaseIntegrityTest` 5 tests / 9 assertions
- [x] Full suite: `docker compose exec -T app php artisan test` 264 tests / 1,015 assertions
- [x] Manual check: `git diff --check`

## Handoff Notes
- Deploy T09 first, then run `docker compose exec app php artisan db:preflight-integrity`.
- Run the documented `ALTER TABLE ... VALIDATE CONSTRAINT` statements manually only after a clean report.

## Status
✅ Completed
