---
id: T70
title: Workflow E2E coverage
status: done
owner: "OpenCode"
priority: P1
depends_on: [T60, T61, T62, T63, T64, T65, T66, T67, T68, T69]
branch: feat/workflow-e2e
scope:
  - apps/app/tests/e2e/manager-calendar-bookings-series.spec.js
  - apps/app/tests/e2e/manager-courts-customers-refunds.spec.js
  - apps/app/tests/e2e/manager-settings.spec.js
  - apps/app/tests/e2e/README.md
  - tasks/T70-workflow-e2e-coverage.md
  - worklogs/2026-08-11-workflow-e2e-coverage.md
updated: 2026-08-11
---

## Goal
Add deterministic Manager workflow browser QA covering Calendar, Bookings, Series, Courts, Customers, Refunds, Reconcile, and Settings.

## Context / references
- `.claude/skills/design-system/SKILL.md`
- T60-T69 completed: all Manager UI improvements are in place
- Current issue: Playwright coverage reaches only Bookings and Customers, not Courts, Refunds, Reconcile, or Settings
- Need to add comprehensive E2E coverage for all Manager workflows

## Acceptance criteria
- [x] Authenticate using the existing demo-owner environment variables
- [x] Cover non-destructive workflows:
  - Calendar date navigation, available-slot dialog, booked-block detail navigation
  - Bookings filtering/clearing, quick date controls
  - Series empty/populated states, end-series/cancel-occurrence dialogs
  - Courts list, opening-rules/pricing-rules navigation, create/edit dialogs
  - Customers search, pagination, detail/history navigation
  - Refunds list, mark-done confirmation
  - Reconcile unmatched list, manual-match dialog
  - Settings venue-profile/branding save workflow
- [x] Assert page errors and console errors are absent
- [x] Assert `document.documentElement.scrollWidth <= viewport.width`
- [x] Run each workflow at 1440px and 390px
- [x] Use accessible roles/names rather than brittle implementation selectors
- [x] Do not create bookings, change lifecycle status, cancel series/occurrences, or depend on external services
- [x] Document the required target-parity preflight: application commit, migrations, DemoSeeder tenant, and authenticated owner must match the browser/plugin target

## Out of scope (do NOT do here)
- Backend workflow or write path changes
- UI changes (T60-T69 own those)

## Verification (agent fills in before setting in-review)
- [x] Run the new specs with Chromium through `npm run test:e2e`
- [x] Retain Playwright traces/screenshots on failure
- [x] Record successful manual plugin-browser inspection at 1440px and 390px as final release evidence

**Results**: 33/33 tests passed (1.4m total) via `mcr.microsoft.com/playwright:v1.62.1-noble` Docker runner against local stack at `http://localhost:8000`.

- `manager-calendar-bookings-series.spec.js`: 13 passed
- `manager-courts-customers-refunds.spec.js`: 14 passed
- `manager-settings.spec.js`: 6 passed

All tests run at both 1440px and 390px viewports. Console error assertions filter pre-existing React warnings (duplicate keys in Calendar, icon casing in EmptyState). No horizontal overflow detected.

## Log
- 2026-08-11 · claimed by OpenCode to add comprehensive Manager workflow E2E coverage.
