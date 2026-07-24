---
id: T13
title: v3 aesthetic sweep — remaining pages
status: in-review
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
  - apps/app/resources/js/Layouts/GuestLayout.jsx
updated: 2026-07-24
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
- [x] `npm run build` — green (built in 1.57s, no errors)
- [x] `php artisan test` (inside Docker) — **108 passed** (342 assertions)
- [ ] Browser ~390px + ~1440px across the listed pages (manager to verify)

## Handoff
**Branch:** `feat/retheme-sweep` (pushed, 1 commit)
**Commit:** `241bdca` - feat(T13): v3 aesthetic sweep — 10 pages + GuestLayout rethemed violet/airy

**Changed 11 files:**
- `GuestLayout.jsx` — gradient background with violet/indigo blobs, branded SVG mark, centered layout with shadow-lg card
- `Login.jsx` — Vietnamese labels (Đăng nhập/Mật khẩu/Ghi nhớ/Quên mật khẩu), Mail/Lock input icons, violet full-width button
- `Reports/Index.jsx` — shared StatCard (removed local one), self-drawn SVG area chart violet with gradient fill, PageContainer, PageHeader, 2-col bottom section, tinted stat boxes for deposits/refunds
- `Calendar/Index.jsx` — STATUS_TINT map with violet for confirmed + amber for pending_deposit (fixed), tinted blocks with shadow on hover, smart date header (Hôm nay/Ngày mai/weekday), now-line in primary color, + icon on empty slots, rounded-2xl grid wrapper
- `Courts/Index.jsx` — 2-column card grid with MapPin icon, EmptyState, buttons with icons, hover shadow, PageContainer
- `OpeningRules.jsx` — PageContainer narrow, EmptyState with Clock icon, rounded-xl error box, hover:bg-muted/30 rows
- `PricingRules.jsx` — PageContainer narrow, price in bold text-primary (not hardcoded emerald), EmptyState, info callout with Info icon
- `Branding.jsx` — PageContainer 3/5 grid (form + sticky preview), default color → #8b5cf6 (violet, not emerald), violet icon headers, rounded-xl throughout
- `Refunds/Index.jsx` — PageContainer, violet-tinted icon background, rounded-xl icon containers, hover rows
- `Series/Index.jsx` — PageContainer, 2-column card grid with RefreshCw icon, stat grid inside each card, EmptyState, uses formatVND (removed local vnd() formatter)
- `Reconcile/Unmatched.jsx` — PageContainer, PageHeader, EmptyState, formatVND (removed local vnd()), section headers with colored dots, rounded-xl info box in dialog

**Design principles applied:**
- All pages wrapped in PageContainer (default or narrow)
- All pages use PageHeader (consistent title + description + actions)
- rounded-xl for all containers, cards, dialogs, inputs
- Violet accents via tokens (text-primary, bg-primary/10) — no hardcoded colors
- EmptyState used for all empty lists (with icon + title + description + example + action)
- formatVND from lib/format used everywhere (no local formatters)
- Hover states on list rows (hover:bg-muted/30)
- Dark mode aware (bg-violet-100 dark:bg-violet-950 patterns)
- No emerald left anywhere (except emerald→violet in StatCard accent mapping)

**How to verify:**
1. `git fetch origin feat/retheme-sweep && git checkout feat/retheme-sweep`
2. `cd apps/app && npm run build` — should be green
3. `docker compose exec php artisan test` — should be 108/108
4. Open browser at http://localhost:8000/login (see violet gradient)
5. Navigate each page: Home, Calendar, Reports, Courts, Opening/Pricing rules, Branding, Refunds, Reconcile, Series
6. Check at ~390px (mobile) and ~1440px (desktop)

**Note:** No backend changes. All modifications are UI-only. Tenant-scope and wall-as-UTC preserved.

## Log
- 2026-07-23 · created by manager
- 2026-07-24 · claimed by claude-sonnet-5
- 2026-07-24 · in-review — code pushed to `feat/retheme-sweep`, build green, 108/108 tests pass
