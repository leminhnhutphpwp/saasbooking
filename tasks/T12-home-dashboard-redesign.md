---
id: T12
title: Home dashboard redesign (QwenCloud-style)
status: claimed
owner: claude-sonnet-5
priority: P1
depends_on: [T11]
branch: feat/home-dashboard-redesign
scope:
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/resources/js/Components/QuickLinks.jsx   # new
  - apps/app/app/Http/Controllers/Manager/HomeController.php   # add 7-day revenue series (read-only, tenant-scoped)
updated: 2026-07-24
---

## Goal
Redesign the manager Home to the airy, card-based layout of the **QwenCloud reference** — the polished dashboard feel the owner wants. Reuse the violet theme + primitives from T11. Same data as today (from `HomeController`), just a far better composition.

## Reference layout to adapt (SÂN content, not Qwen's)
1. **Welcome hero**: big "Chào <tên chủ sân> 👋 · <tên sân>" heading with a light subtitle (today's date).
2. **Quick-link icon row** (`QuickLinks.jsx`, new): a card containing a row of icon links — Lịch đặt sân · Đặt hộ · Hoàn cọc · Đối soát · Báo cáo · Cấu hình — like Qwen's API Keys/Models/Docs row (icon on top, label under, hover states).
3. **3-column stat/insight cards** (like Special Offer / Recent Spend / PAYG Usage), each a rounded-2xl card with a **top-right outlined pill action**:
   - **Hôm nay**: big numbers (đặt sân / đã xác nhận / chờ cọc) + a slim progress or occupancy bar → action "Xem lịch".
   - **Doanh thu 7 ngày**: big số tiền + a soft **area chart** (violet, self-drawn SVG) → action "Xem báo cáo".
   - **Cọc & hoàn**: cọc đã thu / hoàn chờ xử lý big numbers + mini bar → action "Đối soát".
4. **Needs-attention / Sắp tới** below: the awaiting-deposits / refunds / unmatched lists + upcoming bookings, in clean cards with `StatusBadge`.
5. Generous whitespace, big bold numbers, `formatVND`, hover/transitions, skeletons, responsive (stack on mobile).

## Acceptance criteria
- [ ] Welcome hero + quick-link icon row (new `QuickLinks`) + 3 insight cards with big numbers, a self-drawn violet chart, and top-right pill actions.
- [ ] Needs-attention + upcoming sections retained (cross-links still work).
- [ ] Uses T11 primitives (Card, StatCard, PageContainer, violet tokens); no hardcoded colors; no new deps (charts = SVG/CSS).
- [ ] Data unchanged (read from existing HomeController props); tenant-scoped.

## Out of scope
- Shell/theme (T11), other pages (T13), backend/controller changes.

## Verification
- [ ] `npm run build`; `php artisan test` 108/108
- [ ] Browser ~390px + ~1440px: home matches the airy reference feel; attach before/after.

## Log
- 2026-07-23 · created by manager
- 2026-07-24 · claimed by claude-sonnet-5; extending scope with 7-day revenue series query in HomeController (read-only, tenant-scoped) so the revenue card has a real chart
