---
id: T20
title: Harden identity bootstrap tenant boundary
status: in-review
owner: opencode
priority: P0
depends_on: [T18, T19]
branch: security/identity-bootstrap-tenant-boundary
scope:
  - apps/app/app/Support/WorkingTenant.php
  - apps/app/app/Http/Middleware/ResolveWorkingTenant.php
  - apps/app/app/Models/User.php
  - apps/app/app/Models/Membership.php
  - apps/app/app/Http/Controllers/Auth/...
  - apps/app/database/migrations/2026_08_04_010000_keep_primary_tenant_membership_in_sync.php
  - apps/app/tests/Feature/Tenant/IdentityBootstrapTenantBoundaryTest.php
  - docs/operations/identity-bootstrap-tenant-boundary.md
  - docs/operations/rls-runtime-deployment.md
  - worklogs/2026-08-04-identity-bootstrap-tenant-boundary.md
  - tasks/BOARD.md
  - tasks/T20-identity-bootstrap-tenant-boundary.md
updated: 2026-08-04
---

## Goal
Harden server-side tenant selection at the identity/bootstrap boundary without applying RLS where membership lookup is needed to establish tenant context.

## Context / references
`CLAUDE.md` invariant 3; `.claude/skills/tenant-isolation`; T18 RLS deployment and T19 payment-ingress boundary.

## Acceptance criteria
- [x] Tenant context is selected only from an authenticated user's active membership, legacy primary tenant, or operator-authorized tenant.
- [x] Disabled/deleted tenants and memberships cannot establish or retain a working tenant.
- [x] Focused regressions cover tenant-switching and forged tenant identifiers.
- [x] Identity/bootstrap RLS exceptions are documented with their application boundary.

## Out of scope (do NOT do here)
- Applying RLS to identity/bootstrap tables before tenant context exists.
- Changing public authentication or manager route contracts.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T app vendor/bin/pint --test` passes
- [x] Focused PostgreSQL feature tests: 7 passed, 10 assertions
- [x] Full PostgreSQL test suite: 268 passed, 1,037 assertions

## Log
- 2026-08-04 · created and claimed by opencode
- 2026-08-04 · primary-membership revoke trigger, regression coverage, and RLS exception documentation complete; ready for review
