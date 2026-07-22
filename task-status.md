# Task Status — SÂN (court booking)

> Cập nhật: 2026-07-22 · Branch `main` · **BUILD phase**
> Điểm vào nhanh cho phiên mới: đọc file này → `CLAUDE.md` (invariant) → `AGENTS.md` (điều hướng). Chi tiết từng milestone ở `worklogs/`.

## Tiến độ milestone (roadmap `docs/12-lo-trinh.md`)

| MS | Nội dung | Trạng thái | Commit | Worklog |
|----|----------|-----------|--------|---------|
| M0 | Scaffold + Docker (PG/Redis) + Auditable + CI | ✅ | `7432134` | `worklogs/2026-07-22-m0-setup.md` |
| M1 | Identity + `WorkingTenant` (cách ly tenant) | ✅ | `72c0c2c` | `…-m1-identity-tenant.md` |
| M2 | Court-catalog + giá giờ vàng/thường | ✅ (lõi) | `b617f3d` | `…-m2-court-catalog.md` |
| M3 | Booking engine — chống double-book + availability + đặt cố định | ✅ | `319989b`, `3ddb93f` | `…-m3-booking-engine-core.md`, `…-m3-availability-series.md` |
| M4 | Payment — cọc VietQR + đối soát 3 nhánh + idempotency | ✅ (lõi) | `88cb567` | `…-m4-payment-vietqr-reconcile.md` |
| M5 | Notification — Zalo ZNS scaffold (ráp HTTP sau) | ✅ (scaffold) | `d0f270e` | `…-m5-notification-scaffold.md` |
| M6 | UI — trang đặt sân công khai + dashboard chủ sân | 🔄 phần 1+2 xong | `c22f676`, (M6·2) | `…-m6-public-booking-page.md`, `…-m6-manager-dashboard.md` |
| M7 | Hardening + go-live | ⬜ chưa | — | — |

Cơ sở hạ tầng khác: monorepo `apps/app/` (`8b19f4f`), container `saasbooking-<service>-1` (`98fe968`).

## Đang chạy end-to-end (đã test)
Khách mở link sân → chọn ngày → sân trống + giờ (giá giờ vàng) → nhập tên/SĐT → **giữ chỗ** (chống double-book bằng exclusion constraint) → **QR VietQR cọc** → chuyển khoản → webhook **đối soát tự động** (confirm/grace/orphaned) → trang tự đổi "Đã xác nhận".

Chủ sân: xem lịch theo ngày, **đặt hộ khách vãng lai (tiền mặt)** → confirmed ngay, **hoàn cọc một chạm**.

**Test: 65/65 xanh trên PostgreSQL** · pint sạch · build xanh.

## Việc còn lại
- **M6 phần 2 (lớn):** dashboard chủ sân — lịch lưới sân×giờ, đặt hộ khách vãng lai (tiền mặt), quản lý đặt cố định, hoàn cọc một chạm, màn đối soát tay, cấu hình sân/giá/giờ mở/thương hiệu (gom nợ UI M2/M4). Playwright E2E. Branding template trang công khai.
- **M7:** hardening + go-live.
- **Ráp sau:** HTTP Zalo ZNS transport (đổi 1 binding — M5), gateway VNPay/MoMo (Phase 2), true multi-tz (docs/11 #3).

## Chạy dev
```bash
cd apps/app && cp .env.example .env && php artisan key:generate    # lần đầu
docker compose up -d                                               # từ root
docker compose exec app php artisan migrate
docker compose exec app php artisan test                          # hoặc local: DB_HOST=127.0.0.1 php artisan test
```
