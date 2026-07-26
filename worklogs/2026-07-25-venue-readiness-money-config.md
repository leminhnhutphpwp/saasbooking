# 2026-07-25 — Venue readiness and money configuration (T28)

**Goal:** Give venue owners an explicit readiness checklist before accepting real bookings and VietQR deposits.

**Changed:**
- `apps/app/database/migrations/2026_07_25_200000_add_readiness_to_tenants_table.php` — adds `is_ready` (boolean, default false) + `readiness_checked_at` (timestamptz nullable) to `tenants`
- `apps/app/app/Services/VenueReadinessService.php` — evaluates 4 readiness blockers, returns typed `ReadinessState`
- `apps/app/app/Services/ReadinessState.php` — readonly value object: tenant, isReady, blockers, checkedAt, actionLinks()
- `apps/app/app/Services/ReadinessBlocker.php` — readonly value object: code, message, action
- `apps/app/app/Models/Tenant.php` — added `is_ready`, `readiness_checked_at` to fillable; added `courts()`, `bankConfigs()`, `activeBankConfig()` relationships
- `apps/app/tests/Feature/Venue/VenueReadinessTest.php` — 19 tests covering all 4 blockers, combined ready state, persist, tenant isolation, encrypted secret non-disclosure, maintenance courts, multi-court coverage
- `tasks/T28-venue-readiness-money-config.md` — task file created, status `in-review`

**Decisions:**
- Readiness columns denormalized onto `tenants` (not a separate table) because readiness is a single-tenant concept; avoids extra join on every dashboard render.
- `VenueReadinessService::check()` is the authoritative evaluator; `is_ready` is a cached snapshot — the dashboard reads the cache, but the service computes fresh state.
- 4 blockers: no active court, missing opening coverage (per active court), missing pricing rule, missing active bank config.
- Opening coverage check: each active court must have at least one `opening_rules` row with `effective_from <= today`.
- Bank config `active` boolean (not soft-delete) matches existing `tenant_bank_config` schema convention.
- `ReadinessBlocker.action` uses route name identifiers (e.g. `courts.create`) for UI navigation.
- `webhook_secret` encryption already handled by existing `TenantBankConfig` model `$casts = ['webhook_secret' => 'encrypted']`.
- Bank secrets never serialized/exposed in `ReadinessState` — verified by test.

**Next:** Manager (coordinator) reviews branch + merges. Then UI agent can consume `ReadinessState` to render the readiness checklist on the dashboard.
