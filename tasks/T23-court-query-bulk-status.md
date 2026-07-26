---
id: T23
title: Court query and bulk status API
status: done
owner: backend-agent
priority: P1
depends_on: []
branch: feat/court-query-bulk-status
scope:
  - apps/app/app/Http/Controllers/Manager/CourtController.php
  - apps/app/routes/web.php
  - apps/app/tests/Feature/Manager/CourtManagementTest.php
  - worklogs/2026-07-24-court-table-data-actions.md
updated: 2026-07-24
---

## Goal

Add tenant-safe server-side court filtering, pagination, and bulk status updates so the manager court table supports a complete high-volume workflow without trusting client tenant context or identifiers.

## Context / references

- Existing list controller: `app/Http/Controllers/Manager/CourtController.php`.
- `WorkingTenant::id($request)` is the only tenant source. All court reads/writes must remain scoped by it.
- Court list fields/labels already derive from `CourtType` and `CourtStatus` enums; do not accept labels from the client.
- The frontend task T24 depends on this task and will consume its paginated Inertia props and `PATCH /manager/courts/status` endpoint.

## Acceptance criteria

- [ ] `index` validates optional `search`, `type`, `status`, and `page` query values and scopes the query via `Court::forTenant(WorkingTenant::id($request))`.
- [ ] Name search is PostgreSQL-safe and case-insensitive; type/status are enum-validated; result order is stable; results paginate 10 per page with query string preservation.
- [ ] Inertia receives paginated court data shaped with the existing fields plus filter values/meta/links needed by T24.
- [ ] `PATCH /manager/courts/status` validates a bounded non-empty UUID list and a `CourtStatus` enum value.
- [ ] Bulk update rejects missing or cross-tenant UUIDs atomically and never applies a partial update; success returns a Vietnamese flash message.
- [ ] Feature tests cover filter tenant clamp, pagination query retention, valid bulk update, and cross-tenant rejection without database wiping.
- [ ] A worklog records actual verification results.

## Out of scope (do NOT do here)

- React/UI changes, `Courts/Index.jsx`, alert-dialog primitive, client selection state, sorting, exports, bulk deletion, dependencies, or any booking/pricing behavior.
- `tasks/BOARD.md` and any task metadata except this task’s own handoff status when available.

## Verification (agent fills in before setting in-review)

- [x] `git diff --check` passes
- [x] `php artisan test --filter=CourtManagementTest` passes against the project PostgreSQL setup — 12 passed (171 assertions)
- [x] `./vendor/bin/pint --test` passes for changed PHP files
- [x] No `migrate:fresh`, `db:wipe`, or destructive database operation used

## Log

- 2026-07-24 · created by manager
- 2026-07-25 · implemented by backend-agent — filtering, pagination, bulk status, tests
