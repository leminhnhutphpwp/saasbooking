---
id: T01
title: App shell & IA + palette v2
status: todo
owner: "-"
priority: P0
depends_on: []
branch: feat/app-shell-ia
scope:
  - apps/app/resources/js/Layouts/ManagerLayout.jsx
  - apps/app/resources/js/Layouts/AuthenticatedLayout.jsx
  - apps/app/resources/js/managerNav.jsx
  - apps/app/resources/css/app.css
  - apps/app/tailwind.config.js
  - apps/app/routes/web.php
  - apps/app/resources/js/Pages/Dashboard.jsx
  - apps/app/resources/js/Pages/Profile/Edit.jsx
  - apps/app/app/Http/Controllers/HomeController.php          # new (stub)
  - apps/app/app/Http/Controllers/Manager/ReportController.php  # new (stub)
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx        # new (stub, T02 fills)
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx     # new (stub, T03 fills)
updated: 2026-07-23
---

## Goal
Fix the root "messy / disconnected" problem: unify the app to **ONE shell** (sidebar), make the sidebar **substantial**, tone the palette down, and lay the IA skeleton (Home + Reports + grouped nav) the other tasks fill in. This is the **blocking** task — every other UI task depends on it.

## Context / owner feedback (direction locked)
- `/dashboard` is currently the **default Breeze page** (a different top-nav shell, "You're logged in!") → orphaned. Screenshot: `screenshot-1784792013497-5.jpg`.
- Current sidebar: narrow padding, **too bright / weak**, faint grouping. Before: `screenshot-1784791258398-4.jpg`.
- The app has **two shells** (ManagerLayout sidebar + AuthenticatedLayout top-nav) → merge into one.

## Acceptance criteria
- [ ] **One shell** for every authenticated page (Profile included) = ManagerLayout (sidebar). Drop the Breeze top-nav shell; `AuthenticatedLayout` is removed/disabled or re-points to ManagerLayout.
- [ ] `/dashboard` **no longer renders the Breeze page**: users with a tenant redirect to the new Home route (`manager.home`); super_admin gets a sensible placeholder. Login lands on Home.
- [ ] **Sidebar v2**: clear groups — "Tổng quan" · "Vận hành" · "Cấu hình"; wider padding; **substantial darker surface** (not pastel); strong active state with icons; compact user footer. Responsive (mobile: sheet).
- [ ] **Palette v2 (less bright, more grounded)**: lower background brightness, raise contrast, make primary emerald **deeper/less neon**; keep the shadcn variable structure (don't break components). Update both light + dark.
- [ ] Add nav items **Home** ("Trang chủ") and **Reports** ("Báo cáo").
- [ ] Create **stubs**: `Manager/Home/Index.jsx` + `HomeController`, `Manager/Reports/Index.jsx` + `ReportController` (empty shells with PageHeader only; T02/T03 add content). Routes + nav wired.
- [ ] Do not break the 93 existing tests; do not change business logic.

## Out of scope (do NOT do here)
- Dashboard widget content (→ T02), Reports content (→ T03), grid calendar (→ T04), public page (→ T05), config editors (→ T06).
- No logo/binary assets, no seeder rewrite, no route changes beyond the /dashboard redirect + Home/Reports routes.

## Verification
- [ ] `npm run build` passes
- [ ] `php artisan test` still 93/93 (if routes/controllers touched)
- [ ] Browser (owner@pickleball.vn): login → Home; every page shares one sidebar; sidebar is darker/grouped/wider; no Breeze page left; attach screenshots.

## Log
- 2026-07-23 · created by manager
