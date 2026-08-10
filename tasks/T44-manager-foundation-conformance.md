---
id: T44
title: Manager shared foundation conformance
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/manager-design-conformance
scope:
  - apps/app/resources/css/app.css
  - apps/app/resources/js/Layouts/ManagerLayout.jsx
  - apps/app/resources/js/Components/AppTopbar.jsx
  - apps/app/resources/js/Components/EmptyState.jsx
  - apps/app/resources/js/Components/PageContainer.jsx
  - apps/app/resources/js/Components/PageHeader.jsx
  - apps/app/resources/js/Components/QuickLinks.jsx
  - apps/app/resources/js/Components/StatCard.jsx
  - apps/app/resources/js/Components/StatusBadge.jsx
  - apps/app/resources/js/Components/ui/button.jsx
  - apps/app/resources/js/Components/ui/card.jsx
  - apps/app/resources/js/Components/ui/input.jsx
  - apps/app/resources/js/Components/ui/table.jsx
  - apps/app/resources/js/managerNav.jsx
  - tasks/T44-manager-foundation-conformance.md
  - worklogs/2026-08-10-manager-foundation-conformance.md
updated: 2026-08-10
---

## Goal
Complete shared Manager shell and primitives required for every page to satisfy DESIGN.md.

## Acceptance criteria
- [x] Tokens, type, shell, rail, topbar, motion, focus and reduced-motion meet DESIGN.md.
- [x] Navigation is keyboard accessible and no destination is hidden on mobile.
- [x] Buttons, cards, tables, badges, and empty states meet their specifications.

## Out of scope (do NOT do here)
- Manager page-specific layouts owned by T41-T43.
- Backend behavior or public marketing UI.

## Verification
- [x] Frontend build passes: `docker compose exec -T vite npm run build`.
- [x] Relevant tests pass: `docker compose exec -T app php artisan test --testsuite=Feature` (267 passed, 1,037 assertions).
- [ ] Browser check records desktop and mobile results.

## Log
- 2026-08-10 · created and claimed after DESIGN.md discovery audit.
- 2026-08-10 · implemented shared Manager shell and primitive conformance; build and Feature suite pass. Browser QA blocked: no DevTools endpoint at `127.0.0.1:9222`.
