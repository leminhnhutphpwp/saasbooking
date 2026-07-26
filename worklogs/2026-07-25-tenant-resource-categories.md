# 2026-07-25 — Tenant-scoped resource categories foundation (T27)

## Goal

Replace the global hardcoded court-type contract with tenant-scoped resource categories while retaining the court-based racket-court implementation and preserving historical courts safely.

## Changed

### New files
- `apps/app/database/migrations/2026_07_25_100000_create_resource_categories_table.php` — tenant-owned catalog table with composite unique (tenant_id, code) and (tenant_id, slug), soft deletes, audit fields, jsonb metadata
- `apps/app/database/migrations/2026_07_25_100100_add_category_id_to_courts_table.php` — adds nullable resource_category_id FK to courts with backfill loop (find-or-create category per tenant/court_type pair)
- `apps/app/app/Models/ResourceCategory.php` — Auditable, SoftDeletes, uuid route key, forTenant/active scopes, tenant BelongsTo
- `apps/app/database/factories/ResourceCategoryFactory.php` — factory with legacyTypes() presets
- `apps/app/tests/Feature/Catalog/ResourceCategoryTest.php` — 13 feature tests

### Modified files
- `apps/app/app/Models/Court.php` — added `resourceCategory()` BelongsTo relationship
- `apps/app/app/Enums/CourtType.php` — added deprecation notice docblock

## Decisions

- **Composite FK `(tenant_id, resource_category_id)`** ensures a court cannot reference another tenant's category at the DB level
- **`court_type` column is NOT dropped** — kept as legacy compatibility data; deprecation docblock marks it deprecated until all callers migrate
- **Backfill migration uses find-or-create per (tenant_id, court_type)** — idempotent, no data loss, preserves historical courts
- **Disabled category validation is application-layer policy** — the FK allows it (tested), FormRequest/Service should reject it
- **Factory `legacyTypes()` preset** matches existing CourtType enum values for easy backfill testing

## Test results

```
PASS Tests\Feature\Catalog\ResourceCategoryTest (13 tests, 26 assertions)
✓ category creation with all fields
✓ category slug is unique within a tenant but reusable by other tenants
✓ category code is unique within a tenant
✓ court resource category must belong to the same tenant
✓ disabled category validation is documented
✓ legacy courts are backfilled to their tenants category during migration
✓ legacy court_type is preserved after backfill
✓ categories are isolated per tenant on query
✓ soft deleted category is not visible in standard query
✓ scope for tenant filters correctly
✓ scope active filters inactive categories
✓ court model has resource category relationship
✓ court without category has null relationship
```

## Commit

```
88f3e9f feat(T27): tenant-scoped resource categories foundation
```

## Next

- Mark T27 as `done` after manager review and merge to main
- Future: migrate callers from CourtType enum to ResourceCategory FK (separate tasks)
