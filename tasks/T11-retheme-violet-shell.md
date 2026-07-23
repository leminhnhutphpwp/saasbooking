---
id: T11
title: Re-theme v3 (violet/indigo) + airy card & shell aesthetic
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: feat/retheme-violet
scope:
  - apps/app/resources/css/app.css
  - apps/app/tailwind.config.js
  - apps/app/resources/js/Layouts/ManagerLayout.jsx
  - apps/app/resources/js/managerNav.jsx
  - apps/app/resources/js/Components/ui/card.jsx
  - apps/app/resources/js/Components/ui/button.jsx
  - apps/app/resources/js/Components/PageContainer.jsx
  - apps/app/resources/js/Components/PageHeader.jsx
  - apps/app/resources/js/Components/StatCard.jsx
  - apps/app/resources/js/Components/AppTopbar.jsx   # new
updated: 2026-07-23
---

## Goal
Owner: current emerald look is "gớm". Re-theme the whole app to a modern **violet/indigo** palette and adopt the airy, card-based craft of the **QwenCloud reference** (attached). This is the global look — **blocking**; T12/T13 build on it.

## Reference (match this feel)
QwenCloud dashboard: light near-white background, white cards with **large radius (rounded-2xl) + subtle border + soft shadow + generous padding**, **violet/indigo accent** (gradient logo/avatar, violet progress bars & charts, violet "Hot" pill), a **light refined sidebar** (grouped sections with small uppercase labels, icons, active = soft tinted pill, collapsible groups, "Hot" badge, collapse toggle at bottom), and a **top bar** (logo/left, centered search ⌘K, right: nav/util + dark-mode toggle + gradient avatar). Big bold numbers, outlined pill action-buttons at the top-right of cards.

## Palette (convert to the HSL triplets shadcn uses; keep the variable structure)
- **Primary = violet/indigo**: primary ≈ violet-600 `#7C3AED` (or indigo `#6366F1` — pick one in that range, deep enough to read on white); primary-foreground white; ring = primary; accent = violet-50 `#F5F3FF` / accent-foreground violet-700.
- Background near-white `#FAFAFB` (slate-50); card white; foreground slate-900; muted slate-100 / muted-foreground slate-500; border slate-200.
- A subtle **brand gradient** (indigo→violet→pink) for the logo mark + avatar circle.
- Dark mode: slate-950 bg, slate-900 cards, violet-500 primary.
- `--radius`: bump to ~`1rem` (rounded-2xl cards).

## Acceptance criteria
- [ ] All color tokens switched emerald → violet/indigo (light + dark); every existing page recolors automatically via tokens (no hardcoded emerald left in shared components).
- [ ] **Cards**: rounded-2xl, subtle border + soft shadow, generous padding — consistent app-wide.
- [ ] **Sidebar (ManagerLayout + managerNav)**: light, refined — small uppercase group labels, icons, active = soft violet-tinted pill, comfortable padding, gradient logo mark, user footer, collapse toggle. (Match the reference's light, crafted sidebar — a deliberate change from the current dark navy.)
- [ ] **`AppTopbar` (new)**: a top bar with a search field (⌘K affordance, can be non-functional placeholder for now), a dark-mode toggle, and the gradient avatar/user menu; wired into ManagerLayout above the content.
- [ ] **Buttons**: pill/rounded, an outline "action" variant for card-top-right actions.
- [ ] **StatCard**: big bold number as hero + label + optional top-right pill action slot + optional mini-chart slot — matching the reference stat cards.
- [ ] Theme-aware (light+dark), responsive; do NOT restyle individual feature pages (T12/T13).

## Out of scope
- Home layout (T12), other feature pages/charts (T13), backend. No new deps (build with Tailwind + shadcn; gradients via CSS).

## Verification
- [x] `npm run build` passes
- [x] `php artisan test` 108/108 passes
- [ ] Browser ~390px + ~1440px: sidebar + topbar + a couple existing pages now violet/airy; attach screenshots.

## Log
- 2026-07-23 · created by manager
- 2026-07-23 · claimed by opencode
- 2026-07-23 · completed: palette switched emerald→violet/indigo, light refined sidebar with gradient logo, AppTopbar with search/theme toggle/avatar, cards rounded-2xl, buttons pill/rounded, StatCard with action+chart slots. Build + 108 tests pass.
