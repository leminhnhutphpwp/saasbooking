---
id: T35
title: Smart pricing rules
status: done
owner: opencode
priority: P1
depends_on: []
branch: feat/smart-pricing-rules
scope:
  - apps/app/app/Http/Controllers/Manager/CalendarController.php
  - apps/app/app/Http/Controllers/Manager/PricingRuleController.php
  - apps/app/app/Http/Controllers/Manager/VenueController.php
  - apps/app/app/Http/Controllers/Manager/VenuePricingController.php
  - apps/app/app/Services/Catalog/PricingRuleService.php
  - apps/app/app/Services/Catalog/PricingService.php
  - apps/app/app/Services/Tenant/VenueSettingsService.php
  - apps/app/app/Services/VenueReadinessService.php
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Settings/VenueProfile.jsx
  - apps/app/routes/web.php
  - apps/app/tests/Feature/Catalog/PricingRuleControllerTest.php
  - apps/app/tests/Feature/Catalog/PricingServiceTest.php
  - apps/app/tests/Feature/Manager/CalendarTest.php
  - apps/app/tests/Feature/Venue/VenueProfileTest.php
  - apps/app/tests/Feature/Venue/VenueReadinessTest.php
  - worklogs/2026-07-26-smart-pricing-rules.md
updated: 2026-07-26
---

## Goal
Reduce repetitive court pricing setup while preserving deterministic resolution and booking price snapshots.

## Context / references
- `docs/06-erd.md`: nullable `court_id` is the venue-wide pricing door.
- `docs/08-thiet-ke-module-chi-tiet.md`: PricingService is the catalog module API.
- `docs/11-diem-vo.md`: money is integer VND and booking prices are snapshots.

## Acceptance criteria
- [x] Managers can manage venue-wide pricing rules from the existing court pricing screen.
- [x] Resolution precedence is court-specific, then venue-wide, then tenant default price.
- [x] Invalid and same-scope overlapping time windows are rejected.
- [x] Venue settings can persist a default hourly price.
- [x] Manager calendar exposes resolved prices for empty slots without bypassing PricingService.
- [x] Relevant tests and frontend build pass.
- [x] Opening-rules page uses the standard container with a distinct weekly timeline layout.

## Out of scope (do NOT do here)
- Split-tier pricing within one slot.
- New vertical pricing strategies.
- Schema changes or bulk-copying duplicate rules to every court.

## Verification (agent fills in before setting in-review)
- [x] `npm run build` passes
- [x] `php artisan test`: 209 passed; 2 pre-existing ResourceCategory migration-backfill failures
- [ ] Browser check (owner@pickleball.vn): not run; browser automation is unavailable in this session

## Log
- 2026-07-26 · claimed by opencode after user approval.
- 2026-07-26 · implementation complete on `feat/smart-pricing-rules`; ready for manager review.
- 2026-07-26 · reopened to synchronize the opening-rules layout at user request.
- 2026-07-26 · opening-rules layout synchronized; build and 4 feature tests passed.
- 2026-07-26 · replaced the repetitive two-column pattern with a weekly operations timeline and compact effective-period cards.
