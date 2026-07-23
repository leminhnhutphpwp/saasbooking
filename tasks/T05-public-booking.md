---
id: T05
title: Public booking page
status: done
owner: agent
priority: P1
depends_on: [T01]
branch: feat/public-booking-ux
scope:
  - apps/app/resources/js/Pages/Public/Booking/Show.jsx
  - apps/app/resources/js/Pages/Public/Booking/Status.jsx
  - apps/app/app/Http/Controllers/Public/PublicBookingController.php
updated: 2026-07-23
---

## Goal
This is the **sales face** — players book on their phones. Currently too raw: default browser date input, a wall of identical slot buttons, no price, no state. Screenshot: `screenshot-1784790403008-3.jpg`.

## Acceptance criteria
- [ ] **Mobile-first**: single-column on phones, good touch targets.
- [ ] **Hero + tenant branding**: venue name/logo + the tenant's **brand color** (from settings) applied to the accent — each venue has its own identity.
- [ ] **Date strip** (horizontal scrollable days) replaces the raw date input.
- [ ] **Slots**: show **price** + clearly distinguish **free / booked (disabled) / selected / peak**; grouped per court, tidy.
- [ ] **Sticky order summary** (court, time, price, **deposit amount**) + clear CTA; a coherent booking flow.
- [ ] **Nice Status/QR screen**: VietQR prominent, amount / transfer memo copyable, status auto-updates (keep the existing polling).
- [ ] Controller only **shapes read data** (slot price/state) — do not change the hold flow / `BookingService`; keep wall-as-UTC.
- [ ] Polished Vietnamese copy; loading skeletons + empty/sold-out states.

## Out of scope (do NOT do here)
- No change to the booking/deposit/reconcile engine. No site builder.

## Verification
- [ ] `npm run build` passes · `php artisan test` (touches PublicBookingController) stays green
- [ ] Browser desktop + mobile emulation: pick date → slots with price/state → book → QR; tenant brand color shows correctly.

## Log
- 2026-07-23 · created by manager
- 2026-07-23 · manager review: verified live end-to-end (date strip, price/peak slots, sticky summary, tenant branding, QR screen) → APPROVED, merged (#11)
