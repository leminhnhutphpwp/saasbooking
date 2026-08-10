---
id: T46
title: Manager final page conformance
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/manager-design-conformance
scope:
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Settings/Branding.jsx
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
  - tasks/T46-manager-final-page-conformance.md
  - worklogs/2026-08-10-manager-final-page-conformance.md
updated: 2026-08-10
---

## Goal
Resolve all verified remaining page-level DESIGN.md violations after the Manager-wide conformance pass.

## Acceptance criteria
- [x] Charts, actions, markers, forms, and previews use compliant accents, numeric treatment, focus, and responsive sizing.
- [x] No verified page-level issue from the final audit remains.

## Out of scope (do NOT do here)
- Shared primitives owned by T45.
- Backend data contracts and public booking behavior.

## Verification
- [x] Frontend build passes (`docker compose exec -T vite npm run build`).
- [x] Relevant test filter completed (`docker compose exec -T app php artisan test --filter=Report`; no matching tests exist).
- [ ] Browser check blocked: no Chrome DevTools endpoint is listening at `http://127.0.0.1:9222`.

## Log
- 2026-08-10 · created and claimed after final page audit.
- 2026-08-10 · page-only audit fixes applied; awaiting browser QA endpoint.
