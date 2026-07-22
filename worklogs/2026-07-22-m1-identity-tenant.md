# 2026-07-22 — M1: Identity + Multi-tenant (WorkingTenant)

## Overview
Cách ly tenant theo pattern `WorkingSchool` của appdhv. Mỗi user thuộc một tenant (venue); non-operator bị kẹp cứng vào `users.tenant_id`, super_admin chuyển venue tự do. Đây là ranh giới bảo mật #1 của hệ thống.

## Files Changed
| File | Change |
|------|--------|
| `database/migrations/..._create_tenants_table.php` | `tenants` (id, uuid, name, slug UNIQUE, timezone, status, softDeletes) |
| `database/migrations/..._add_tenant_id_to_users_table.php` | `users.tenant_id` nullable FK → tenants |
| `database/migrations/..._create_permission_tables.php` | spatie/laravel-permission (published) |
| `app/Models/Tenant.php` | model: uuid route key, SoftDeletes, Auditable, scopeActive, isActive, users() |
| `app/Models/User.php` | +`HasRoles` (spatie), `tenant_id` fillable, `isGlobalOperator()`, `tenant()` |
| `app/Support/WorkingTenant.php` | **port từ WorkingSchool**: resolve() kẹp cứng non-operator, super_admin switch; id(), switchable(), activeTenants() |
| `app/Http/Middleware/ResolveWorkingTenant.php` | gắn `workingTenantId` vào request (chạy TRƯỚC HandleInertiaRequests) |
| `app/Http/Middleware/HandleInertiaRequests.php` | share auth+roles, flash, workingTenants, workingTenantId |
| `bootstrap/app.php` | đăng ký `ResolveWorkingTenant` trước Inertia trong web group |
| `database/seeders/RoleSeeder.php` + `DatabaseSeeder.php` | roles super_admin / owner / staff |
| `tests/Feature/Tenant/WorkingTenantTest.php` | 3 test cách ly tenant |

## Key Decisions
1. **Cách ly ở tầng app (WorkingTenant), giống appdhv** — RLS Postgres để **chừa cửa** (thêm per-table ở M2+ khi có bảng tenant-owned); tránh phức tạp SET LOCAL/transaction ở M1 khi chưa có bảng nghiệp vụ nào.
2. **Bỏ `memberships`** cho MVP — một user = một tenant qua `users.tenant_id` + spatie role. `memberships` (user làm nhiều venue) là cửa chừa.
3. **Test ở tầng resolver** — chưa có bảng nghiệp vụ (courts ở M2) nên test trực tiếp `WorkingTenant::resolve()`: forge `?tenant_id` không vượt được kẹp cứng.

## Verification
- [x] `php artisan migrate` (dev `san`): tenants + tenant_id + permission_tables ✓
- [x] `php artisan test` trên **PostgreSQL**: **28/28 passed** (25 Breeze + 3 tenant isolation)
- [x] `pint --test`: pass
- [x] Test then chốt: non-operator forge `?tenant_id=B` → vẫn resolve tenant A ✓; super_admin switch được ✓; user chưa gán tenant → null ✓

## Handoff Notes
- **Docker:** thêm port `127.0.0.1:6379:6379` cho redis (local artisan cần với tới cache/queue). Local artisan chạy kèm `DB_HOST=127.0.0.1 REDIS_HOST=127.0.0.1`, hoặc `docker compose exec app php artisan ...`.
- **RLS** chưa bật — khi tạo bảng tenant-owned ở M2, thêm policy `tenant_id = current_setting('app.tenant_id')` + `SET LOCAL` trong middleware (chừa cửa, không bắt buộc).
- **M2 (court-catalog):** mọi bảng tenant-owned phải có `tenant_id` + composite FK `(tenant_id, id)`; controller scope `->where('tenant_id', WorkingTenant::id($request))`.

## Status
✅ Completed — M1 xong, sẵn sàng M2 (Court-catalog).
