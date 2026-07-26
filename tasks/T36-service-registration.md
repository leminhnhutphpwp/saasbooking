---
id: T36
title: Platform services and per-service tenant registration
status: done
owner: opencode
priority: P0
depends_on: []
branch: feat/service-registration
scope:
  - apps/app/app/Enums/PlatformServiceStatus.php
  - apps/app/app/Http/Controllers/Auth/ServiceRegistrationController.php
  - apps/app/app/Http/Controllers/Manager/TenantSwitchController.php
  - apps/app/app/Http/Controllers/Auth/RegisteredUserController.php
  - apps/app/app/Http/Middleware/HandleInertiaRequests.php
  - apps/app/app/Models/PlatformService.php
  - apps/app/app/Models/Tenant.php
  - apps/app/app/Models/User.php
  - apps/app/app/Providers/AppServiceProvider.php
  - apps/app/app/Support/WorkingTenant.php
  - apps/app/database/migrations/*platform_services*.php
  - apps/app/database/migrations/*memberships*.php
  - apps/app/database/seeders/PlatformServiceSeeder.php
  - apps/app/database/seeders/DatabaseSeeder.php
  - apps/app/database/seeders/DemoSeeder.php
  - apps/app/resources/js/Components/AppTopbar.jsx
  - apps/app/resources/js/Pages/Auth/RegisterService.jsx
  - apps/app/resources/js/Pages/Auth/Register.jsx
  - apps/app/routes/auth.php
  - apps/app/routes/web.php
  - apps/app/tests/Feature/Auth/RegistrationTest.php
  - apps/app/tests/Feature/Auth/ServiceRegistrationTest.php
  - apps/app/tests/Feature/Tenant/WorkingTenantTest.php
  - docs/05-module-map.md
  - docs/02-yeu-cau-chuc-nang.md
  - docs/04-cau-hinh-per-tenant.md
  - docs/06-erd.md
  - docs/08-thiet-ke-module-chi-tiet.md
  - docs/09-kien-truc-mo-rong.md
  - docs/12-lo-trinh.md
  - CLAUDE.md
  - AGENTS.md
  - tasks/BOARD.md
  - worklogs/2026-07-26-service-registration.md
updated: 2026-07-26
---

## Goal
Make business services platform-configured and require each venue registration to create one tenant for one service. One account may own multiple service-specific tenants and switch only among its memberships.

## Context / references
- `CLAUDE.md` principles 1-3
- `docs/09-kien-truc-mo-rong.md`
- User decision: backend + seeder service management; cookie/query tenant switching; one account with multiple service registrations.

## Acceptance criteria
- [x] Platform services are stored in the database and seeded without an admin UI.
- [x] Every tenant references exactly one service; legacy tenants are backfilled safely.
- [x] One user can own multiple tenant memberships without weakening tenant isolation.
- [x] Account registration continues into one-service venue registration.
- [x] Existing owners can register another service and switch tenants via a secure cookie-backed action.
- [x] Architecture and roadmap docs describe the new model consistently.

## Out of scope (do NOT do here)
- Platform admin UI or Filament.
- Automated billing, commission charging, plan enforcement, or capacity-session drivers.
- Allowing one tenant to enable multiple services.

## Verification
- [x] `npm run build` passes
- [x] Targeted PostgreSQL tests: 13 passed, 30 assertions
- [x] `vendor/bin/pint --test` passes
- [x] Integrated production build and Pint pass after merging current main.
- [x] 213 backend tests pass; 6 host-render failures are the known backend-only T29/T30 Inertia manifest limitation.

## Log
- 2026-07-26 · claimed by opencode in an isolated worktree from main.
- 2026-07-26 · integrated with T35/main, verified, and closed for manager merge.
