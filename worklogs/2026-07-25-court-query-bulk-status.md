# 2026-07-25 · Court query and bulk status API (T23)

## Goal

Implement tenant-safe server-side court filtering, pagination, and bulk status updates for the manager court table.

## Changed

### `apps/app/app/Http/Controllers/Manager/CourtController.php`
- **index**: Added validation for `search` (string), `type` (CourtType enum), `status` (CourtStatus enum)
- Added PostgreSQL-safe ILIKE search with escaped `%` and `_` wildcards
- Added `where('court_type', ...)` and `where('status', ...)` enum-validated filters
- Changed from eager `get()` to `paginate(10)->withQueryString()` for stable pagination
- Added `abort_if($tenantId === null, 403)` guard
- Added `filters` array to Inertia props (search, type, status values)
- Added `courtStatuses` enum collection to Inertia props
- **updateStatus**: New method for `PATCH /manager/courts/status`
  - Validates `court_uuids` (required array, 1–100, UUID, distinct)
  - Validates `status` (required CourtStatus enum)
  - Atomic cross-tenant rejection inside `DB::transaction` with `lockForUpdate`
  - Returns Vietnamese flash message on success

### `apps/app/routes/web.php`
- Added `Route::patch('/courts/status', ...)` between `store` and `update`

### `apps/app/tests/Feature/Catalog/CourtManagementTest.php`
- Added helper methods: `court()` with forceCreate
- Added 8 new tests (12 total):
  - `test_index_filters_by_search_type_and_status` — combined filter validation
  - `test_index_search_is_case_insensitive_and_postgres_safe` — ILIKE + wildcard escaping
  - `test_index_paginates_ten_per_page_and_preserves_query_string` — pagination + query string
  - `test_index_returns_filter_values_and_enum_options` — Inertia props shape
  - `test_bulk_status_updates_only_selected_own_courts` — happy path
  - `test_bulk_status_rejects_entire_selection_when_a_court_is_outside_tenant` — atomic rejection
  - `test_bulk_status_rejects_nonexistent_uuids` — missing UUID validation
  - `test_bulk_status_validates_required_fields_and_enum` — empty array, invalid UUID, invalid enum

### `tasks/T23-court-query-bulk-status.md`
- Status → `in-review`
- Verification results filled in

## Decisions

- **Type filter (not category)**: The task specifies `type` (CourtType enum) not `category` (ResourceCategory UUID). This aligns with the court_type column that exists on the courts table.
- **100 UUID max**: Bulk status update bounded to 100 courts per request to prevent abuse.
- **Atomic rejection**: If ANY UUID is missing or cross-tenant, the entire batch is rejected (no partial updates).
- **`lockForUpdate`**: Used inside the transaction to prevent concurrent modifications during the count check.

## Verification

- `php artisan test --filter=CourtManagementTest` → **12 passed (171 assertions)**
- `vendor/bin/pint --test app/Http/Controllers/Manager/CourtController.php` → **PASS**
- No `migrate:fresh`, `db:wipe`, or destructive database operations used

## Next

- T24 can consume the paginated Inertia props (`courts.data`, `courts.meta`, `courts.links`, `filters`, `courtTypes`, `courtStatuses`) and the `PATCH /manager/courts/status` endpoint.
