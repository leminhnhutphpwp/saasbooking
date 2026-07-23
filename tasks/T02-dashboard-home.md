---
id: T02
title: Dashboard = trang chủ thật
status: todo
owner: "-"
priority: P1
depends_on: [T01]
branch: feat/dashboard-home
scope:
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/app/Http/Controllers/HomeController.php
updated: 2026-07-23
---

## Mục tiêu
Biến Home thành **trung tâm điều phối** — nơi chủ sân/nhân viên mở app là thấy tình hình hôm nay và đi nhanh tới mọi việc. Chữa "các trang thiếu liên kết".

## Yêu cầu (acceptance criteria)
- [ ] **Tổng quan hôm nay**: số đặt sân, đã xác nhận, chờ cọc, doanh thu hôm nay, tỉ lệ lấp sân — dùng `StatCard` + `formatVND`.
- [ ] **Quick actions**: Đặt hộ khách vãng lai · Tạo đặt cố định · Xem lịch hôm nay · Xử lý hoàn cọc — nút dẫn thẳng.
- [ ] **Cross-links / cần chú ý**: danh sách ngắn "cọc đang chờ", "hoàn cọc cần xử lý", "giao dịch chưa khớp" — mỗi cái link tới đúng trang.
- [ ] **Sắp diễn ra**: vài booking kế tiếp trong ngày.
- [ ] Dữ liệu scope theo `WorkingTenant`; controller mỏng (đọc qua service/model, không logic nghiệp vụ mới).
- [ ] Dùng component nền sẵn (`PageHeader/StatCard/StatusBadge/EmptyState/format`); empty state khi chưa có dữ liệu.

## Ngoài phạm vi
- Không sửa layout/sidebar/palette (đã ở T01). Không tạo report nặng (→ T03).

## Verification
- [ ] `npm run build` pass · `php artisan test` nếu đụng backend
- [ ] Browser: Home hiển thị số liệu đúng của tenant + các link đi đúng chỗ.

## Nhật ký
- 2026-07-23 · created by manager
