---
id: T04
title: Grid calendar chủ sân
status: todo
owner: "-"
priority: P1
depends_on: [T01]
branch: feat/grid-calendar
scope:
  - apps/app/resources/js/Pages/Manager/Calendar/Index.jsx
  - apps/app/app/Http/Controllers/Manager/CalendarController.php
updated: 2026-07-23
---

## Mục tiêu
Thay **danh sách phẳng** hiện tại bằng **lịch lưới sân×giờ** thật — công cụ chủ sân dùng mỗi ngày. Ảnh hiện trạng: `screenshot-1784790306038-0.jpg`.

## Yêu cầu (acceptance criteria)
- [ ] **Lưới**: trục = các sân (cột) × khung giờ (hàng) cho 1 ngày; ô = block booking, cao theo thời lượng.
- [ ] **Block màu theo trạng thái** (dùng bảng màu StatusBadge): confirmed / chờ cọc / walk-in / hết hạn; hiện tên khách + giờ; hover/click xem chi tiết.
- [ ] **Click ô trống → đặt hộ** (mở dialog đặt hộ sẵn có với sân+giờ điền trước).
- [ ] **Điều hướng ngày** (‹ hôm nay ›) + có thể toggle **tuần** nếu khả thi; đường "bây giờ".
- [ ] Giữ nguyên convention **wall-as-UTC** khi dựng/đọc slot (không tự thêm tz).
- [ ] Mọi thao tác đặt vẫn qua `BookingService` (không tạo path đặt mới); scope theo `WorkingTenant`.
- [ ] Responsive: mobile cuộn ngang được; empty state khi ngày trống.

## Ngoài phạm vi
- Kéo-thả đổi giờ (đợt sau, ghi chú lại). Không sửa layout/palette.

## Verification
- [ ] `npm run build` pass · `php artisan test` (đụng CalendarController) giữ xanh
- [ ] Browser: lưới đúng booking seed hôm nay; click ô trống đặt hộ chạy; đổi ngày đúng.

## Nhật ký
- 2026-07-23 · created by manager
