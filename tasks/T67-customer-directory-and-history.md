---
id: T67
title: Customer directory and history
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/customer-directory
scope:
  - apps/app/app/Http/Controllers/Manager/CustomerController.php
  - apps/app/resources/js/Pages/Manager/Customers/Index.jsx
  - apps/app/resources/js/Pages/Manager/Customers/Show.jsx
  - apps/app/tests/Feature/Manager/CustomerOperationsTest.php
  - tasks/T67-customer-directory-and-history.md
  - worklogs/2026-08-11-customer-directory-and-history.md
updated: 2026-08-11
---

## Goal
Complete Customer directory with URL-backed search, pagination, and bounded booking history.

## Context / references
- `.claude/skills/tenant-isolation/SKILL.md`
- Current issue: Customer search bypasses pagination
- Current issue: Customer detail history has no bounded/paginated result set
- Need to add URL-backed search and pagination without changing duplicate-phone merge behavior

## Acceptance criteria
- [ ] Directory search is debounced or explicitly submitted, URL-backed, resettable, and preserves `q` when paging
- [ ] Search results paginate rather than bypassing pagination
- [ ] Index and booking-history tables use the shared table primitives and retain accessible mobile cards, numeric alignment, links, and `StatusBadge`
- [ ] Customer detail history has a bounded/paginated result set with preserved tenant isolation
- [ ] Create/edit dialogs retain entered values and field errors after validation failure
- [ ] Duplicate-phone merge behavior remains unchanged

## Out of scope (do NOT do here)
- Refunds, Reconcile, Calendar, Bookings, or Series UI changes
- Backend customer lifecycle or write paths

## Verification (agent fills in before setting in-review)
- [x] PostgreSQL feature tests for search by normalized phone/name, paginated filtered results, preserved query string, history pagination, duplicate merge, and cross-tenant access rejection — 19/19 pass
- [ ] Playwright for customer search → pagination → detail/history → create/edit validation at desktop and 390px
- [x] Build, Pint, responsive no-overflow check — `npm run build` clean, `pint --dirty` 0 files

## Log
- 2026-08-11 · claimed by OpenCode to complete Customer directory and history.
