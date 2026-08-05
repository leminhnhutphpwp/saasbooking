---
id: T06
title: Prevent inactive public booking sheet from blocking courts
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: fix/public-booking-sheet-visibility
scope:
  - apps/app/resources/js/Pages/Public/Booking/Show.jsx
  - tasks/BOARD.md
  - tasks/T06-public-booking-sheet-visibility.md
  - worklogs/2026-08-03-public-booking-sheet-visibility.md
updated: 2026-08-03
---

## Goal
Keep the fixed public-booking sheet out of the DOM until a customer selects a court, so it cannot obscure the court list. Preserve slot selection and the existing hold confirmation form.

## Context / references
- `.claude/rules/ui-design/SKILL.md`
- `apps/app/resources/js/Pages/Public/Booking/Show.jsx`

## Acceptance criteria
- [x] The court list is fully visible and interactive before a court is selected.
- [x] Selecting a court exposes its slots; selecting a slot keeps the hold confirmation usable.
- [x] The sheet controls expose an accessible dialog and selected states.
- [x] Production frontend build passes.

## Out of scope (do NOT do here)
- Backend, hold-flow, route, or dependency changes.
- Source files owned by T01-T05.

## Verification (agent fills in before setting in-review)
- [x] `bash scripts/dev.sh build` passes in the Vite container.
- [ ] Browser check: no automated browser renderer is available in this environment.

## Log
- 2026-08-03 · claimed by opencode.
- 2026-08-03 · ready for review; the sheet is mounted only after court selection, with selected-state and dialog labels added. The Vite production build passes; browser verification is unavailable.
