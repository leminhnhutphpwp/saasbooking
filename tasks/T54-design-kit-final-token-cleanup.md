---
id: T54
title: Design-kit final token cleanup
status: done
owner: "OpenCode"
priority: P1
depends_on: [T47]
branch: feat/design-kit-migration
scope:
  - apps/app/resources/css/app.css
  - apps/app/resources/js/Pages/Public/Booking/Show.jsx
  - apps/app/tests/e2e/public-booking.spec.js
  - apps/app/tests/e2e/mobile-public-booking.spec.js
  - apps/app/tests/e2e/marketing.spec.js
  - apps/app/resources/js/Pages/Auth/RegisterService.jsx
  - apps/app/resources/js/Pages/Public/Booking/Status.jsx
  - apps/app/resources/js/Pages/Public/Booking/Show.jsx
  - apps/app/resources/js/Pages/Manager/Settings/Branding.jsx
  - apps/app/resources/js/Components/ui/select.jsx
  - tasks/T54-design-kit-final-token-cleanup.md
  - worklogs/2026-08-10-design-kit-final-token-cleanup.md
updated: 2026-08-10
---

## Goal
Eliminate every remaining static token-audit violation while retaining documented tenant-brand data exceptions.

## Acceptance criteria
- [x] No non-exempt hardcoded colors or arbitrary visual utility values remain in scoped files.
- [x] Tenant branding is retained only as explicit public booking data.
- [x] Build and relevant tests pass.

## Out of scope (do NOT do here)
- Shared foundation or unrelated page restyling.
- Backend behavior.

## Verification
- [x] Static token audit passes for scoped files.
- [x] Frontend build passes.
- [x] Relevant tests pass.
- [x] Desktop and mobile visual QA passes.

## Log
- 2026-08-10 · created after final static token scan.
- 2026-08-10 · removed the final scoped token violations; scoped audit, frontend build, and targeted feature tests pass.
- 2026-08-10 · continued same-owner QA with Docker Playwright; fixing the mobile manager rail centering transform before final verification.
- 2026-08-10 · Docker Playwright QA passed at 1440px and 390px after correcting the rail transform and public court label; stale safe-demo and court selectors were updated to match current accessible UI.
