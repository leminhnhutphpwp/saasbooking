---
id: T22
title: Modern court operations table
status: done
owner: web-frontend
priority: P1
depends_on: []
branch: feat/modern-court-table
scope:
  - apps/app/resources/js/Pages/Manager/Courts/Index.jsx
  - worklogs/2026-07-24-modern-court-table.md
updated: 2026-07-24
---

## Goal

Replace the manager court card grid with a dense, modern operations table that makes courts easy to scan, search, filter, and configure. The view must make effective use of the shared wide manager container while staying usable on mobile.

## Context / references

- Current page: `apps/app/resources/js/Pages/Manager/Courts/Index.jsx`.
- Reuse `PageContainer`, `PageHeader`, `EmptyState`, `Card`, `Input`, `Select`, `Badge`, `Button`, `Table*`, and `DropdownMenu*` primitives.
- The current controller already sends the small tenant-scoped `courts` collection. Search/filter must be client-side; do not touch PHP, routes, or Inertia props.
- User direction: modern, high-craft table with search and filters. End-user copy remains Vietnamese.

## Acceptance criteria

- [ ] The card grid is replaced by one responsive `Table` inside a `Card`, with columns for court identity, type, status, configuration, and actions.
- [ ] A slim primary status rail appears in the identity cell for active courts; other cells use semantic tokens and existing court labels/status badge mapping.
- [ ] Toolbar provides name search, type filter, status filter, live `Hiển thị X/Y sân` count, and an available-only-when-needed clear filter action.
- [ ] Search/filter compose correctly against existing `courts` data without making requests or changing controller behavior.
- [ ] Compact buttons open opening rules and pricing rules; an accessible overflow dropdown holds edit/archive actions. Existing create/edit/archive behavior stays intact.
- [ ] Existing zero-courts `EmptyState` remains; a distinct no-match state provides a clear-filter action.
- [ ] At mobile width the table can horizontally scroll without clipping, and all controls/actions remain accessible.
- [ ] A worklog follows `worklogs/README.md` with actual verification outcomes.

## Out of scope (do NOT do here)

- Backend/controller/routing/model changes, server-side filtering, pagination, sorting, bulk actions, drag-and-drop ordering, dependencies, sidebar/topbar changes, and public pages.
- Updating `tasks/BOARD.md` or any task metadata other than this task’s own handoff status if it is available.

## Verification (agent fills in before setting in-review)

- [x] `git diff --check` passes
- [x] `npm --prefix apps/app run build` passes
- [ ] Browser check at ~1440px: search, each filter, combined filters, clear filters, configuration links, edit and archive actions.
- [ ] Browser check at ~390px: controls wrap/scroll correctly; table has no clipped content and remains actionable.
- [ ] Browser check: zero-data and filter-no-match empty states are distinct.

## Log

- 2026-07-24 · created by manager
- 2026-07-25 · web-frontend: implemented modern table with client-side filtering, status rail, DropdownMenu actions, and empty states. Build passes.
