---
id: T08
title: Public booking page — redesign v2 (make it premium & easy)
status: todo
owner: "-"
priority: P1
depends_on: [T07]
branch: feat/public-booking-redesign
scope:
  - apps/app/resources/js/Pages/Public/Booking/Show.jsx
  - apps/app/resources/js/Pages/Public/Booking/Status.jsx
updated: 2026-07-23
---

## Goal
Owner verdict on the current public page: **"xấu quá, khó dùng"** (ugly, hard to use). It's a wall of identical slot pills with a clock icon on each — monotonous and hard to scan. This is the SALES face; redesign it to feel like a premium, effortless booking product. (Backend/data shape already correct — this is a UI/UX redesign only.)

## Context / screenshot
Current: `Screenshot 2026-07-23 ...42.38` — date strip + court cards + 4-col grid of clock+time+price pills, all looking the same; peak = faint amber. No hierarchy, no time-of-day grouping, decorative clock clutter.

## Design direction (ideas to execute — refine tastefully)
- **Hero**: venue logo + name + a subtle brand-colored band/gradient (use tenant brand color, already wired via `--brand`); one trust line ("Giữ sân 15 phút · cọc VietQR chống bom"). Make it feel branded, not a bare title.
- **Date strip**: refine — show month context, subtly mark weekends; clear selected state; horizontal scroll on mobile.
- **Court section**: a clean card per court with the court name + type chip + a small "còn N khung trống" count.
- **Slots — the key fix**: group each court's slots by **time of day** (Sáng / Chiều / Tối) with small section labels; **drop the clock icon** (noise); each chip = time (bold) + price (muted) + a small amber "Cao" tag ONLY for peak. States must be crisp: free = outline, peak = amber accent, selected = filled brand, booked = ghost/disabled (or hidden — pick one and be consistent). Denser, scannable grid; equal gutters.
- **Sticky summary → a proper booking bar/card**: court · date · time · price breakdown (giá sân, **cọc**) + big CTA. On mobile use a bottom bar/sheet with a comfortable tap target.
- **Empty / closed states**: if a court has no slots that day, a friendly inline message (not a blank card).
- **Status/QR page**: tighten to feel trustworthy — QR prominent in a card, amount + memo copyable (keep), a "đang chờ chuyển khoản…" live indicator, brand accent.
- **Micro-craft**: consistent max-width, spacing rhythm, hover/active/focus transitions, loading skeleton for availability, real mobile-first layout.

## Acceptance criteria
- [ ] Slots grouped by time-of-day, no clock-icon clutter, crisp free/peak/selected/booked states, price shown.
- [ ] Branded hero using the tenant brand color.
- [ ] Refined sticky booking summary with deposit + CTA; comfortable on mobile.
- [ ] Status/QR page polished.
- [ ] Verified at ~390px and ~1440px; controller/data untouched (read-shaping only if truly needed — but scope is the 2 JSX files); keep wall-as-UTC + existing hold flow.

## Out of scope
- No change to `PublicBookingController`/booking engine (UI only). No new deps (build with shadcn + Tailwind + the tenant `--brand` var).

## Verification
- [ ] `npm run build` passes; `php artisan test` 108/108
- [ ] Browser: full flow (pick date → grouped slots → select → sticky summary → Giữ chỗ → QR) at mobile AND desktop; attach before/after screenshots.

## Log
- 2026-07-23 · created by manager
