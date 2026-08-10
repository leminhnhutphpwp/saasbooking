---
id: T52
title: Design-kit auth and profile pages
status: done
owner: "OpenCode"
priority: P1
depends_on: [T47]
branch: feat/design-kit-migration
scope:
  - apps/app/resources/js/app.jsx
  - apps/app/resources/js/Layouts/GuestLayout.jsx
  - apps/app/resources/js/Pages/Auth/
  - apps/app/resources/js/Pages/Profile/
  - apps/app/resources/js/Components/TextInput.jsx
  - apps/app/resources/js/Components/Checkbox.jsx
  - apps/app/resources/js/Components/Modal.jsx
  - apps/app/resources/js/Components/PrimaryButton.jsx
  - apps/app/resources/js/Components/SecondaryButton.jsx
  - apps/app/resources/js/Components/DangerButton.jsx
  - tasks/T52-design-kit-auth-profile-pages.md
  - worklogs/2026-08-10-design-kit-auth-profile-pages.md
updated: 2026-08-10
---

## Goal
Migrate all live auth, registration, guest, and profile UI to the canonical design kit.

## Acceptance criteria
- [x] No literal colors/arbitrary design values remain in scoped live UI.
- [x] Auth/profile forms, controls, dialogs, focus, and touch targets meet design-system rules.
- [x] Existing auth/profile behavior is unchanged.

## Out of scope (do NOT do here)
- Shared Manager/public page work.
- Unused primitives owned by T53.

## Verification
- [x] Frontend build passes.
- [x] Relevant tests pass.
- [x] Browser checks blocked: CDP endpoint `127.0.0.1:9222` is unavailable.

## Log
- 2026-08-10 · created after post-migration static audit.
- 2026-08-10 · migrated scoped auth, guest, profile, controls, and delete dialog to design-kit tokens; 27 PHP tests and Vite build passed. Browser CDP unavailable.
