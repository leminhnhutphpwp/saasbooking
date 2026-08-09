---
id: T39
title: Per-page list & card layout fixes
status: todo
owner: "-"
priority: P1
depends_on: []
branch: fix/perpage-list-layout
scope:
  - apps/app/resources/js/Pages/Manager/Bookings/Index.jsx
  - apps/app/resources/js/Pages/Manager/Customers/Show.jsx
  - apps/app/resources/js/Pages/Manager/Refunds/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reconcile/Unmatched.jsx
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
updated: 2026-08-09
---

## Goal
Fix individual page list/card layout issues: inconsistent border opacity, nested card-in-card visuals, raw date formatting, hardcoded color classes, compressed JSX, and mobile button layout problems.

## Context / references
- `Bookings/Index.jsx:107` — price separator uses `border-border/70` (opacity variant) while card uses full opacity `border-border`
- `Customers/Show.jsx:103` — booking items have `rounded-xl border p-4` inside a Card that already has `rounded-2xl border` — double border visual
- `Series/Index.jsx:157` — raw date strings `{s.start_date} → {s.end_date}` not formatted with `formatDate()`
- `Home/Index.jsx:111-115` — court status grid uses hardcoded `border-emerald-200 bg-emerald-50` instead of CSS variable semantic colors
- `Home/Index.jsx:134` — entire upcoming bookings + pending actions section compressed into a single ~1000 char line
- `Reports/Index.jsx:196-202` — custom empty state div instead of using `EmptyState` component
- `Reports/Index.jsx:135` — CardContent padding override `p-4` inconsistent with other pages
- `Reconcile/Unmatched.jsx:112-118` — "Đối soát" and "Bỏ qua" buttons equal width on mobile, primary action not visually emphasized
- `PricingRules.jsx:210` — hover 30% opacity (will be fixed by T36, but verify)
- `OpeningRules.jsx:187` — hardcoded `4.5rem` column width may be too narrow on <360px screens

## Acceptance criteria
- [ ] All border opacities normalized: remove `/70` opacity variants, use standard `border-border`
- [ ] Customers/Show booking history items: remove nested border, use `hover:bg-muted/50` rounded background only (no `border` on individual items inside a Card)
- [ ] Series dates formatted with `formatDate()` from `@/lib/format`
- [ ] Home court status grid: replace hardcoded emerald colors with semantic CSS variable classes or Tailwind's `bg-primary/10 text-primary` pattern
- [ ] Home/Index.jsx:134: break compressed JSX into readable multi-line format
- [ ] Reports empty state: use `<Card><EmptyState .../></Card>` instead of custom div
- [ ] Reconcile mobile buttons: primary action "Đối soát" full-width, secondary "Bỏ qua" smaller/ghost below it (stacked layout on mobile)
- [ ] OpeningRules: reduce column width to `3.5rem` on smallest screens or use `min-w-[3.5rem]` with truncation

## Out of scope (do NOT do here)
- Do not change hover opacity (covered in T36)
- Do not change table wrappers (covered in T37)
- Do not change Calendar grid (covered in T38)
- Do not change page-level layouts or navigation

## Verification (agent fills in before setting in-review)
- [ ] Vite build passes
- [ ] Browser check at 1440px: all pages render with consistent borders and no double-border visuals
- [ ] Browser check at 390px: Reconcile buttons stack vertically, OpeningRules day names don't overflow
- [ ] Series page: dates show formatted like "01/07/2026" not raw ISO strings
- [ ] Home page: court status cards use theme colors, not hardcoded emerald

## Log
- 2026-08-09 · created by manager — audit-driven task
