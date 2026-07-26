# 2026-07-26 — Add customer code column + auto-generation

## Goal
Add a human-readable `code` column to the `customers` table for staff-facing customer identification (KH0001, KH0002, … per tenant). Includes auto-generation for new customers and a backfill command for existing data.

## Changed files
1. `database/migrations/2026_07_26_100000_add_code_to_customers_table.php` — new migration: adds `code` column (string 20, nullable) + composite unique index `(tenant_id, code)`
2. `app/Console/Commands/BackfillCustomerCodes.php` — new Artisan command `customers:backfill-codes` to generate sequential codes for existing customers per tenant
3. `app/Models/Customer.php` — added `code` to `$fillable`, auto-generate on creating via `generateCode()` with `FOR UPDATE` lock

## Key decisions
- **Code format:** `KH` prefix + 4-digit zero-padded sequential number (KH0001, KH0002, …). KH = Khách Hàng in Vietnamese. Per-tenant scoping so each tenant starts at 0001.
- **Race condition handling:** `generateCode()` uses raw SQL with `FOR UPDATE` to lock the max-code row during generation, preventing duplicate codes under concurrent creates. The composite unique index `(tenant_id, code)` is the safety net.
- **Backfill strategy:** Command processes per-tenant, orders by `id` for deterministic sequencing, respects existing codes (finds max before continuing), and uses `DB::transaction` for bulk updates. Safe to run multiple times — only touches `NULL` codes.
- **Column placement:** `after('id')` so code appears early in the table (visible in admin UIs).
- **Nullable initially:** Existing customers have no code until backfilled; new customers auto-generate via model event.

## Verification
- All 3 files pass `php -l` syntax check
- Migration follows project convention (anonymous class, `declare(strict_types)`, clean `up`/`down`)
- Model follows existing patterns (booted event, forceFill via $fillable)
