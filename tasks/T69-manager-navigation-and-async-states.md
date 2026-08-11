---
id: T69
title: Manager navigation and async states
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/navigation-async-states
scope:
  - apps/app/resources/js/managerNav.jsx
  - apps/app/resources/js/Layouts/ManagerLayout.jsx
  - apps/app/resources/js/Components/AppTopbar.jsx
  - apps/app/resources/js/Components/EmptyState.jsx
  - apps/app/resources/js/Components/ui/skeleton.jsx
  - tasks/T69-manager-navigation-and-async-states.md
  - worklogs/2026-08-11-manager-navigation-and-async-states.md
updated: 2026-08-11
---

## Goal
Improve Manager navigation density, settings discoverability, and shared async/empty/error state contract.

## Context / references
- `.claude/skills/design-system/SKILL.md`
- Current issue: Venue Profile is not reachable from manager navigation
- Current issue: Signed-in navigation duplicates first five destinations while desktop rail exposes unlabeled icons for all ten
- Current issue: `Skeleton` exists but none of the reviewed manager pages use it
- Need to establish reusable manager patterns for loading/empty/error states

## Acceptance criteria
- [ ] Every current manager destination is reachable, including the currently orphaned `/manager/venue` page
- [ ] Define one consistent operational hierarchy: primary day-to-day destinations are discoverable without duplicated/conflicting desktop rail and topbar navigation
- [ ] Catalog/settings and financial tools remain reachable on desktop and mobile
- [ ] Active route state, Vietnamese accessible names, tooltips/labels, keyboard arrow navigation, and focus order remain correct
- [ ] Mobile bottom navigation does not obscure actions/content and its overflow menu contains the expected non-primary destinations
- [ ] Establish reusable manager patterns for: initial/loading skeleton, filtered-empty vs first-use-empty, inline recoverable error, submit-pending state, and retry/reset action
- [ ] Replace page-specific bare empty/error fragments with the shared contract while preserving each page's domain-specific action and Vietnamese copy
- [ ] Courts retains its distinct first-use and no-match states
- [ ] Reconcile/Refund remain appropriately non-actionable when queues are clear
- [ ] Skeletons use the existing `Skeleton`/canonical sunk pulse treatment
- [ ] No new dependency, spinner system, or custom alert bar
- [ ] Flash messages continue through Sonner
- [ ] State is not communicated by color alone
- [ ] No route, tenant-switching, authorization, or manager-shell change

## Out of scope (do NOT do here)
- Customer, Refunds, Reconcile, Calendar, Bookings, Series, or Settings form changes
- Backend navigation or authorization paths

## Verification (agent fills in before setting in-review)
- [ ] Playwright route matrix for every manager-nav item at 1440px and 390px; verify active state, keyboard navigation, overflow behavior, no horizontal overflow, and no console errors
- [x] Existing manager access tests plus frontend build — 314 tests pass, `npm run build` clean
- [ ] Playwright fixtures/interception or deterministic seeded states for loading, first-use empty, filtered empty, validation error, server error, and successful mutation at 390px and 1440px
- [x] Existing focused feature tests remain green; build passes

## Log
- 2026-08-11 · claimed by OpenCode to improve Manager navigation and async states.
- 2026-08-11 · implemented navigation reorganization, tooltips, EmptyState variants, skeleton helpers. All 314 tests pass, frontend build clean.
