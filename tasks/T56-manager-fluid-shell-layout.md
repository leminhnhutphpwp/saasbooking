---
id: T56
title: Manager fluid shell layout
status: in-review
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/manager-fluid-shell
scope:
  - apps/app/resources/js/Components/PageContainer.jsx
  - apps/app/resources/js/Layouts/ManagerLayout.jsx
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - tasks/T56-manager-fluid-shell-layout.md
  - worklogs/2026-08-11-manager-fluid-shell-layout.md
updated: 2026-08-11
---

## Goal
Make the authenticated Manager content wrapper fluid on widescreen while retaining narrow form layouts and responsive gutters.

## Context / references
- `.claude/skills/design-system/references/app-ui.md`
- User-requested override of the former 1440px Manager width rule.
- `tasks/BOARD.md` is reserved by active task T55 and is intentionally not edited by this task.

## Acceptance criteria
- [x] Manager Home, Reports, Calendar, and Courts use available widescreen width without document overflow.
- [x] Narrow forms retain their readable max width and mobile/tablet gutters remain responsive.
- [x] Build and requested browser verification pass.

## Out of scope (do NOT do here)
- Public and marketing layout changes.
- Page-specific grid redesigns or Reports chart geometry changes.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T vite npm run build` passes
- [x] `docker run --rm --network host ... npx playwright test tests/e2e/login-and-manager.spec.js` passes: 2 tests
- [x] Plugin browser checks at 1920px, 1440px, and 390px pass; no horizontal overflow, visible errors, or Reports chart clipping.

## Log
- 2026-08-11 · claimed after 1920px inspection identified PageContainer's `max-w-7xl` as the source of unused Manager gutters.
- 2026-08-11 · root-cause inspection also identified `app.css` shell `max-width: 1440px`; T54 owns that stylesheet, so ManagerLayout applies the user-authorized shell override without overlapping the active task.
- 2026-08-11 · verified the fluid shell on Manager Home and Reports at 1920px, 1440px, and 390px. Desktop screenshots: `/tmp/browser-screenshot-1786382140331.png`, `/tmp/browser-screenshot-1786382417527.png`, `/tmp/browser-screenshot-1786382269582.png`, `/tmp/browser-screenshot-1786382284246.png`; mobile screenshots: `/tmp/browser-screenshot-1786382367465.png`, `/tmp/browser-screenshot-1786382395894.png`.
