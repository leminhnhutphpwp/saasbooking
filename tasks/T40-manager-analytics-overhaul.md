---
id: T40
title: Manager UI restyle
status: done
owner: "OpenCode"
priority: P1
depends_on: []
branch: feat/manager-analytics-overhaul
scope:
  - DESIGN.md
  - apps/app/resources/js/Layouts/ManagerLayout.jsx
  - apps/app/resources/js/managerNav.jsx
  - apps/app/resources/js/Components/PageContainer.jsx
  - apps/app/resources/js/Components/PageHeader.jsx
  - apps/app/resources/js/Components/EmptyState.jsx
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/resources/js/Pages/Manager/Refunds/Index.jsx
  - apps/app/resources/js/Pages/Manager/Settings/Branding.jsx
  - apps/app/resources/js/Pages/Manager/Reconcile/Unmatched.jsx
  - apps/app/app/Http/Controllers/Manager/HomeController.php
  - apps/app/app/Http/Controllers/Manager/ReportController.php
  - apps/app/resources/js/Components/AppTopbar.jsx
  - apps/app/resources/js/Components/QuickLinks.jsx
  - apps/app/resources/js/Components/StatCard.jsx
  - apps/app/resources/js/Components/StatusBadge.jsx
  - apps/app/resources/js/Components/ui/sidebar.jsx
  - apps/app/resources/js/Components/ui/button.jsx
  - apps/app/resources/js/Components/ui/input.jsx
  - apps/app/resources/js/Components/ui/card.jsx
  - apps/app/resources/js/Components/ui/table.jsx
  - apps/app/resources/js/Pages/Manager/Bookings/Index.jsx
  - apps/app/resources/js/Pages/Manager/Bookings/Show.jsx
  - apps/app/resources/js/Pages/Manager/Customers/Index.jsx
  - apps/app/resources/js/Pages/Manager/Customers/Show.jsx
  - apps/app/resources/js/Pages/Manager/Courts/Index.jsx
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - apps/app/resources/js/Pages/Manager/Series/Index.jsx
  - apps/app/resources/js/Pages/Manager/Settings/VenueProfile.jsx
  - apps/app/resources/css/app.css
  - tasks/T40-manager-analytics-overhaul.md
  - tasks/BOARD.md
  - worklogs/2026-08-10-manager-analytics-overhaul.md
updated: 2026-08-10
---

## Goal
Rebuild the authenticated Manager experience and shared primitives to conform to the normative Quiet Green Dashboard design system while preserving existing data contracts and routes.

## Context / references
- Existing Inertia props and shadcn/Tailwind components are the source of truth.
- Preserve `WorkingTenant` scoping and manager design-system conventions.

## Acceptance criteria
- [x] Apply DESIGN.md tokens, floating shell, floating rail, and responsive topbar across all authenticated Manager routes.
- [x] Restyle shared Manager primitives, forms, tables, statuses, empty states, charts, and pages without changing business behavior.
- [x] Audit every `Pages/Manager/**/*.jsx` page and replace page-level legacy panel, selection, status-tint, metric, and responsive overrides.
- [ ] Browser QA is blocked: no CDP endpoint is available in this session.

## Out of scope (do NOT do here)
- Booking or payment business-logic changes.
- New frontend dependencies or synthetic report data.

## Verification (agent fills in before setting in-review)
- [x] `docker compose exec -T vite npm run build` passes (Vite deprecation warnings only)
- [x] `docker compose exec -T app php artisan test`: 268 passed, 1038 assertions
- [x] `docker compose exec -T app vendor/bin/pint --dirty`: passed (no dirty PHP files)
- [ ] Browser check: unavailable; `http://127.0.0.1:9222` refused the CDP connection in this session.

## Log
- 2026-08-10 · created and claimed by OpenCode on `feat/manager-analytics-overhaul`.
- 2026-08-10 · ready for review; screenshots: `/tmp/browser-screenshot-1786374014112.png`, `/tmp/browser-screenshot-1786374024581.png`, `/tmp/san-ux/manager-home-390.png`, `/tmp/san-ux/manager-reports-390.png`.
- 2026-08-10 · reopened by the same OpenCode owner for the requested Manager blue-accent audit; scope expanded to shared Manager primitives and affected reachable pages.
- 2026-08-10 · completed the public-home palette audit, token correction, semantic warning-token cleanup, and mobile calendar overflow fix; ready for review.
- 2026-08-10 · reopened and expanded by the same OpenCode owner for the normative DESIGN.md Manager-wide restyle.
- 2026-08-10 · completed the shell, shared primitives, token replacement, and signature pill-bar visualizations; build and PostgreSQL suite pass; browser QA remains unavailable due to absent CDP.
- 2026-08-10 · reopened by the same OpenCode owner for a comprehensive page-level Manager conformance pass.
- 2026-08-10 · completed the page-level pass across all 15 Manager pages; production build, Manager feature tests, and diff check pass; CDP remains unavailable.
- 2026-08-10 · follow-up discovery identified remaining granular conformance work; it is split into T41-T44.
