# 2026-07-23 — Design system foundation (đợt 1 UI)

## Overview
Đại tu UI đợt 1: **nền design system** cho toàn app (font, token màu, primitives, component dùng lại, formatters, toast), theo chuẩn SaaS hiện đại. Chưa redesign các màn feature (grid calendar, trang khách bán hàng, config) — đó là các đợt sau. Backend/nghiệp vụ KHÔNG đổi.

## Files Changed (apps/app/)
| Nhóm | File | Change |
|------|------|--------|
| Font | `resources/js/app.jsx`, `tailwind.config.js` | Be Vietnam Pro (self-host `@fontsource`), set default sans |
| Token | `resources/css/app.css` | Retune biến shadcn (light+dark), primary = emerald, radius 0.75rem |
| Primitives | `Components/ui/{table,tabs}.jsx` | Thêm (dep `@radix-ui/react-tabs`) |
| Toast | 3 Layout | Mount sonner `<Toaster>`; flash success/error → toast |
| Formatters | `lib/format.js` | `formatVND/Date/Time/DateTime/Weekday` (vi-VN, null-safe) |
| Component | `Components/{StatusBadge,PageHeader,StatCard,EmptyState}.jsx` | Dùng lại toàn app; StatusBadge map mọi enum→màu+nhãn VN |
| Theming | các Layout, `managerNav.jsx`, auth Components, trang Manager/Public | hardcode gray → token, ráp component mới |

## Key Decisions
1. **Primary = emerald** cho chrome app (màu tenant chỉ theme trang công khai — đợt sau). Dark mode qua biến.
2. **Giữ cấu trúc biến shadcn** khi retune → không vỡ component sẵn có.
3. Nhãn `payment.orphaned` = **"Mất chỗ"** (bỏ "Mồ côi").

## ⚠️ Đã revert phần agent làm VƯỢT PHẠM VI
Agent phụ tự sửa ngoài scope "design system" → tôi revert về `main`:
- `database/seeders/DatabaseSeeder.php` (viết lại toàn bộ demo data + tenant 2 + bank secret) — cần seed giàu hơn thì làm task riêng.
- `routes/web.php` (redirect `/dashboard`→calendar) — hợp lý nhưng ngoài phạm vi.
- `ApplicationLogo.jsx` + loạt `public/*.png/.ico/.webmanifest` (logo/PWA binary lạ) — không ship binary chưa duyệt; logo là quyết định thiết kế có chủ đích sau.

## Verification
- [x] `npm run build`: pass (rebuild sau revert)
- [x] Browser (owner@pickleball.vn): Lịch / Sân / Hoàn cọc / trang khách render đúng, font+màu mới, không vỡ.
- [ ] Chưa chạy PHP test (không đổi backend).

## Handoff Notes (đợt UI kế tiếp)
- **Grid calendar chủ sân** (lưới sân×giờ, block màu) — dùng StatusBadge/format sẵn.
- **Trang đặt của khách** mobile-first + branding tenant + slot có giá/trạng thái.
- **Config screens** (giờ/giá/branding) editor trực quan; Branding cần uploader shadcn + preview.
- Component nền sẵn: `PageHeader/StatCard/StatusBadge/EmptyState` + `lib/format`.

## Status
✅ Completed (đợt 1: nền) — nhánh `feat/design-system-foundation`.
