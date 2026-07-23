# BOARD — SÂN task ledger

> Cập nhật: 2026-07-23 · Giao thức: [`README.md`](README.md). Agent chọn task `todo` (deps đã `done`), **claim bằng cách sửa file**, làm trong `scope`, trả `in-review` để manager duyệt.

## Đang mở (UI overhaul — đợt sau khi nghe feedback chủ sân)

| id | Task | status | owner | prio | depends_on | scope tóm tắt |
|----|------|--------|-------|------|-----------|---------------|
| [T01](T01-app-shell-ia.md) | App shell & IA + palette v2 (sidebar tối/nhóm/rộng, gộp 1 khung, sửa /dashboard lạc, palette bớt sáng) | todo | - | **P0** | — | Layouts, nav, app.css, tailwind, routes, Home/Reports stub |
| [T02](T02-dashboard-home.md) | Dashboard = trang chủ thật (tổng quan hôm nay + quick action + cross-link) | todo | - | P1 | T01 | Pages/Manager/Home + HomeController |
| [T03](T03-reports.md) | Reports (doanh thu / lấp sân / no-show / top khách) | todo | - | P1 | T01 | Pages/Manager/Reports + ReportController |
| [T04](T04-grid-calendar.md) | Grid calendar chủ sân (lưới sân×giờ, block màu, click đặt hộ) | todo | - | P1 | T01 | Pages/Manager/Calendar + CalendarController |
| [T05](T05-public-booking.md) | Trang đặt của khách (mobile-first, branding, slot giá/trạng thái, QR đẹp) | todo | - | P1 | T01 | Pages/Public/Booking + PublicBookingController |
| [T06](T06-config-screens.md) | Config screens (giờ mở lưới tuần, bảng giá dải, branding uploader+preview) | todo | - | P2 | T01 | Pages/Manager/Courts/{Opening,Pricing}Rules + Settings/Branding + controllers |

## Việc của MANAGER (không giao agent)
- [ ] Merge **PR #4** (siết mass-assignment #10) vào `main`.
- [ ] Merge **PR #5** (design-system foundation đợt 1) vào `main`.
- [ ] Sau khi #4/#5 merge → rebase các nhánh task lên `main`.

## Backlog (chưa mở file task — sẽ mở khi tới lượt)
- Backend/go-live: chạy `migrate` khi deploy · Zalo ZNS HTTP transport thật · `scripts/deploy.sh` · backup cron + test restore · security headers/CSP · error monitoring. (Chi tiết ở `../worklogs/2026-07-23-m6-audit-fixes.md` handoff + backlog đã gửi.)

## Đã xong
- Design-system foundation đợt 1 (PR #5) · M6 audit fixes (PR #3) · #10 (PR #4).
