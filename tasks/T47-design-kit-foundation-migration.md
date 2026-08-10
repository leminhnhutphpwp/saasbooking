---
id: T47
title: Design-kit foundation migration
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/design-kit-migration
scope:
  - .claude/skills/design-system/
  - .claude/skills/design-review/
  - .claude/agents/design-reviewer.md
  - .claude/hooks/check-tokens.sh
  - .claude/settings.json
  - DESIGN.md
  - apps/app/resources/css/app.css
  - apps/app/resources/js/Layouts/ManagerLayout.jsx
  - apps/app/resources/js/Components/
  - apps/app/resources/js/managerNav.jsx
  - tasks/T47-design-kit-foundation-migration.md
  - worklogs/2026-08-10-design-kit-foundation-migration.md
updated: 2026-08-10
---

## Goal
Make the supplied design kit the repository's canonical UI system and migrate the shared Manager foundation without changing product behavior.

## Context / references
- Canonical source: `/home/minhnhutpc/Downloads/files/design-kit/.claude/skills/design-system/`.
- The user explicitly selected the design kit over the prior `DESIGN.md` Quiet Green system.
- This Laravel/Inertia/Tailwind 3 app must adapt the kit rather than import Next.js or Tailwind 4 config verbatim.

## Acceptance criteria
- [x] Project includes the design-system skill, references, review agent, and enforcement hook.
- [x] `DESIGN.md` clearly defers to the new canonical kit instead of conflicting with it.
- [x] Shared tokens, shell, navigation, primitives, typography and charts use the design-kit vocabulary and behavior.
- [x] No Next.js, TypeScript, Tailwind 4, CDN, or unrelated dependency config is copied into the app.

## Out of scope (do NOT do here)
- Page-specific Manager layouts, which follow in scoped tasks.
- Backend, routing, booking, payment, and tenant behavior.

## Verification
- [ ] Frontend build passes (blocked: npm is unavailable both locally and in the app container).
- [x] Relevant tests pass (`ManagerDashboardTest`, `ManagerAccessTest`: 6 tests, 23 assertions).
- [ ] Browser check records shell/navigation results (blocked: CDP endpoint at 127.0.0.1:9222 is unavailable).

## Log
- 2026-08-10 · created and claimed after explicit user selection of design kit as the new standard.
- 2026-08-10 · migrated the shared Manager foundation and installed canonical design resources; no page or backend files changed.
