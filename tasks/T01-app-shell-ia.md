---
id: T01
title: App shell & IA + palette v2
status: todo
owner: "-"
priority: P0
depends_on: []
branch: feat/app-shell-ia
scope:
  - apps/app/resources/js/Layouts/ManagerLayout.jsx
  - apps/app/resources/js/Layouts/AuthenticatedLayout.jsx
  - apps/app/resources/js/managerNav.jsx
  - apps/app/resources/css/app.css
  - apps/app/tailwind.config.js
  - apps/app/routes/web.php
  - apps/app/resources/js/Pages/Dashboard.jsx
  - apps/app/resources/js/Pages/Profile/Edit.jsx
  - apps/app/app/Http/Controllers/HomeController.php        # new (stub)
  - apps/app/app/Http/Controllers/Manager/ReportController.php  # new (stub)
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx     # new (stub, T02 fills)
  - apps/app/resources/js/Pages/Manager/Reports/Index.jsx  # new (stub, T03 fills)
updated: 2026-07-23
---

## Mục tiêu
Sửa gốc "lộn xộn, thiếu liên kết": gộp app về **MỘT khung duy nhất** (sidebar), làm sidebar **chắc chắn** hơn, hạ độ sáng palette, và tạo bộ khung IA (Home + Reports + điều hướng nhóm) để các task sau đắp vào. Đây là task **chặn** — mọi task UI khác phụ thuộc.

## Bối cảnh / feedback chủ sân (đã chốt hướng)
- `/dashboard` hiện là trang **Breeze mặc định** (khung top-nav khác hẳn, "You're logged in!") → lạc lõng. Ảnh: `screenshot-1784792013497-5.jpg`.
- Sidebar hiện: padding hẹp, **màu quá sáng/mềm yếu**, nhóm menu mờ. Ảnh trước: `screenshot-1784791258398-4.jpg`.
- App đang có **2 shell** (ManagerLayout sidebar + AuthenticatedLayout top-nav) → phải gộp về 1.

## Yêu cầu (acceptance criteria)
- [ ] **Một khung duy nhất** cho mọi trang đã đăng nhập (kể cả Profile) = ManagerLayout (sidebar). Bỏ khung top-nav Breeze; `AuthenticatedLayout` hoặc bị xoá/vô hiệu, hoặc trỏ về ManagerLayout.
- [ ] `/dashboard` **không còn trang Breeze**: redirect người dùng có tenant → route Home mới (`manager.home`); super_admin → giữ chỗ hợp lý. Login đáp về Home.
- [ ] **Sidebar v2**: nhóm rõ **Tổng quan · Vận hành · Cấu hình**; padding rộng hơn; **nền tối chắc chắn** (không pastel); active state đậm, có icon; footer user gọn. Responsive (mobile: sheet).
- [ ] **Palette v2 (bớt sáng, chắc tay)**: hạ độ sáng nền, tăng contrast, primary emerald **đậm/trầm hơn** (không chói); giữ cấu trúc biến shadcn (không vỡ component). Cập nhật cả light + dark.
- [ ] Thêm mục nav **Trang chủ** (Home) và **Báo cáo** (Reports).
- [ ] Tạo **stub** `Manager/Home/Index.jsx` + `HomeController` và `Manager/Reports/Index.jsx` + `ReportController` (chỉ khung rỗng + PageHeader; T02/T03 sẽ đắp nội dung). Route + nav trỏ đúng.
- [ ] Không phá 93 test hiện có; không đổi logic backend nghiệp vụ.

## Ngoài phạm vi
- Nội dung widget Dashboard (→ T02), nội dung Reports (→ T03), grid calendar (→ T04), trang khách (→ T05), config editors (→ T06).
- Không đụng logo/asset binary, không rewrite seeder.

## Verification
- [ ] `npm run build` pass
- [ ] `php artisan test` vẫn 93/93 (nếu đụng routes/controllers)
- [ ] Browser (owner@pickleball.vn): login → Home; mọi trang cùng 1 sidebar; sidebar tối/nhóm/rộng; không còn trang Breeze; ảnh kèm.

## Nhật ký
- 2026-07-23 · created by manager
