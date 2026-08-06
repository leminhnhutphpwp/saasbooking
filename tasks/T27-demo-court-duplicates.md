---
id: T27
title: Remove duplicate demo courts
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: fix/demo-court-duplicates
scope:
  - apps/app/database/seeders/DemoSeeder.php
  - apps/app/tests/Feature/Database/DemoSeederTest.php
  - tasks/BOARD.md
  - tasks/T27-demo-court-duplicates.md
  - worklogs/2026-08-05-demo-court-duplicates.md
updated: 2026-08-05
---

## Goal
Prevent repeated demo seeding from creating duplicate courts. Remove the eight redundant demo courts in the current development database without deleting canonical courts or booking history.

## Context / references
The manager calendar exposed three identical sets of Sân A-D. Court ids 1-4 are canonical and contain booking slots; ids 11-14 and 22-25 have no booking, blackout, pricing-rule, or recurring-series dependencies.

## Acceptance criteria
- [x] Running `DemoSeeder` twice creates one court per demo court natural key.
- [x] Current development database retains canonical courts 1-4 and removes duplicated ids 11-14 and 22-25.
- [x] Calendar receives four unique demo court options.

## Out of scope (do NOT do here)
- Resetting or wiping the database.
- Changing production court naming or merging non-demo tenant data.

## Verification (agent fills in before setting in-review)
- [x] Focused PostgreSQL test passes.
- [x] Live calendar options verified.

## Log
- 2026-08-05 · claimed by opencode after browser review surfaced duplicate demo courts from repeat seeding.
- 2026-08-05 · test reproduced 8 duplicate pickleball courts after repeat seeding; fixed natural-key lookup and removed ids 11-14 and 22-25 after dependency inspection; moved to in-review.
