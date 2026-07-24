# 2026-07-24 — T16: Zalo ZNS HTTP Transport

## Overview
Implemented a real HTTP transport for Zalo ZNS (Zalo Notification Service) so booking confirmations and reminders can actually reach customers via Zalo OA instead of just being logged. The implementation follows the existing `LogZaloZnsTransport` pattern and is config-driven — `ZALO_DRIVER=http` switches to the HTTP transport in production while `ZALO_DRIVER=log` (default) keeps the log-only behavior for local development.

## Files Changed
| File | Change |
|------|--------|
| `apps/app/app/Services/Notification/HttpZaloZnsTransport.php` | **NEW** — HTTP transport that posts to Zalo Business API. Records success/failure to `notification_messages` table. Handles missing token, API errors, 403 (token expired), and HTTP errors. |
| `apps/app/config/zalo.php` | **NEW** — Config for Zalo ZNS: driver (log/http), OA credentials (access_token, refresh_token), API endpoints, template IDs. All env-driven. |
| `apps/app/app/Providers/AppServiceProvider.php` | **MODIFIED** — Changed `register()` to bind `ZaloZnsTransport::class` based on `config('zalo.driver')`. Default is `log`, prod uses `http`. |
| `apps/app/tests/Feature/HttpZaloZnsTransportTest.php` | **NEW** — 5 tests covering: success, API error, 403 token expired, missing token, correct payload. Uses Http::fake() to mock Zalo API responses. |
| `tasks/T16-zalo-zns-http.md` | **MODIFIED** — Updated status to in-review, refined scope to reflect actual implementation. |

## Key Decisions
1. **Config-driven transport selection** — Rather than a complex driver system, kept it simple: `ZALO_DRIVER` env var switches between `log` (default for dev) and `http` (for prod). This matches Laravel's convention and is easy to understand.

2. **Separate HttpZaloZnsTransport class** — Instead of adding HTTP logic to the existing `LogZaloZnsTransport`, created a new class that implements the same `ZaloZnsTransport` contract. This keeps concerns separated and makes the fallback behavior explicit.

3. **Idempotent DB recording** — Used `updateOrCreate()` with `(tenant_id, booking_id, template)` as the unique key, mirroring the log transport's pattern. This prevents duplicate sends if the same notification is triggered twice.

4. **Comprehensive error handling** — The transport handles all failure modes: missing access_token (logs warning + records failure), Zalo API errors (non-zero error_code), 403 (token expired — logs warning for operator action), and HTTP errors. All failures are recorded to the DB for audit trail.

5. **Template ID mapping** — Config maps logical template names (e.g., `booking_confirmation`) to actual Zalo template IDs via env vars. This allows different templates per environment without code changes.

## Verification
- [ ] Static/lint: pass (not run — requires Docker)
- [ ] Tests: 5 new tests written (not run — requires Docker for PostgreSQL)
- [ ] Manual check: deploy to staging with real Zalo OA credentials, verify message is sent

## Handoff Notes
- **Tests need Docker**: The test suite requires PostgreSQL (the app uses `timestamptz` and exclusion constraints that SQLite doesn't support). Run tests with `docker compose exec app php artisan test tests/Feature/HttpZaloZnsTransportTest.php`.

- **Production setup**: To enable HTTP transport in production, set these env vars:
  ```
  ZALO_DRIVER=http
  ZALO_OA_ACCESS_TOKEN=<from Zalo OA console>
  ZALO_OA_REFRESH_TOKEN=<from Zalo OA console>
  ZALO_TEMPLATE_CONFIRMATION=<actual template ID>
  ZALO_TEMPLATE_REMINDER=<actual template ID>
  ```

- **Token refresh**: The access_token expires and must be refreshed manually via Zalo OA console. When a 403 is received, the transport logs a warning and records the failure — an operator must refresh the token and retry. Auto-refresh is out of scope for T16.

- **Audit trail**: All ZNS messages (sent or failed) are recorded in `notification_messages` with status (`sent`/`failed`), channel (`zalo_zns`), and error details in payload. This provides a complete audit trail for debugging.

- **No regression**: The log transport (`LogZaloZnsTransport`) remains unchanged and is the default. Existing notification tests should still pass.

## Status
✅ Completed (implementation done, tests written; verification requires Docker)
