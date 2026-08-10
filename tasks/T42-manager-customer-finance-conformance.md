---
id: T42
title: Manager customer and finance conformance
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/manager-design-conformance
scope:
  - apps/app/resources/js/Pages/Manager/Customers/Index.jsx
  - apps/app/resources/js/Pages/Manager/Customers/Show.jsx
  - apps/app/resources/js/Pages/Manager/Refunds/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reconcile/Unmatched.jsx
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - tasks/T42-manager-customer-finance-conformance.md
  - worklogs/2026-08-10-manager-customer-finance-conformance.md
updated: 2026-08-10
---

## Goal
Bring customer, finance, home, and reports screens into full DESIGN.md conformance while preserving real data and tenant-scoped behavior.

## Acceptance criteria
- [x] Lists/tables are semantic, responsive, and correctly align numeric data.
- [x] Home and reports charts meet the DESIGN.md chart and accessibility contract.
- [x] No overflow, nested interactions, or nonconforming card accents remain.

## Out of scope (do NOT do here)
- Shared primitives and CSS tokens owned by T44.
- Booking/calendar, court, and settings pages.

## Verification
- [x] Frontend build passes.
- [x] Relevant tests pass.
- [ ] Browser check records desktop and mobile results.

## Log
- 2026-08-10 · created and claimed after DESIGN.md discovery audit.
- 2026-08-10 · converted customer, refund, reconcile, and customer-history records to semantic responsive tables; corrected chart and Home interaction conformance.
- 2026-08-10 · Docker Vite build and 28 relevant PostgreSQL feature tests passed. Browser QA could not run because no Chrome DevTools Protocol endpoint is available at `127.0.0.1:9222` or `localhost:9222`.
