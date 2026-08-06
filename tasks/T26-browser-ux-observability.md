---
id: T26
title: Browser UX verification guidance
status: in-review
owner: opencode
priority: P1
depends_on: []
branch: docs/browser-ux-observability
scope:
  - AGENTS.md
  - .claude/rules/ui-design/SKILL.md
  - .claude/rules/testing/SKILL.md
  - tasks/BOARD.md
  - tasks/T26-browser-ux-observability.md
  - worklogs/2026-08-05-browser-ux-observability.md
updated: 2026-08-05
---

## Goal
Make browser UX verification repeatable for interactive UI changes. Document screenshots, viewport checks, runtime observation, and how to separate application regressions from test-environment failures.

## Context / references
The compact marketing navigation needed an explicit pointer cursor after visual review. Existing UI rules require responsive checks but do not prescribe inspecting hover/cursor behavior or diagnosing browser-launch failures.

## Acceptance criteria
- [x] Core working rules require browser observation for interactive UI changes.
- [x] UI and testing rules specify viewport, screenshot, cursor/hover, console, request-failure, and trace checks.
- [x] Guidance distinguishes app failures from unavailable browser binaries or test infrastructure.
- [x] Rules explain direct CDP host-browser control, endpoint safety, and app-tab navigation.

## Out of scope (do NOT do here)
- Application UI implementation or new browser-test dependencies.
- CI configuration and Playwright version changes.

## Verification (agent fills in before setting in-review)
- [x] Documentation cross-check completed; `git diff --check` passes.
- [x] Host Chromium endpoint `127.0.0.1:9225` listed and navigated successfully.

## Log
- 2026-08-05 · claimed by opencode after a visual review exposed a missing pointer cursor that automated overflow checks did not cover.
- 2026-08-05 · documented required browser UX observation, screenshots, runtime monitoring, and runner-failure triage; moved to in-review.
- 2026-08-05 · reopened to document verified host Chromium CDP control and safe browser target selection.
- 2026-08-05 · verified local Chromium on port 9225, documented the control workflow, and moved to in-review.
