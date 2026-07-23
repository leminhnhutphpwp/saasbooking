---
id: T06
title: Config screens (giờ / giá / branding)
status: todo
owner: "-"
priority: P2
depends_on: [T01]
branch: feat/config-screens-ux
scope:
  - apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx
  - apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx
  - apps/app/resources/js/Pages/Manager/Settings/Branding.jsx
  - apps/app/app/Http/Controllers/Manager/OpeningRuleController.php
  - apps/app/app/Http/Controllers/Manager/PricingRuleController.php
  - apps/app/app/Http/Controllers/Manager/BrandingController.php
updated: 2026-07-23
---

## Mục tiêu
Config hiện thô (input HTML mặc định, không preview). Làm editor trực quan để chủ sân tự cấu hình dễ.

## Yêu cầu (acceptance criteria)
- [ ] **Giờ mở cửa**: editor **lưới theo tuần** (T2–CN), thêm/sửa khung giờ trực quan; hiện overlap rõ (backend đã chặn overlap — hiển thị lỗi đẹp).
- [ ] **Bảng giá**: bảng theo **dải giờ + ngày** (thường/giờ vàng/cuối tuần), thêm dòng dễ, `formatVND`; hiện priority/tie rõ.
- [ ] **Branding**: **uploader shadcn** (không input thô) + **preview logo** + **live preview** trang khách + hiện **URL công khai** có nút copy; color picker; chỉ nhận png/jpg (SVG đã chặn — giữ).
- [ ] Controller chỉ định hình đọc + giữ validation/ownership sẵn có (không nới lỏng tenant scope / mass-assignment guard).
- [ ] Dùng component nền + empty state + toast khi lưu.

## Ngoài phạm vi
- Không đổi logic pricing/opening/reconcile. Không đổi $fillable/guard.

## Verification
- [ ] `npm run build` pass · `php artisan test` (đụng 3 controller) giữ xanh
- [ ] Browser: sửa giờ/giá thấy phản hồi; upload logo thấy preview + URL copy; lưu ra toast.

## Nhật ký
- 2026-07-23 · created by manager
