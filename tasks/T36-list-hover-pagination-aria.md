---
id: T36
title: Cross-cutting list/table style standardization
status: todo
owner: "-"
priority: P1
depends_on: []
branch: fix/list-style-standardization
scope:
  - apps/app/resources/js/Components/ui/table.jsx
  - apps/app/resources/js/Components/EmptyState.jsx
  - apps/app/resources/js/Pages/Manager/Bookings/Index.jsx
  - apps/app/resources/js/Pages/Manager/Customers/Index.jsx
  - apps/app/resources/js/Pages/Manager/Refunds/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reconcile/Unmatched.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/resources/js/Pages/Manager/Customers/Show.jsx
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
updated: 2026-08-09
---

## Goal
Standardize all list/table hover states, pagination patterns, ARIA accessibility, and empty state presentation across every manager page. Currently each page uses different hover opacities (30%/40%/50%), inconsistent pagination (prev/next vs numbered), and missing ARIA roles.

## Context / references
- Audit report from explore agent: comprehensive styling issues across 11 pages
- Current `table.jsx` has `hover:bg-muted/50` but pages override to 30%, 40%, or 50%
- Bookings has no numbered pagination while Courts does
- Most lists lack `role="list"` / `role="listitem"` or `<ul>/<li>` semantics
- Empty states are wrapped inconsistently: some in `<div className="rounded-2xl border bg-card">`, some in `<Card>`, some bare

## Acceptance criteria
- [ ] All list hover states use a single consistent opacity: `hover:bg-muted/50` (matching the base `TableRow`)
- [ ] All `<section>` or `<div>` based lists get `role="list"` on container and `role="listitem"` on items (or converted to `<ul>/<li>`)
- [ ] All empty states use the same wrapper pattern: `<Card><EmptyState ... /></Card>` — no bare `<div className="rounded-2xl border">` wrappers
- [ ] Pagination is consistent across all paginated lists: either all use numbered buttons (Courts pattern) or all use prev/next only. Prefer the numbered pattern for >3 pages.
- [ ] `npm run build` passes (Vite build via Docker or host)

## Out of scope (do NOT do here)
- Do not change the `<Table>` component's internal CSS (it's correct as-is)
- Do not restructure the Bookings card-based list into a `<Table>` — that's a separate design decision
- Do not change page layouts, only list/item presentation
- Do not touch Calendar grid (covered in T38)

## Verification (agent fills in before setting in-review)
- [ ] Vite build passes: `docker compose exec app node_modules/.bin/vite build` or host `npx vite build`
- [ ] Browser check at 1440px: hover every list row on Bookings, Customers, Refunds, Reconcile, PricingRules — opacity should be consistent
- [ ] Browser check at 390px: mobile card views render correctly, no overflow
- [ ] Check screen reader: lists announce correct number of items
- [ ] Empty states render inside Cards, not bare divs

## Log
- 2026-08-09 · created by manager — audit-driven task
