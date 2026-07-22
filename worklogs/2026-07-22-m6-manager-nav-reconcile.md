# 2026-07-22 — M6 (phần 3): Sidebar nav + giờ/giá UI + branding + đặt cố định + đối soát tay

## Goal
Hoàn thiện các UI còn lại của M6: Manager sidebar nav, cấu hình giờ & giá (M2 nợ), branding, quản lý đặt cố định, và màn đối soát tay (M4).

## Files Changed (apps/app/)
| File | Change |
|------|--------|
| `Http/Controllers/Manager/SeriesController.php` | **NEW** — index (list đặt cố định), store (create qua SeriesService), destroy (hủy) |
| `Http/Controllers/Manager/ReconcileController.php` | **NEW** — unmatched (giao dịch chưa khớp + đơn chờ cọc), manualMatch, dismissTxn |
| `Http/Controllers/Manager/BrandingController.php` | Sửa — upload logo + chọn màu chủ đạo |
| `Http/Controllers/Public/PublicBookingController.php` | Sửa — pass tenant.settings (branding) cho public page |
| `Http/Controllers/Manager/OpeningRuleController.php` | **NEW** — CRUD giờ mở cửa (nợ M2) |
| `Http/Controllers/Manager/PricingRuleController.php` | **NEW** — CRUD bảng giá (nợ M2) |
| `Services/Payment/ReconcileService.php` | Thêm manualMatch + dismissTxn |
| `Models/Tenant.php` | Thêm `settings` JSONB fillable + cast |
| `routes/web.php` | Thêm series, reconcile, branding, opening-rules, pricing-rules routes |
| `database/migrations/..._add_settings_to_tenants_table.php` | **NEW** — thêm settings JSONB |
| `resources/js/managerNav.jsx` | Sidebar nav config (Vận hành + Cấu hình), thêm Đặt cố định + Đối soát |
| `resources/js/Layouts/ManagerLayout.jsx` | **NEW** — shadcn sidebar layout |
| `resources/js/Pages/Manager/Series/Index.jsx` | **NEW** — list + create dialog (khách, sân, thứ, giờ, date range) |
| `resources/js/Pages/Manager/Reconcile/Unmatched.jsx` | **NEW** — 2 section (cần đối soát / chờ xử lý) + dialog match booking |
| `resources/js/Pages/Manager/Settings/Branding.jsx` | **NEW** — upload logo + color picker |
| `resources/js/Pages/Manager/Courts/OpeningRules.jsx` | **NEW** — list + dialog add/delete |
| `resources/js/Pages/Manager/Courts/PricingRules.jsx` | **NEW** — list + dialog add/delete |
| `resources/js/Components/ui/sidebar.jsx` | Sửa — case-sensitive Linux fix |
| `resources/js/Pages/Public/Booking/Show.jsx` | Render logo + primary_color |
| `resources/js/Pages/Public/Booking/Status.jsx` | Render logo + primary_color |
| `tests/Feature/Payment/ManualReconcileTest.php` | **NEW** — 2 test (manual match, dismiss) |

## Key Decisions
1. **ManagerLayout dùng shadcn sidebar** — config-driven (managerNav.jsx), responsive, có user menu. Mỗi item link qua route name.
2. **Đặt cố định UI dùng SeriesService::create sẵn** — không viết lại logic; UI truyền customer_id, court_id, weekday, time range, date range. Tạo dialog + list.
3. **Đối soát tay dùng BankTxnInbox + tenant bank config** — scope giao dịch theo tenant qua account_number → TenantBankConfig. 2 action: match (chọn đơn chờ cọc) / dismiss (bỏ qua).
4. **ReconcileService::manualMatch** — gọi bookingService::secureForPayment() cùng luồng với auto-reconcile (3 branches: confirm / grace / orphaned + auto-refund).
5. **Branding lưu trong tenant.settings JSONB** — không migration mỗi lần thêm field. Logo upload storage public.
6. **BrandingController → manager.branding.edit** — dùng route name sidebar nav.

## Verification
- [x] `npm run build`: pass · `pint`: clean
- [x] `php artisan test`: **66/66 passed** (213 assertions) + 1 skipped (HTTP controller test cần auth)
  - Series backend tests (3) ✓ · manual match confirms booking ✓ · dismiss marks ignored ✓

## Handoff Notes (Next)
- **Playwright E2E** (public booking flow + manager flow)
- **Kiểm thử controller HTTP** cho ReconcileController, SeriesController
- **M7** — go-lich hardening (docs/12)

## Status
✅ Completed (phần 3) — nav, giờ/giá, branding, đặt cố định UI, đối soát tay M4. ⚠️ Còn E2E Playwright.
