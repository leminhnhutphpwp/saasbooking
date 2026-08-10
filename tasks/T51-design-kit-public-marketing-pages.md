---
id: T51
title: Design-kit public and marketing pages
status: done
owner: "OpenCode"
priority: P1
depends_on: [T47]
branch: feat/design-kit-migration
scope:
  - apps/app/resources/js/Pages/Welcome.jsx
  - apps/app/resources/js/Pages/Marketing/
  - apps/app/resources/js/Pages/Public/
  - apps/app/resources/js/Components/Marketing/
  - tasks/T51-design-kit-public-marketing-pages.md
  - worklogs/2026-08-10-design-kit-public-marketing-pages.md
updated: 2026-08-10
---

## Goal
Migrate public booking and marketing surfaces to the canonical design kit, preserving public booking and tenant-brand behavior.

## Acceptance criteria
- [x] Marketing follows the marketing reference; product booking follows booking and a11y references.
- [x] No page-level literals/arbitrary design values are introduced except explicit tenant brand data where required.
- [x] Public booking remains responsive, accessible, and behaviorally unchanged.

## Out of scope (do NOT do here)
- Shared primitives, Manager pages, backend behavior.

## Verification
- [x] Frontend build passes.
- [x] Relevant tests pass.
- [x] Browser check blocker recorded.

## Log
- 2026-08-10 · created after design-kit foundation migration.
- 2026-08-10 · migrated scoped public booking and marketing surfaces. Tenant `primary_color` remains only on public tenant identity treatments (the booking logo border and customer avatar); product state and calls to action use canonical tokens. Browser CDP is unavailable at `127.0.0.1:9222`.
