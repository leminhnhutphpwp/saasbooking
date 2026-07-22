# 2026-07-22 — M6 (phần 2): Dashboard chủ sân (thao tác cốt lõi)

## Overview
Hai thao tác vận hành quan trọng nhất của chủ sân: **lịch đặt sân theo ngày** + **đặt hộ khách vãng lai (tiền mặt)**, và **hàng chờ hoàn cọc một chạm**. Tất cả scope theo `WorkingTenant`.

## Files Changed (apps/app/)
| File | Change |
|------|--------|
| `Http/Controllers/Manager/CalendarController.php` | `index` (booking theo ngày, nhóm theo sân), `storeWalkIn` (đặt hộ: createHold owner_manual + Payment cash + confirm ngay) |
| `Http/Controllers/Manager/RefundController.php` | `index` (refund chờ), `markDone` (đánh dấu đã chuyển khoản) |
| `routes/web.php` | `manager/calendar`, `manager/calendar/walk-in`, `manager/refunds`, `manager/refunds/{refund}/done` |
| `resources/js/Pages/Manager/Calendar/Index.jsx` | lịch + dialog đặt hộ (sân/giờ/thời lượng/tên/SĐT) |
| `resources/js/Pages/Manager/Refunds/Index.jsx` | danh sách hoàn cọc + nút "Đã chuyển khoản" |
| `tests/Feature/Manager/ManagerDashboardTest.php` | 3 test |

## Key Decisions
1. **Đặt hộ tiền mặt = confirmed ngay** — createHold (owner_manual) → Payment method=cash matched → confirmDeposit (không QR, không TTL). Vẫn qua đúng BookingService (chống double-book).
2. **Hoàn cọc thủ công một chạm** — VietQR không có API refund; chủ sân CK tay rồi `markDone`. Scope tenant (403 nếu khác).
3. **Lọc lịch theo ngày** dùng bound naive (wall-as-UTC) nhất quán với slot đã lưu.

## Verification
- [x] `npm run build`: pass · `pint --test`: pass
- [x] `php artisan test`: **65/65 passed** (3 test M6·2)
  - đặt hộ → booking confirmed + payment cash matched ✓ · refund queue liệt kê + markDone ✓ · không sửa được refund tenant khác (403) ✓

## Handoff Notes (M6 còn lại)
- Màn cấu hình: **giờ mở cửa + bảng giá** (nợ UI M2), **thương hiệu/branding** trang công khai, **quản lý đặt cố định** (backend SeriesService xong), **màn đối soát tay** (inbox note — M4).
- **Sidebar nav** config-driven cho Manager (hiện các trang rời rạc, chưa có menu chung).
- **Playwright E2E** (khách đặt + chủ sân đặt hộ).

## Status
✅ Completed (phần 2) — lịch + đặt hộ tiền mặt + hoàn cọc chạy & test. ⚠️ Còn cấu hình giờ/giá/branding + nav + đặt-cố-định UI + E2E.
