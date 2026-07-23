---
id: T14
title: DemoSeeder — reproducible demo data (committed to the repo)
status: todo
owner: "-"
priority: P1
depends_on: []
branch: chore/demo-seeder
scope:
  - apps/app/database/seeders/DemoSeeder.php   # new
updated: 2026-07-23
---

## Goal
The demo (2 tenants, 4 users, 10 courts, bookings) currently exists **only in the running dev DB `san`** — it is NOT in code (a sub-agent's seeder rewrite was reverted as out-of-scope, but the data it had created persisted). So a fresh DB / new machine / CI gets nothing but `test@example.com`. Build a committed **`DemoSeeder`** so the demo is reproducible via `php artisan db:seed --class=DemoSeeder`.

## Hard requirements
- **Use `forceCreate` / `forceFill`** for Booking / Payment / Court / Refund / RecurringSeries — those models have `tenant_id`/`status`/money removed from `$fillable` (audit #10, `.claude/rules/*`). A plain `create([...])` will silently drop those columns → NOT NULL errors. Other models (Tenant/User/Customer/OpeningRule/PricingRule) are fine with `create`.
- **Idempotent**: look up by natural key (user email, tenant slug) with `firstOrNew`/`firstWhere` so re-running doesn't duplicate. NEVER truncate/wipe (see `.claude/rules/testing` — no `migrate:fresh`/`db:wipe`/bulk delete).
- **Do NOT wire this into the default `DatabaseSeeder`** (tests/`RefreshDatabase` must stay lean) — it runs only via `--class=DemoSeeder`.
- **Roles**: ensure the three roles exist first (call `RoleSeeder` or `firstOrCreate` `super_admin`/`owner`/`staff`).
- **Time**: booking slot `start_at`/`end_at` use naive/venue-wall-clock datetimes (wall-as-UTC convention — e.g. `$today->setTime(8,0)`, no tz offset) so they show correctly on the calendar/availability.
- Money is integer VND (`100_000`). Passwords: the factory default (`password`) is fine.

## Demo content to create (you can also inspect the live `san` DB for exact values)
- **Tenants**: "Sân Pickleball MVP" (slug `pickleball-mvp`, vertical `racket_court`, tz `Asia/Ho_Chi_Minh`, settings.branding.primary_color) + "Sân Cầu Lông Nhà Văn Hóa" (slug `cau-long-nvh`).
- **Users** (assign roles): `admin@san.vn` (super_admin, tenant_id null), `owner@pickleball.vn` (owner, tenant 1), `staff@pickleball.vn` (staff, tenant 1), `owner@caulong.vn` (owner, tenant 2).
- **Courts**: tenant 1 → Sân A1/A2/B1/B2 (pickleball); tenant 2 → Sân 1..6 (cau_long). All active.
- **Opening rules**: tenant 1 06:00–23:00 all weekdays; tenant 2 06:00–22:00.
- **Pricing rules** (court_id null = tenant-wide): pickleball 100k off-peak (06–17) / 130k peak weekday (17–22) / 150k weekend; cau_long 80k / 120k.
- **Customers**: ~5 for tenant 1.
- **Bank config** (`tenant_bank_config`): one active row per tenant (demo provider `sepay`, bank_bin, account_number, account_name, webhook_secret).
- **Bookings** (tenant 1, TODAY): a few realistic ones — e.g. confirmed w/ matched VietQR payment, a pending-deposit hold, a walk-in cash confirmed — each with its `booking_slots` (Committed/Holding) + `payments`. Codes like `SAN-XXXXX`.

## Acceptance criteria
- [ ] `DemoSeeder.php` created; `php artisan db:seed --class=DemoSeeder` runs clean on a fresh DB AND is safe to re-run (idempotent, no duplicates, no errors).
- [ ] After seeding: can log in as `owner@pickleball.vn` / `password`; calendar/home show the demo bookings; public page `/book/pickleball-mvp` shows courts + prices.
- [ ] Uses forceCreate/forceFill for guarded models; wall-as-UTC slot times; no wipe.

## Out of scope
- No UI. Don't change the default `DatabaseSeeder`. No migrations.

## Verification
- [ ] Run on a scratch DB: `createdb san_demo` → `DB_DATABASE=san_demo php artisan migrate --seed` won't include it; instead `DB_DATABASE=san_demo DB_HOST=127.0.0.1 php artisan migrate` then `... db:seed --class=DemoSeeder` → passes; run it TWICE → still clean (idempotent). `php artisan test` 108/108 (unaffected).
- [ ] Login + browser check the demo renders.

## Log
- 2026-07-23 · created by manager
