---
id: T53
title: Design-kit legacy primitive cleanup
status: done
owner: "OpenCode"
priority: P2
depends_on: [T47]
branch: feat/design-kit-migration
scope:
  - apps/app/resources/js/Components/ui/dropdown-menu.jsx
  - apps/app/resources/js/Components/ui/sheet.jsx
  - apps/app/resources/js/Components/ui/sidebar.jsx
  - apps/app/resources/js/Components/ui/popover.jsx
  - apps/app/resources/js/Components/ui/scroll-area.jsx
  - apps/app/resources/js/Components/NavLink.jsx
  - apps/app/resources/js/Components/ResponsiveNavLink.jsx
  - tasks/T53-design-kit-legacy-primitive-cleanup.md
  - worklogs/2026-08-10-design-kit-legacy-primitive-cleanup.md
updated: 2026-08-10
---

## Goal
Remove or migrate unused legacy UI primitives so the repository has no conflicting visual foundations after design-kit adoption.

## Acceptance criteria
- [x] Unused primitives are removed only after import verification, or migrated to canonical tokens if retained.
- [x] No page import behavior regresses.

## Out of scope (do NOT do here)
- Live auth/profile UI owned by T52.
- Shared Manager/public page work.

## Verification
- [x] Frontend build passes (`docker compose exec -T vite npm run build`).
- [x] Import audit confirms no removed primitive has a live consumer.

## Log
- 2026-08-10 · created after post-migration static audit.
- 2026-08-10 · removed seven unused legacy primitives after exact module-source import audit; retained dependency packages because they may serve other primitives; Vite-container production build passed.
