---
id: T50
title: Design-kit manager catalog pages
status: done
owner: "OpenCode"
priority: P1
depends_on: [T47]
branch: feat/design-kit-migration
scope:
  - apps/app/resources/js/Pages/Manager/Courts/
  - apps/app/resources/js/Pages/Manager/Settings/
  - tasks/T50-design-kit-manager-catalog-pages.md
  - worklogs/2026-08-10-design-kit-manager-catalog-pages.md
updated: 2026-08-10
---

## Goal
Migrate court catalog and Manager settings pages to the canonical design kit without changing tenant configuration behavior.

## Acceptance criteria
- [x] Tables, forms, timelines, and empty states use design-kit tokens and semantics.
- [x] Public tenant branding remains confined to the explicit booking preview.
- [x] No page-level literals/arbitrary design values are introduced.

## Out of scope (do NOT do here)
- Shared primitives and other Manager/public pages.

## Verification
- [ ] Frontend build passes (blocked: `npm` is not installed in this environment).
- [ ] Relevant tests pass (blocked: `php` is not installed in this environment).
- [x] Browser checks complete or blocker recorded (blocked: no running app/browser endpoint was available).

## Log
- 2026-08-10 · created after design-kit foundation migration.
- 2026-08-10 · Migrated Courts and Settings page UI within scope; verification blockers recorded.
