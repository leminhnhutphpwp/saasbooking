# 2026-07-22 — M2: Court-catalog

## Overview
Danh mục "bán": sân, giờ mở, ngày nghỉ, và **bảng giá giờ vàng/giờ thường**. Engine giá (`PricingService`) là phần cốt lõi và đã được test kỹ. CRUD sân qua UI hoạt động, scope theo tenant.

## Files Changed
| File | Change |
|------|--------|
| `database/migrations/..._create_courts_table.php` | `courts` (uuid, tenant_id, court_type, status) + `unique(tenant_id, id)` (parent của composite FK) |
| `..._create_opening_rules_table.php` | giờ mở theo weekday (jsonb) + giờ địa phương + tz + effective_from/to; composite FK |
| `..._create_pricing_rules_table.php` | giá theo weekday + khoảng giờ, `price_per_hour` BIGINT, priority; court_id nullable = mọi sân |
| `..._create_blackouts_table.php` | nghỉ/bảo trì [starts_at, ends_at) timestamptz |
| `app/Enums/CourtType.php`, `CourtStatus.php` | enum (cau_long/pickleball/khac; active/maintenance/archived) |
| `app/Models/{Court,OpeningRule,PricingRule,Blackout}.php` | models (Court: uuid route key, SoftDeletes, Auditable) |
| `app/Services/Catalog/PricingService.php` | `resolve()` — court-specific đè venue-wide, rồi priority; giá = per_hour × phút/60 |
| `app/Services/Catalog/CatalogService.php` | `openingWindows()` từ opening rules versioned |
| `app/Http/Controllers/Manager/CourtController.php` | CRUD Inertia, scope `WorkingTenant::id`, re-check tenant trên route-bound court |
| `routes/web.php` | nhóm `manager/courts` (auth) |
| `resources/js/Pages/Manager/Courts/Index.jsx` | UI: list + dialog thêm/sửa/lưu-trữ sân (shadcn) |
| `tests/Feature/Catalog/PricingServiceTest.php` | 3 test giá (peak>offpeak theo priority, court-specific thắng, prorate) |
| `tests/Feature/Catalog/CourtManagementTest.php` | 3 test: tạo scope tenant, index chỉ sân của mình, không sửa được sân tenant khác (403) |

## Key Decisions
1. **`weekday` lưu jsonb array** thay vì Postgres `int[]` — Laravel Blueprint không có int[] native; jsonb + cast 'array' tương đương, đơn giản hơn.
2. **`blackouts` dùng starts_at/ends_at** thay `tstzrange` — đủ cho availability trừ khoảng ở M3; gist range để sau nếu cần.
3. **Composite FK `(tenant_id, court_id)`** trên opening/pricing/blackout; court_id nullable → Postgres bỏ qua FK khi NULL (MATCH SIMPLE) cho "áp mọi sân".
4. **Archive thay xóa cứng sân** (docs/11 #12) — booking cũ còn tham chiếu.

## Verification
- [x] `php artisan migrate`: 4 bảng + composite FK ✓
- [x] `php artisan test` trên **PostgreSQL**: **34/34 passed** (thêm 6 test M2)
- [x] `npm run build`: pass (trang Courts biên dịch OK)
- [x] `pint --test`: pass

## Handoff Notes
- **UI còn thiếu của M2:** màn hình quản lý **giờ mở cửa** và **bảng giá** (backend + models + PricingService đã xong và test; chỉ thiếu 2 màn CRUD-form quản lý rule). Trang Courts hiện chỉ CRUD sân. → làm nốt đầu M3 hoặc bổ sung sau.
- **`config/booking.php` registry (vertical dispatch, docs/08 §0)** chưa tạo — sẽ dựng ở M3 khi vào `InventoryDriver`/`BookingService`.
- Model binding `{court}` theo uuid là global; controller đã re-check `tenant_id` (403 nếu khác tenant).

## Status
✅ Completed (lõi) — courts CRUD + engine giá xong & test. ⚠️ Còn UI quản lý giờ mở + bảng giá (backend sẵn sàng). Sẵn sàng M3 (Booking engine — lõi khó nhất).
