---
id: T25
title: Run E2E migration as migrator
status: in-review
owner: opencode
priority: P1
depends_on: [T24]
branch: test/e2e-migrator-role
scope:
  - apps/app/package.json
  - apps/app/tests/e2e/README.md
  - apps/app/app/Http/Controllers/Public/PublicBookingController.php
  - apps/app/tests/Feature/Booking/PublicBookingTest.php
  - apps/app/tests/e2e/public-booking.spec.js
  - tasks/BOARD.md
  - worklogs/
updated: 2026-08-05
---

## Goal
Run the E2E fixture migration through the database owner connection instead of the tenant-scoped runtime role.

## Acceptance criteria
- [x] E2E preparation migrates successfully without changing table ownership.
- [x] Seeded Playwright suite passes.

## Out of scope
- Database schema, RLS policies, and runtime application permissions.

## Log
- 2026-08-05 · claimed after E2E preparation failed on a migration ALTER owned by postgres.
- 2026-08-05 · fixture migration and seed run through the migrator connection; verified and moved to in-review.
