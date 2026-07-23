---
id: T10
title: Operational pages polish (home / calendar / reports / lists)
status: todo
owner: "-"
priority: P2
depends_on: [T07]
branch: feat/operational-polish
scope:
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - apps/app/resources/js/Pages/Manager/Courts/Index.jsx
  - apps/app/resources/js/Pages/Manager/Refunds/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reconcile/Unmatched.jsx
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
updated: 2026-07-23
---

## Goal
Bring every operational manager page to the same polished, consistent bar (container width, spacing, empty states, card style) using the T07 primitives. No feature changes — craft + consistency so the whole app feels one product.

## Design direction
- Wrap each page in `PageContainer` (consistent width; kill dead space).
- Replace any bare/placeholder empty states with `EmptyState` v2 (icon + hint + action).
- Consistent list/card/row styling across Refunds, Reconcile, Series, Courts; align columns; equal gutters; `formatVND` for money; `StatusBadge` for statuses (no ad-hoc colors).
- **Calendar (T04 follow-up)**: make booking blocks a bit richer/legible (owner said they read a touch plain) — clearer status color on the block body, readable text, good hover; keep the grid/interaction.
- **Home/Reports**: tighten spacing/hierarchy; ensure cards align on a consistent grid; skeletons where async.
- Hover/active/focus states everywhere; verify mobile.

## Acceptance criteria
- [ ] Every listed page uses `PageContainer`; consistent width + card style + spacing across all.
- [ ] All empty states use `EmptyState` v2; all statuses via `StatusBadge`; all money via `formatVND`.
- [ ] Calendar blocks more legible/richer (status-colored, readable) without changing behavior.
- [ ] No backend changes; keep tenant-scope + wall-as-UTC.

## Out of scope
- Config pages (T09), public page (T08), shared primitives (T07). No backend.

## Verification
- [ ] `npm run build` passes; `php artisan test` 108/108
- [ ] Browser at ~390px and ~1440px across the listed pages; attach a few screenshots.

## Log
- 2026-07-23 · created by manager
