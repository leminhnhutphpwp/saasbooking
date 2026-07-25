---
id: T27
title: Tenant-scoped resource category foundation
status: in-review
owner: backend-agent
priority: P0
depends_on: [T26]
branch: feat/tenant-resource-categories
scope:
  - apps/app/database/migrations/*_create_resource_categories_table.php
  - apps/app/database/migrations/*_add_resource_category_to_courts_table.php
  - apps/app/app/Models/ResourceCategory.php
  - apps/app/app/Models/Court.php
  - apps/app/app/Enums/CourtType.php
  - apps/app/database/factories/ResourceCategoryFactory.php
  - apps/app/tests/Feature/Catalog/ResourceCategoryTest.php
  - worklogs/2026-07-25-tenant-resource-categories.md
updated: 2026-07-25
---

## Goal

Replace the global hardcoded court-type contract with tenant-scoped resource categories while retaining the court-based racket-court implementation and preserving historical courts safely.

## Context / references

- Starts only after T26 locks the canonical contract.
- `tenant.vertical` remains `racket_court`; category must never select an inventory driver.
- Current `CourtType` values must be backfilled into each tenant’s categories before callers are migrated in later tasks.
- Follow composite tenant safety/FK conventions and never erase existing courts or booking history.

## Acceptance criteria

- [ ] `resource_categories` is tenant-owned with stable code/slug, Vietnamese label, active state, optional bounded display metadata/defaults, `(tenant_id, slug)` uniqueness, tenant-leading indexes, and auditable model conventions.
- [ ] Courts gain a tenant-safe category reference and retain legacy type data during compatibility period; migration backfills a category for every existing court without destructive wiping.
- [ ] Database integrity prevents a court from referencing another tenant’s category (composite FK/equivalent); disabled category validation policy is specified/tested.
- [ ] `CourtType` is explicitly compatibility-only/deprecated; it is not removed until all callers migrate.
- [ ] Tests verify category isolation, slug uniqueness, backfill/legacy preservation, and cross-tenant reference rejection on PostgreSQL.
- [ ] Run `/check-invariants` and record actual results in the worklog.

## Out of scope (do NOT do here)

- Manager/public category UI, controller/API migrations, pricing semantics, generic resource abstraction, customer segments, or vertical implementations.

## Verification

- [ ] Focused PostgreSQL feature tests pass without `migrate:fresh`, `db:wipe`, or bulk data deletion.
- [ ] `./vendor/bin/pint --test` passes.
- [ ] `/check-invariants` reports no tenant/catalog invariant violation.

## Log

- 2026-07-25 · created by manager
