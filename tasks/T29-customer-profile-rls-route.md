---
id: T29
title: Fix customer profile RLS route
status: in-review
owner: opencode
priority: P1
depends_on: [T28]
branch: fix/customer-routes-rls
scope:
  - apps/app/app/Http/Controllers/Manager/CustomerController.php
  - apps/app/tests/Feature/Manager/CustomerOperationsTest.php
  - tasks/BOARD.md
  - tasks/T29-customer-profile-rls-route.md
  - worklogs/2026-08-05-customer-profile-rls-route.md
updated: 2026-08-05
---

## Goal
Allow customer profile links from booking detail to resolve under the runtime RLS role without weakening tenant ownership checks.

## Context / references
`CustomerController` uses implicit `Customer` binding, which resolves before appended `ApplyRlsTenantContext` middleware. This is the same runtime ordering issue fixed for booking routes in T28.

## Acceptance criteria
- [x] Customer show and update routes resolve UUIDs after RLS tenant context is active.
- [x] Cross-tenant customer access remains forbidden.
- [x] Direct profile navigation and focused feature tests pass.

## Out of scope (do NOT do here)
- Customer data model, merging behavior, or booking history changes.

## Verification (agent fills in before setting in-review)
- [x] Focused PostgreSQL tests pass: 16 tests, 56 assertions.
- [x] Browser profile link opens without 404.

## Log
- 2026-08-05 · claimed by opencode after the customer profile link from booking detail reproduced the runtime RLS binding issue.
- 2026-08-05 · resolved customer UUIDs after RLS context for show/update routes; verified booking-detail profile navigation and moved to in-review.
