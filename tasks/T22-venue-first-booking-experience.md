---
id: T22
title: Venue-first booking and payment experience
status: in-review
owner: opencode
priority: P1
depends_on: [T02, T06, T12]
branch: test/playwright-e2e
scope:
  - apps/app/resources/js/Pages/Public/Booking/Show.jsx
  - apps/app/resources/js/Pages/Public/Booking/Status.jsx
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/tests/e2e/
  - docker-compose.yml
  - tasks/BOARD.md
  - worklogs/
updated: 2026-08-05
---

## Goal
Make the public booking and payment flow read as a real venue operation rather than a generic collection of cards. Improve the manager's at-a-glance daily operation view without changing booking or reconciliation logic.

## Acceptance criteria
- [x] Public booking prioritizes venue, date, court availability, and a clear selected-slot summary.
- [x] Payment screen presents an actual VietQR as the primary action with exact transfer details and live hold state.
- [x] Manager home surfaces actionable daily work with less dashboard decoration.
- [x] Browser checks cover key public flows at mobile and desktop widths.

## Out of scope
- Payment provider or reconciliation changes.
- Generated binary visual assets or external CDNs.

## Log
- 2026-08-05 · claimed following product UX review.
- 2026-08-05 · verified and moved to in-review.
