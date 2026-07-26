# Platform hardening

## Goal
Apply verified findings from the parallel backend, frontend, schema, config, and documentation audit without adopting speculative changes.

## Changed
- Serialized customer-code allocation and restored UUID/code model events for service-created customers.
- Made manager cash payment confirmation atomic and routed lifecycle changes through owning services/Eloquent.
- Added tenant composite foreign keys and tenant-scoped reminder deduplication.
- Stabilized form validation, translated profile forms, and hardened public booking interactions.
- Aligned PostgreSQL/session defaults, Zalo env documentation, security headers, ERD, and module docs.

## Decisions
- Kept globally unique booking/template notification idempotency unchanged.
- Did not add `SoftDeletes` without schema and retention policy.
- Did not delete the root welcome page or replace working dialog/dropdown systems during hardening.

## Verification
- `vendor/bin/pint --test`: passed.
- `npm run build`: passed (2,655 modules).
- `php artisan test`: 224 passed, 748 assertions on PostgreSQL.
- Markdown relative-link audit and `git diff --check`: passed.

## Next
- Browser QA remains for service registration, tenant switching, pricing scope, and mobile public booking.
