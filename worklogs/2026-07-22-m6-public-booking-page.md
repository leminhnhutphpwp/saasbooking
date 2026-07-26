# 2026-07-22 — M6 (phần 1): Trang đặt sân công khai

## Overview
Slice giá trị nhất của M6: trang đặt sân công khai (theo slug tenant, không auth), ráp M2–M4 thành luồng khách end-to-end: **chọn ngày → sân trống + giờ → nhập tên/SĐT → giữ chỗ → QR VietQR cọc → trạng thái tự cập nhật**. Mobile-first.

## Files Changed (apps/app/)
| File | Change |
|------|--------|
| `Http/Controllers/Public/PublicBookingController.php` | `show` (availability), `hold` (findOrCreate customer + createHold + initDeposit), `status` (QR + trạng thái) |
| `routes/web.php` | nhóm `book/{tenant:slug}` (show/hold/status), không auth |
| `resources/js/Pages/Public/Booking/Show.jsx` | chọn ngày + slot trống theo sân + form giữ chỗ |
| `resources/js/Pages/Public/Booking/Status.jsx` | QR (qrcode.react) + số cọc + nội dung CK + poll trạng thái |
| `package.json` | +`qrcode.react` (QR client-side, không phụ thuộc dịch vụ ngoài) |
| `tests/Feature/Booking/PublicBookingTest.php` | 3 test |

## Key Decisions
1. **Tenant theo slug ở URL công khai** (`{tenant:slug}`) — KHÁC WorkingTenant (dành cho manager có auth). Trang công khai resolve tenant từ slug, không dùng session.
2. **Inertia thuần cho đổi ngày** — `router.get(?date=)` re-render availability, không cần JSON API riêng.
3. **QR render client-side** từ chuỗi EMV (qrcode.react) — không gọi dịch vụ QR ngoài.
4. **Poll trạng thái** — Status page `router.reload({only:['booking']})` mỗi 5s khi pending; đổi sang confirmed khi đối soát (M4) chạy.

## Verification
- [x] `npm run build`: pass (2 trang + qrcode biên dịch)
- [x] `php artisan test`: **62/62 passed** (3 test M6)
  - show render availability ✓ · hold tạo customer+booking+payment, redirect status ✓ · status có QR + số cọc ✓
- [x] `pint --test`: pass

## Handoff Notes (M6 còn lại — lớn)
- **Dashboard chủ sân (Manager):** lịch lưới sân×giờ, đặt hộ khách vãng lai (tiền mặt), quản lý đặt cố định, hoàn cọc một chạm, màn "giao dịch chưa khớp / đối soát tay", cấu hình sân/giá/giờ mở/thương hiệu (gom nợ UI M2/M4).
- **Playwright E2E** (luồng khách + chủ sân đặt hộ).
- **Branding template** (logo/màu tenant) cho trang công khai (hiện dùng style mặc định).
- Tại thời điểm ghi log, trang công khai chưa gắn layout thương hiệu; contract cấu hình hiện hành ở `docs/04-cau-hinh-per-tenant.md`.

## Status
✅ Completed (phần 1) — luồng đặt sân công khai chạy & test end-to-end. ⚠️ Dashboard chủ sân + E2E + branding là phần lớn còn lại của M6.
