---
id: T07
title: Polish foundation — container system + empty states + consistency
status: todo
owner: "-"
priority: P0
depends_on: []
branch: feat/polish-foundation
scope:
  - apps/app/resources/js/Components/PageContainer.jsx      # new
  - apps/app/resources/js/Components/EmptyState.jsx
  - apps/app/resources/js/Components/PageHeader.jsx
  - apps/app/resources/js/Components/StatCard.jsx
  - apps/app/resources/js/Components/ui/card.jsx
  - apps/app/resources/css/app.css
updated: 2026-07-23
---

## Goal
Owner feedback: pages look plain, containers are inconsistent, empty states float in a sea of white. Build the shared craft primitives so every page becomes consistent + polished. **Blocking** — T08/T09/T10 build on this.

## Context
See `.claude/rules/ui-design` → "Craft & consistency checklist". Current problems (screenshots): pricing page = one tiny empty card across a full-bleed row; branding = stacked cards with dead space on the right; no shared container so each page has a different width.

## Acceptance criteria
- [ ] **`PageContainer.jsx`** — the single page wrapper used by every authenticated page: consistent `max-width` (e.g. `max-w-6xl`), responsive padding (`px-4 sm:px-6`), vertical section rhythm (`py-6 space-y-6`), centered. Optional `size` prop (`default` | `narrow` for forms/empty pages so they don't stretch). Exported for reuse.
- [ ] **`EmptyState` v2** — icon in a tinted circle + title + one-line hint + optional example text + optional primary action; centered with a sensible min-height; looks intentional, not a bare box.
- [ ] **`PageHeader`** — refine: consistent title/description/actions row, consistent bottom spacing; support a `backHref`/breadcrumb slot (for sub-pages like court → opening-rules).
- [ ] **`StatCard`** — tighten padding/typography so numbers read as the hero; consistent icon treatment.
- [ ] **`ui/card`** — ensure one consistent border/shadow/radius token used app-wide (no per-page variation).
- [ ] Any shared spacing/shadow tokens needed go in `app.css` (keep the shadcn variable structure).
- [ ] Do NOT restyle feature pages here (that's T08/T09/T10) — just the primitives + a short usage note in the PR description.

## Out of scope
- Feature-page layouts (T08 public, T09 config, T10 operational). No backend.

## Verification
- [ ] `npm run build` passes; `php artisan test` 108/108 (should be untouched)
- [ ] Browser at ~390px AND ~1440px: render a page using PageContainer + the new EmptyState to prove the primitives look right in both.

## Log
- 2026-07-23 · created by manager
