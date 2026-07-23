---
id: T05
title: Trang đặt của khách (public)
status: todo
owner: "-"
priority: P1
depends_on: [T01]
branch: feat/public-booking-ux
scope:
  - apps/app/resources/js/Pages/Public/Booking/Show.jsx
  - apps/app/resources/js/Pages/Public/Booking/Status.jsx
  - apps/app/app/Http/Controllers/Public/PublicBookingController.php
updated: 2026-07-23
---

## Mục tiêu
Đây là **bộ mặt bán hàng** — khách đặt bằng điện thoại. Hiện quá thô: input ngày mặc định trình duyệt, slot là rừng nút giống nhau, không giá/không trạng thái. Ảnh: `screenshot-1784790403008-3.jpg`.

## Yêu cầu (acceptance criteria)
- [ ] **Mobile-first**: bố cục 1 cột trên phone, chạm tốt.
- [ ] **Hero + branding tenant**: tên/logo + **màu chủ đạo của tenant** (đọc từ settings) áp vào accent — mỗi sân 1 nhận diện.
- [ ] **Date-strip** (dải ngày cuộn ngang) thay input ngày thô.
- [ ] **Slot**: hiện **giá** + phân biệt rõ **trống / đã đặt (disable) / đang chọn / giờ vàng**; nhóm theo sân gọn.
- [ ] **Tóm tắt đơn dính** (sân, giờ, giá, **tiền cọc**) + CTA rõ; các bước đặt mạch lạc.
- [ ] **Màn Status/QR đẹp**: QR VietQR nổi bật, số tiền/nội dung CK copy được, trạng thái tự cập nhật (giữ polling sẵn có).
- [ ] Controller chỉ **định hình dữ liệu đọc** (giá/trạng thái slot) — không đổi luồng hold/`BookingService`; giữ wall-as-UTC.
- [ ] i18n tiếng Việt chỉn chu; loading skeleton + empty/hết slot.

## Ngoài phạm vi
- Không đổi engine đặt/cọc/reconcile. Không builder.

## Verification
- [ ] `npm run build` pass · `php artisan test` (đụng PublicBookingController) giữ xanh
- [ ] Browser desktop + giả lập mobile: chọn ngày→slot có giá/trạng thái→đặt→QR; branding màu tenant hiện đúng.

## Nhật ký
- 2026-07-23 · created by manager
