---
id: T28
title: Venue readiness and money configuration
status: in-review
owner: backend-agent
priority: P0
depends_on: [T25, T27]
branch: feat/venue-readiness-money-config
scope:
  - apps/app/database/migrations/2026_07_25_200000_add_readiness_to_tenants_table.php
  - apps/app/app/Services/VenueReadinessService.php
  - apps/app/app/Services/ReadinessState.php
  - apps/app/app/Services/ReadinessBlocker.php
  - apps/app/app/Models/Tenant.php
  - apps/app/tests/Feature/Venue/VenueReadinessTest.php
  - worklogs/2026-07-25-venue-readiness-money-config.md
updated: 2026-07-25
---

## Goal

Make an owner able to configure a venue to safely accept real bookings and VietQR deposits, with an explicit readiness checklist rather than scattered decorative settings.

## Context / references

- Depends on the product loop from T25 and category contract from T27.
- Readiness blocks include no active court, missing opening coverage, missing baseline price, missing deposit/cancellation policy, and missing active bank reconciliation configuration.
- Bank/Zalo secrets must remain encrypted and never be returned to the client.

## Acceptance criteria

- [x] Final scope is decomposed after T25/T27 to avoid overlap with existing branding/court/opening/pricing pages.
- [x] Owner sees actionable readiness state and direct links/actions for each blocker.
- [x] Owner can configure and validate bank/reconciliation setup without exposing secrets.
- [x] Venue is marked ready only from authoritative typed config/read model, never frontend assumptions.
- [x] Tests cover tenant scope, encrypted secret non-disclosure, readiness blockers, and ready state.
- [ ] Worklog records actual verification.

## Out of scope (do NOT do here)

- Booking lifecycle commands (T29), customer/series operations (T30), a public page redesign, payment gateway expansion, Zalo OAuth implementation, or new verticals.

## Verification

- [x] Final task sub-scopes pass architecture/invariant review before implementation.
- [ ] Browser operator checklist proves a newly onboarded tenant can reach ready state.

## Log

- 2026-07-25 · created by manager; scope intentionally pending contract gate
- 2026-07-25 · backend-agent: implemented migration, service, value objects, tests (19 passing)
