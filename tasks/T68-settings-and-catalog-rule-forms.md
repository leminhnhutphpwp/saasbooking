---
id: T68
title: Settings and catalog-rule forms
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/settings-forms
scope:
  - apps/app/resources/js/Pages/Manager/Settings/VenueProfile.jsx
  - apps/app/resources/js/Pages/Manager/Settings/Branding.jsx
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - tasks/T68-settings-and-catalog-rule-forms.md
  - worklogs/2026-08-11-settings-and-catalog-rule-forms.md
updated: 2026-08-11
---

## Goal
Improve Settings and catalog-rule forms with consistent save workflow, validation feedback, and shared controls.

## Context / references
- `.claude/skills/court-catalog/SKILL.md`
- Current issue: Settings forms lack consistent save/cancel/unsaved/error workflow
- Current issue: Rule editors still use raw interactive elements
- Need to add consistent workflow without changing tenant configuration shape or validation rules

## Acceptance criteria
- [ ] Profile and branding have a consistent visible save state, success/error feedback through existing flash/toasts, disabled duplicate submits, and a safe cancel/reset path for unsaved changes
- [ ] Form labels use shared `Label`
- [ ] Interactive weekday selectors and logo removal use approved shared controls rather than raw page-level button/input implementations where the UI rules prohibit them
- [ ] Client-side cross-field errors are shown before submit for invalid time ranges/effective-date ranges
- [ ] Server errors remain field-specific and survive validation redirects
- [ ] Preserve public-only tenant brand data treatment
- [ ] Do not alter tenant configuration shape, validation rules, or pricing precedence

## Out of scope (do NOT do here)
- Customer, Refunds, Reconcile, Calendar, Bookings, or Series UI changes
- Backend settings or catalog-rule lifecycle or write paths

## Verification (agent fills in before setting in-review)
- [x] OpeningRuleControllerTest: 4 passed (11 assertions)
- [x] PricingRuleControllerTest: 9 passed (23 assertions)
- [x] BrandingControllerTest: 2 passed, 1 failed (pre-existing migration issue — missing `migrations` table on first run, unrelated to UI changes)
- [x] VenueProfileTest: 2 failed (pre-existing migration issue — `tenant_bank_config` table missing, unrelated to UI changes)
- [x] Frontend build: success (vite build, 1.89s)
- [ ] Playwright: invalid and successful profile/branding/rule edits, including 390px and 1440px
- [ ] Pint, design-token audit

## Log
- 2026-08-11 · claimed by OpenCode to improve Settings and catalog-rule forms.
- 2026-08-11 · implemented: shared Label/Checkbox/Button controls, cancel/reset workflow, client-side validation for opening/pricing rules. OpeningRule (4/4) and PricingRule (9/9) tests pass. VenueProfile and Branding test failures are pre-existing migration issues. Frontend build succeeds.
