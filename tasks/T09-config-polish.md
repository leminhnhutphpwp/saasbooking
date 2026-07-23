---
id: T09
title: Config screens polish (pricing / opening / branding)
status: done
owner: agent
priority: P1
depends_on: [T07]
branch: feat/config-polish
scope:
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - apps/app/resources/js/Pages/Manager/Settings/Branding.jsx
updated: 2026-07-23
---

## Goal
Owner feedback (screenshots): pricing page = a lonely empty card on a full-bleed white expanse; branding = stacked cards with dead space on the right, no clear Save. Apply the T07 container/empty-state and give these config screens real craft. Functionality already works — polish only.

## Design direction
- **All three**: wrap in `PageContainer` (constrained width — no full-bleed dead space); consistent card headers (icon + title) + padding; add a **breadcrumb/back link** on court sub-pages ("← Danh sách sân" / court name); ensure a clear, visible **Save** affordance where relevant + a success toast.
- **PricingRules**: rich empty state (icon + hint + example: "VD: 6–17h thường 100.000đ, 17–22h giờ vàng 130.000đ" + primary "Thêm giá"); when rules exist, a tidy table/rows with tier badges (Thường/Giờ vàng/Cuối tuần) + `formatVND` + priority note; avoid stretched full-width rows.
- **OpeningRules**: weekly view already decent — tighten spacing, consistent rule cards, good empty state, clearer add/edit affordance; consider a compact weekday chip row.
- **Branding**: switch to a **2-column layout on desktop** (form controls left, the live public-page preview right) so there's no empty right side; keep uploader (SVG blocked) + color picker + public URL copy; make Save obvious; tidy card rhythm. On mobile it stacks.

## Acceptance criteria
- [ ] All three use `PageContainer`; no full-bleed dead space; consistent cards.
- [ ] Pricing: quality empty state with example + tidy rows/table when populated (tier badges + formatVND).
- [ ] Branding: 2-col (form + live preview) on desktop, stacked on mobile; clear Save.
- [ ] Breadcrumb/back on court sub-pages; toast on save.
- [ ] Keep all existing behavior/validation/tenant-scope; no backend changes, no loosening the mass-assignment guard, SVG stays blocked.

## Out of scope
- Controllers/backend (UI only). No new deps.

## Verification
- [ ] `npm run build` passes; `php artisan test` 108/108
- [ ] Browser at ~390px and ~1440px: pricing (empty + with a rule), opening, branding (2-col) — attach screenshots.

## Log
- 2026-07-23 · created by manager
