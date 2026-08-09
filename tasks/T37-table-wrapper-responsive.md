---
id: T37
title: Table wrapper & responsive fixes
status: todo
owner: "-"
priority: P1
depends_on: []
branch: fix/table-wrapper-responsive
scope:
  - apps/app/resources/js/Pages/Manager/Customers/Index.jsx
  - apps/app/resources/js/Pages/Manager/Courts/Index.jsx
  - apps/app/resources/js/Pages/Manager/Refunds/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reconcile/Unmatched.jsx
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
updated: 2026-08-09
---

## Goal
Fix table wrapper styling issues: `overflow-hidden` clipping table scroll, inconsistent border radius (`rounded-lg` vs `rounded-2xl`), missing `bg-card` background, and add mobile card fallback for the Courts table (currently desktop-only with horizontal scroll).

## Context / references
- `Customers/Index.jsx:164` — `<Card className="hidden md:block overflow-hidden">` clips the Table's `overflow-x-auto`
- `Courts/Index.jsx:403` — `<div className="rounded-lg border">` uses `rounded-lg` instead of `rounded-2xl` and has no `bg-card`
- `Refunds/Index.jsx:46` — `<Card className="overflow-hidden">` same clipping issue
- `Reconcile/Unmatched.jsx:94,138` — same `overflow-hidden` on Card
- `Series/Index.jsx:120` — same `overflow-hidden` on Card
- The `Table` component in `ui/table.jsx` wraps in `<div className="relative w-full overflow-x-auto">` which needs to not be clipped by parent `overflow-hidden`

## Acceptance criteria
- [ ] Remove `overflow-hidden` from all Card wrappers around `<Table>` components (Customers, Refunds, Reconcile, Series) — replace with `overflow-visible` or remove entirely
- [ ] Courts/Index table wrapper changed from `<div className="rounded-lg border">` to `<Card className="overflow-visible"><div className="rounded-2xl border bg-card">` or equivalent consistent pattern
- [ ] Courts/Index gets a mobile card view (like Customers/Index has) for screens < `md:` — show court name, type, status, and action buttons in a stacked card layout
- [ ] No horizontal scroll is clipped on any table page
- [ ] All table containers have consistent `rounded-2xl` border radius and `bg-card` background

## Out of scope (do NOT do here)
- Do not change table row/cell styling (covered in T36)
- Do not change Calendar grid (covered in T38)
- Do not change the `<Table>` component internals in `ui/table.jsx`

## Verification (agent fills in before setting in-review)
- [ ] Vite build passes
- [ ] Browser check at 1440px: all tables render with consistent border radius and background
- [ ] Browser check at 390px: Courts page shows card layout, not horizontal-scroll table
- [ ] Browser check: no clipped content on any table page when scrolling

## Log
- 2026-08-09 · created by manager — audit-driven task
