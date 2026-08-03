---
id: T19
title: Payment ingress tenant boundary hardening
status: in-review
owner: opencode
priority: P0
depends_on: [T18]
branch: security/payment-ingress-tenant-boundary
scope:
  - apps/app/app/Http/Controllers/Webhook/BankReconcileController.php
  - apps/app/app/Services/Payment/ReconcileService.php
  - apps/app/database/migrations/2026_08_04_000000_harden_payment_ingress_tenant_boundary.php
  - apps/app/tests/Feature/Tenant/PaymentIngressTenantBoundaryTest.php
  - apps/app/tests/Feature/Payment/ReconcileTest.php
  - docs/operations/rls-runtime-deployment.md
  - worklogs/2026-08-04-payment-ingress-tenant-boundary.md
  - tasks/T19-payment-ingress-tenant-boundary.md
  - tasks/BOARD.md
updated: 2026-08-04
---

## Goal
Harden the tenant integrity and runtime-role boundary around the payment webhook ingress tables while preserving the authenticated account lookup that must run before tenant context exists.

## Context / references
- `CLAUDE.md` invariant 3
- `.claude/skills/tenant-isolation/SKILL.md`
- `.claude/skills/payment-flow/SKILL.md`
- `docs/operations/rls-runtime-deployment.md`

## Acceptance criteria
- [x] Payment ingress references cannot cross tenant boundaries at the database level.
- [x] The runtime role cannot directly mutate the context-less ingress exception outside its required path.
- [x] Runtime-role tests prove the boundary without changing webhook authentication/reconciliation semantics.

## Out of scope (do NOT do here)
- Removing the pre-authentication account-to-tenant resolution.
- Changing webhook payload authentication or reconciliation behavior.
- Altering unrelated T01-T18 work.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T app vendor/bin/pint --test` passes
- [x] Focused PostgreSQL feature tests: 17 passed, 67 assertions
- [x] `docker compose exec -T app php artisan test`: 266 passed, 1,032 assertions
- [x] `docker compose exec -T vite npm run build` passes

## Log
- 2026-08-04 · claimed by opencode
- 2026-08-04 · RLS, ingress resolver, tenant-paired constraints, regression coverage, and operational boundary documentation complete; ready for review
