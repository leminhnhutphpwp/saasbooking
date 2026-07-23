---
id: T06
title: Config screens (opening / pricing / branding)
status: done
owner: agent
priority: P2
depends_on: [T01]
branch: feat/config-screens-ux
scope:
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - apps/app/resources/js/Pages/Manager/Settings/Branding.jsx
  - apps/app/app/Http/Controllers/Manager/OpeningRuleController.php
  - apps/app/app/Http/Controllers/Manager/PricingRuleController.php
  - apps/app/app/Http/Controllers/Manager/BrandingController.php
updated: 2026-07-23
---

## Goal
Config is currently raw (default HTML inputs, no preview). Build visual editors so owners can self-configure easily.

## Acceptance criteria
- [ ] **Opening hours**: a **weekly grid** editor (Mon–Sun), add/edit windows visually; show overlaps clearly (backend already rejects overlaps — render the error nicely).
- [ ] **Pricing**: a table by **time band + day** (normal / peak / weekend), easy row add, `formatVND`; show priority/tie clearly.
- [ ] **Branding**: a **shadcn uploader** (no raw input) + **logo preview** + **live preview** of the public page + the **public URL** with a copy button; color picker; png/jpg only (SVG already blocked — keep it).
- [ ] Controllers only shape read data + keep existing validation/ownership (do NOT loosen tenant scope or the mass-assignment guard).
- [ ] Use foundation components + empty states + a toast on save.

## Out of scope (do NOT do here)
- No pricing/opening/reconcile logic changes. No `$fillable`/guard changes.

## Verification
- [ ] `npm run build` passes · `php artisan test` (touches the 3 controllers) stays green
- [ ] Browser: editing hours/prices reflects back; logo upload shows preview + copyable URL; save fires a toast.

## Log
- 2026-07-23 · created by manager
- 2026-07-23 · manager review: verified live (branding uploader+preview+URL, opening weekly grid, pricing empty state) → APPROVED, merged (#12)
