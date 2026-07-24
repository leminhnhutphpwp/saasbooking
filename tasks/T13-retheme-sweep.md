---
id: T13
title: v3 aesthetic sweep — remaining pages
status: claimed
owner: claude-sonnet-5
priority: P2
depends_on: [T11]
branch: feat/retheme-sweep
scope:
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - apps/app/resources/js/Pages/Manager/Courts/Index.jsx
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - apps/app/resources/js/Pages/Manager/Settings/Branding.jsx
  - apps/app/resources/js/Pages/Manager/Refunds/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reconcile/Unmatched.jsx
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
  - apps/app/resources/js/Pages/Auth/Login.jsx
updated: 2026-07-23
---

## Goal
Bring every remaining page up to the T11 violet/airy standard so the whole app is one polished product (matching the QwenCloud reference feel). Color mostly updates automatically via tokens — this task is the per-page card/spacing/chart refinement + fixing anything that still reads emerald or plain.

## Direction
- Every page wrapped in `PageContainer`; rounded-2xl cards + soft shadow + generous padding (T11 style); consistent spacing.
- **Reports**: restyle charts to the reference (soft **violet** area/bars, light gridlines, big bold totals, outlined pill filters).
- **Calendar**: booking blocks in violet/status tints (fix the pending→amber mapping nit); legible, richer blocks; clean grid.
- **Config (opening/pricing/branding)**: adopt the card style; keep the T09 improvements; ensure violet accents; branding preview matches the new public look.
- **Lists (refunds/reconcile/series/courts)**: consistent card/row/table style, `StatusBadge`, `formatVND`, quality empty states.
- **Login**: give the auth screen the violet/gradient brand treatment (not the plain Breeze look).
- Hover/active/focus states; skeletons; verify mobile + desktop.

## Acceptance criteria
- [ ] No emerald left anywhere; all pages violet/airy + consistent cards.
- [ ] Reports charts restyled violet; calendar status colors correct (incl. pending→amber).
- [ ] Login rebranded.
- [ ] No backend changes; tenant-scope + wall-as-UTC preserved; no new deps.

## Out of scope
- Shell/theme (T11), Home (T12), public booking page (already redesigned in T08 — only touch it if it still reads emerald; otherwise leave). Backend.

## Verification
- [ ] `npm run build`; `php artisan test` 108/108
- [ ] Browser ~390px + ~1440px across the listed pages; attach screenshots.

## Log
- 2026-07-23 · created by manager
- 2026-07-24 · claimed by claude-sonnet-5
