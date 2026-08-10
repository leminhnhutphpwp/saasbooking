---
id: T49
title: Design-kit manager analytics pages
status: done
owner: "OpenCode"
priority: P1
depends_on: [T47]
branch: feat/design-kit-migration
scope:
  - apps/app/resources/js/Pages/Manager/Home/
  - apps/app/resources/js/Pages/Manager/Reports/
  - apps/app/resources/js/Pages/Manager/Customers/
  - apps/app/resources/js/Pages/Manager/Refunds/
  - apps/app/resources/js/Pages/Manager/Reconcile/
  - tasks/T49-design-kit-manager-analytics-pages.md
  - worklogs/2026-08-10-design-kit-manager-analytics-pages.md
updated: 2026-08-10
---

## Goal
Migrate Manager analytics, customer, refund, and reconciliation pages to the canonical design kit while preserving all data and actions.

## Acceptance criteria
- [x] Cards, metrics, tables, charts, and empty states follow app-ui and charts references.
- [x] No page-level literals/arbitrary design values are introduced.
- [x] Mobile tables reflow with no horizontal scroll.

## Out of scope (do NOT do here)
- Shared primitives and other Manager/public pages.

## Verification
- [x] Frontend build passes.
- [x] Relevant tests pass.
- [x] Browser checks complete or blocker recorded.

## Log
- 2026-08-10 · created after design-kit foundation migration.
- 2026-08-10 · migrated scoped analytics, customer, refund, and reconciliation page UI. Docker build and Manager tests passed; browser QA blocked by unavailable CDP endpoint at `127.0.0.1:9222`.
