---
id: T21
title: Authorization boundary security audit
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: security/authorization-boundary-audit
scope:
  - tasks/T21-authorization-boundary-audit.md
  - tasks/BOARD.md
updated: 2026-08-04
---

## Goal
Audit authorization boundaries outside RLS across booking, payments, tenant configuration, staff, courts, reports, and public signed actions. Implement the smallest verified remediation only if it does not overlap another active task's owned files.

## Context / references
- `CLAUDE.md` tenant and booking invariants
- `.claude/rules/security/SKILL.md`
- `.claude/skills/tenant-isolation/SKILL.md`

## Acceptance criteria
- [x] Verify authorization, input ownership, fillable, and signed action boundaries in the defined modules.
- [ ] Add a regression test before any remediation (blocked: the affected test/controller are owned by active T04).
- [x] Record actual focused test and Pint results.

## Out of scope (do NOT do here)
- RLS policy or runtime architecture changes.
- Broad authorization rewrites or changes to active T01-T20-owned files.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T app vendor/bin/pint --test` passes (232 files).
- [x] Focused PostgreSQL tests: `CancellationTest` and `IdentityBootstrapTenantBoundaryTest` (6 passed, 33 assertions).
- [x] `git diff --check` passes.

## Findings
- High: `PublicBookingController::hold()` derives a deterministic HMAC capability token from immutable booking/customer values. `status()` and `PublicBookingCancellationController` accept it indefinitely, so a leaked URL permanently exposes booking/customer/payment details and can cancel an eligible booking. Remediation requires expiring, purpose-bound signed URLs (or equivalent persisted, revocable capability) plus a regression test that advances time beyond expiry. Affected files are active T04 scope and were intentionally not modified.
- High defense-in-depth: `User` declares `tenant_id` fillable. Current authenticated write paths validate explicit safe fields, but any future `fill($request->validated())` with an expanded request could move a user across tenant boundaries. Remove it from fillable while retaining intentional `forceFill()` bootstrap writes. Affected model is active T20 scope and was intentionally not modified.
- No other verified authorization-boundary defect was found in manager booking, payment, tenant configuration, staff, court, or report routes. Route-bound resources are re-scoped to `WorkingTenant`, and no HTTP write surface was found for bank/Zalo credential models.

## Log
- 2026-08-04 · claimed by opencode · began targeted authorization boundary audit.
- 2026-08-04 · in review · verified T04 public capability replay and T20 user mass-assignment risks; did not alter active T01-T20-owned files as instructed.
