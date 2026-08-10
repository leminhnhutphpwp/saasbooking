---
id: T57
title: Manager Series and topbar visual redesign
status: in-review
owner: "OpenCode"
priority: P1
depends_on: [T56]
branch: feat/manager-series-topbar-redesign
scope:
  - apps/app/resources/js/Components/AppTopbar.jsx
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
  - tasks/BOARD.md
  - tasks/T57-manager-series-topbar-redesign.md
  - worklogs/2026-08-11-manager-series-topbar-redesign.md
updated: 2026-08-11
---

## Goal
Make the Manager Series page purposeful at desktop and mobile widths, and balance the authenticated topbar without altering its destinations, tenant switching, or business actions.

## Context / references
- `.claude/skills/design-system/SKILL.md`
- `.claude/skills/design-system/references/app-ui.md`
- `.claude/skills/design-system/references/motion-a11y.md`
- Initial 1920px inspection: `/tmp/browser-screenshot-1786382667515.png`
- Same-owner coordination: T56 owns the fluid shell and remains unchanged; T54 owns `app.css` and remains unchanged.

## Acceptance criteria
- [x] Series page has a balanced header, a useful empty/list state, and responsive cards without changing submitted data or actions.
- [x] Topbar balances page context, navigation, tenant context, and account actions at desktop and mobile widths while retaining keyboard navigation.
- [x] Build, relevant tests, and browser checks at 1920px, 1440px, and 390px complete without horizontal overflow or browser errors.

## Out of scope (do NOT do here)
- Manager shell, rail, token stylesheet, routes, controllers, or series business logic.

## Verification
- [x] `docker compose exec -T vite npm run build` passes
- [x] `docker compose exec -T app php artisan test tests/Feature/Manager/SeriesControllerTest.php` passes: 3 tests, 8 assertions
- [x] Authenticated Playwright checks cover Series, Home, and Reports at 1920px, 1440px, and 390px with no document overflow or captured console errors. Plugin screenshots: 1920px `/tmp/browser-screenshot-1786383232570.png`, 1440px `/tmp/browser-screenshot-1786383440793.png`, 390px `/tmp/browser-screenshot-1786383609438.png`.
- [x] `git diff --check` passes

## Log
- 2026-08-11 · claimed after browser inspection found a left-heavy topbar and an unstructured Series empty state.
- 2026-08-11 · centered desktop navigation between explicit page context and tenant/account actions; mobile retains the established scrollable tabs and bottom rail.
- 2026-08-11 · replaced the sparse Series empty state with a single-action operational panel and reorganized populated cards around their recurring schedule.
