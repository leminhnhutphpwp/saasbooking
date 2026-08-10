---
id: T43
title: Manager court and settings conformance
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/manager-design-conformance
scope:
  - apps/app/resources/js/Pages/Manager/Courts/Index.jsx
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - apps/app/resources/js/Pages/Manager/Settings/Branding.jsx
  - apps/app/resources/js/Pages/Manager/Settings/VenueProfile.jsx
  - tasks/T43-manager-court-settings-conformance.md
  - worklogs/2026-08-10-manager-court-settings-conformance.md
updated: 2026-08-10
---

## Goal
Bring court configuration and venue settings screens into full DESIGN.md conformance while preserving form and pricing behavior.

## Acceptance criteria
- [x] Forms and toggles are labelled, keyboard accessible, and stateful without color-only cues.
- [x] No page-level card, grid, or mobile-table violations remain.
- [x] Tenant public-brand color remains confined to the booking preview.

## Out of scope (do NOT do here)
- Shared primitives and CSS tokens owned by T44.
- Booking/calendar and customer/finance pages.

## Verification
- [x] Frontend build passes.
- [x] Relevant tests pass.
- [ ] Browser check records desktop and mobile results.

## Log
- 2026-08-10 · created and claimed after DESIGN.md discovery audit.
- 2026-08-10 · frontend build and 30 scoped feature tests pass; browser QA could not run because no Chrome DevTools endpoint is listening at `127.0.0.1:9222`.
