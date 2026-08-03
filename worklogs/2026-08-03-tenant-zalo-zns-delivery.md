# 2026-08-03 - Tenant-scoped Zalo ZNS delivery

## Overview
Moved HTTP ZNS delivery credentials and approved template IDs from process-wide environment configuration to the encrypted per-tenant OA configuration. Delivery failures are now safe, tenant-scoped records and transient provider outages retry independently of booking state.

## Files Changed
| File | Change |
|------|--------|
| `app/Services/Notification/HttpZaloZnsTransport.php` | Resolve the notifiable tenant configuration, map logical templates, and classify safe failure outcomes. |
| `app/Notifications/*Notification.php` | Add three-attempt, 60s/5m backoff, 30-second timeout policy. |
| `database/migrations/2026_08_03_000000_add_delivery_state_to_notification_messages.php` | Add durable delivery attempt and failure metadata. |
| `tests/Feature/*Zalo*`, `tests/Feature/Notification/NotificationTest.php` | Cover tenant isolation, unavailable config, mapping, and retry recording. |
| `config/zalo.php`, `.env.example`, `docs/07-luong-du-lieu.md`, `docs/08-thiet-ke-module-chi-tiet.md`, `docs/12-lo-trinh.md` | Remove global credential/template settings and document tenant configuration. |

## Key Decisions
1. `ZALO_DRIVER` remains only a transport selector. `log` stays the credential-free local fallback; HTTP credentials and template mappings live in encrypted `zalo_oa_configs` per tenant.
2. Missing, inactive, expired, or incomplete configurations do not call Zalo and create a failed ledger row for redrive after configuration is fixed. Permanent provider rejections do the same.
3. Network errors, HTTP 429, and 5xx are recorded and rethrown so Laravel retries the queued notification at most three times. Booking transactions remain unaffected.

## Verification
- [x] `docker compose exec app php artisan test tests/Feature/HttpZaloZnsTransportTest.php tests/Feature/Notification/NotificationTest.php`: 15 passed, 48 assertions
- [x] `docker compose exec app php artisan test`: 242 passed, 846 assertions
- [x] Targeted `vendor/bin/pint`: passed
- [x] Frontend build: not applicable; no frontend files changed

## Handoff Notes
- Before production HTTP delivery, create and activate one `zalo_oa_configs` row per tenant with `oa_id`, encrypted token, and approved mappings for `booking_confirmed`, `reminder_1day`, and `reminder_2h`.
- Real Zalo OA credentials, approved templates, and an end-to-end delivery/redrive verification still require provider access.

## Status
Completed
