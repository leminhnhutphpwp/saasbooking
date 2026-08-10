---
id: T45
title: Manager overlay primitive conformance
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/manager-design-conformance
scope:
  - apps/app/resources/js/Components/ui/dialog.jsx
  - apps/app/resources/js/Components/ui/alert-dialog.jsx
  - apps/app/resources/js/Components/ui/select.jsx
  - apps/app/resources/js/Components/ui/badge.jsx
  - apps/app/resources/js/Components/ui/checkbox.jsx
  - apps/app/resources/js/Components/ui/label.jsx
  - apps/app/resources/js/Components/ui/textarea.jsx
  - apps/app/resources/js/Components/ui/tooltip.jsx
  - apps/app/resources/js/Components/ConfirmActionDialog.jsx
  - apps/app/resources/js/Components/Dropdown.jsx
  - tasks/T45-manager-overlay-primitive-conformance.md
  - worklogs/2026-08-10-manager-overlay-primitive-conformance.md
updated: 2026-08-10
---

## Goal
Bring Manager-reachable dialog, form, menu, and overlay primitives into DESIGN.md conformance.

## Acceptance criteria
- [x] Overlays, panels, menus, selects, tooltips, labels, badges, and confirmation actions use the required tokens, semantics, focus, and motion.
- [x] No Manager-reachable primitive retains disallowed card borders, sharp controls, generic red fill, or unlabelled menu interaction.

## Out of scope (do NOT do here)
- Manager page layouts owned by T46.
- Public behavior and backend contracts.

## Verification
- [x] Frontend build passes (`docker compose exec -T vite npm run build`).
- [ ] Relevant tests could not run: Playwright Chromium is missing from the Vite container.
- [ ] Browser check could not run: CDP endpoint `http://127.0.0.1:9222` refused connection.

## Log
- 2026-08-10 · created and claimed after final primitive audit.
- 2026-08-10 · implementation complete; verification results recorded in the T45 worklog.
- 2026-08-10 · build passed; Playwright blocked by missing Chromium and browser QA blocked by unavailable CDP endpoint.
