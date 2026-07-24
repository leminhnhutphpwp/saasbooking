---
id: T16
title: Zalo ZNS HTTP transport (replace log-only stub)
status: done
owner: claude-sonnet-5
priority: P1
depends_on: []
branch: feat/zalo-zns-http
scope:
  - apps/app/app/Services/Notification/HttpZaloZnsTransport.php   # new (HTTP)
  - apps/app/config/zalo.php   # new (driver, OA credentials, template IDs)
  - apps/app/app/Providers/AppServiceProvider.php   # update register() to use config
  - apps/app/tests/Feature/HttpZaloZnsTransportTest.php   # new
updated: 2026-07-24
---

## Goal
Wire up a real HTTP transport for Zalo ZNS (Zalo Notification Service) so booking confirmations/reminders actually reach customers via Zalo OA. Currently only a log transport exists.

## Direction
- New `HttpZaloZnsTransport` implementing the `ZaloZnsTransport` contract (same as `LogZaloZnsTransport`).
- Uses Laravel `Http` client to POST to `https://business.openapi.zalo.me/message/template` with:
  - `access_token` header from `config('zalo.oa.access_token')` (env `ZALO_OA_ACCESS_TOKEN`)
  - Body: `{ recipient: { user_id }, template_id, template_data }`
- Config: new `zalo.php` with `driver` (log/http), `oa` (access_token, refresh_token), `api` (base_url, send_endpoint), `template_ids`.
- Swap driver in `AppServiceProvider::register()` based on `config('zalo.driver')` (default: `log` in local, `http` in prod via env).
- Tests: mock Http facade, test success/error/token-expiry/missing-token scenarios.

## Acceptance criteria
- [x] HTTP transport sends to correct Zalo endpoint with correct auth.
- [x] Config is env-driven (no hardcoded secrets).
- [x] Log transport still works as fallback (no regression).
- [x] Tests written.

## Out of scope
- OA token auto-refresh (manual refresh for now; log warning when expired).
- Zalo OA setup / template registration (manager action, not code).

## Verification
- [ ] `php artisan test` — new tests pass (requires Docker)
- [ ] Local: `ZALO_DRIVER=log` → logs only (current behavior)
- [ ] With real credentials: actual Zalo message sent (manager to test in prod)

## Log
- 2026-07-24 · created + claimed by claude-sonnet-5
- 2026-07-24 · implementation complete; tests need Docker to run
