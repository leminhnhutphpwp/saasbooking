---
id: T38
title: Calendar grid visual polish
status: todo
owner: "-"
priority: P1
depends_on: []
branch: fix/calendar-grid-polish
scope:
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
updated: 2026-08-09
---

## Goal
Fix the calendar grid's visual issues: sticky elements without shadows, invisible touch targets on mobile, low-contrast alternating rows, and missing status color on mobile timeline.

## Context / references
- `Calendar/Index.jsx:312` — sticky time column has no `border-r` or shadow, blends into court columns on horizontal scroll
- `Calendar/Index.jsx:318` — sticky court headers have no shadow, blends into content on vertical scroll
- `Calendar/Index.jsx:347` — alternating row backgrounds use `bg-muted/[0.03]` which is nearly invisible
- `Calendar/Index.jsx:417` — empty slot "Đặt hộ" buttons have `opacity-0` by default, invisible and untappable on touch devices
- `Calendar/Index.jsx:273-274` — mobile timeline uses flat list without status color indicators (desktop has `border-l-[3px]` colored stripes)

## Acceptance criteria
- [ ] Sticky time column gets `border-r border-border shadow-[2px_0_8px_-2px_rgba(0,0,0,0.08)]` or equivalent to separate from court columns
- [ ] Sticky court headers get `shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]` to separate from scrolling content below
- [ ] Alternating row backgrounds increased to `bg-muted/[0.06]` or `bg-muted/50` for visible contrast
- [ ] Empty slot click targets always visible: remove `opacity-0`, use a subtle dashed border or `bg-primary/5` instead so touch users can discover them
- [ ] Mobile timeline items get a left border color stripe matching the booking status (same as desktop: green=confirmed, amber=pending, etc.)
- [ ] No z-index conflicts between booking blocks and empty slot buttons

## Out of scope (do NOT do here)
- Do not change booking block content/layout
- Do not change the mobile vs desktop view switching logic
- Do not touch other pages

## Verification (agent fills in before setting in-review)
- [ ] Vite build passes
- [ ] Browser check at 1440px: scroll the calendar grid — sticky elements should have visible shadows separating them from content
- [ ] Browser check at 1440px: alternating rows should be clearly distinguishable
- [ ] Browser check at 390px: empty slot buttons should be visible without hover
- [ ] Browser check at 390px: mobile timeline items should show status color stripe on left

## Log
- 2026-08-09 · created by manager — audit-driven task
