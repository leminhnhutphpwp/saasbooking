---
id: T03
title: Reports (báo cáo)
status: todo
owner: "-"
priority: P1
depends_on: [T01]
branch: feat/reports
scope:
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx
  - apps/app/app/Http/Controllers/Manager/ReportController.php
updated: 2026-07-23
---

## Mục tiêu
Chủ sân cần thấy tiền & hiệu suất — hiện chưa có màn báo cáo nào.

## Yêu cầu (acceptance criteria)
- [ ] **Doanh thu** theo ngày/tháng (biểu đồ cột đơn giản + tổng), chỉ tính booking confirmed/đã thu.
- [ ] **Tỉ lệ lấp sân** (occupancy) theo ngày/khung giờ.
- [ ] **No-show & cọc**: số bom sân, cọc đã thu, hoàn cọc.
- [ ] **Top khách hàng** (số lần đặt / doanh thu).
- [ ] Bộ lọc khoảng thời gian; scope theo `WorkingTenant`; tiền `formatVND`.
- [ ] Query gọn (không N+1); controller mỏng. Biểu đồ tự vẽ bằng SVG/CSS hoặc lib đã có — **không thêm dependency nặng** nếu tránh được (hỏi manager nếu cần lib chart).
- [ ] Dùng component nền + empty state.

## Ngoài phạm vi
- Không export Excel/PDF (đợt sau). Không sửa layout/palette.

## Verification
- [ ] `npm run build` pass · test nếu đụng backend
- [ ] Browser: số liệu khớp dữ liệu seed; đổi khoảng thời gian cập nhật đúng.

## Nhật ký
- 2026-07-23 · created by manager
