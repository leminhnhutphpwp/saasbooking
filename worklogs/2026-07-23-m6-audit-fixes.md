# 2026-07-23 — M6 audit: fan-out review + fixes theo tầng

## Overview
Sau khi M6·3 (branding/opening/pricing/series/reconcile UI) được merge vào `main` từ nguồn khác, chạy **4 agent read-only song song** (invariant / correctness / security / test-coverage) để soi, tổng hợp báo cáo, người dùng duyệt phạm vi, rồi **4 agent fix theo cụm file rời** + **2 agent viết test**. Verify trên PostgreSQL thật, commit theo tầng.

## Kết quả
- Suite: **68 → 93 test, 93/93 xanh**, pint sạch.
- 4 invariant lõi (isolation, chokepoint, snapshot, refund-ledger) đã sạch từ trước; audit tập trung vào M6 controller layer + time.

## Files Changed (apps/app/)
| Tầng | File | Fix |
|------|------|-----|
| A time | `Services/Booking/{AvailabilityService,SeriesService}`, `Http/Controllers/Manager/CalendarController`, `Http/Controllers/Public/PublicBookingController`, `Jobs/SendBookingReminders` | Đồng nhất **wall-as-UTC** mọi write/read path (#1 BLOCKER, #9) |
| B pay | `Services/Payment/ReconcileService`, `Http/Controllers/Manager/ReconcileController`, `Services/Booking/BookingService`, migration `add_payment_id_to_bank_txn_inbox` | Reconcile recoverable + status state-machine + lock/23P01 (#2,#4,#5,#8) |
| C sec | `routes/{web,api}`, `bootstrap/app.php`, `Providers/AppServiceProvider`, `Http/Controllers/Manager/BrandingController` | throttle public/webhook, gate `can:access-manager`, chặn SVG (#3,#6,#7) |
| D cat | `Services/Catalog/PricingService`, `Http/Controllers/Manager/{PricingRuleController,OpeningRuleController,SeriesController}` | tiebreak giá, chặn overlap, series short-window guard (#11,#12) |
| E test | 11 file `tests/Feature/**` | +25 test phủ các fix + gap |

## Key Decisions
1. **Convention thời gian = wall-as-UTC, single-tz Phase 1** (app.timezone giữ UTC, không đụng serialize Postgres). Series/walk-in bị kéo về naive cho khớp public-hold + availability; so sánh `now()` dùng giờ-tường venue. Gốc BLOCKER: 2 write-path lệch nhau → slot đã đặt hiện "trống".
2. **Revert #10** (siết `$fillable`) — LOW/defense-in-depth, chưa exploit (controller không mass-assign request); fix đúng cần strict-mode + gán tường minh ~15 writer → tách task riêng. Để tránh vỡ NOT-NULL âm thầm.
3. **Policy #13**: giữ **giá theo giờ bắt đầu** (xác nhận có chủ đích, chỉ document).
4. Reconcile recovery: inbox ghi `processed_at=NULL`, chỉ finalize sau settle thành công → redelivery của txn chưa xử lý sẽ re-process (không mất cọc), txn đã xử lý vẫn confirm-once.

## Verification
- [x] `php artisan test` (PostgreSQL, DB_HOST=127.0.0.1): **93/93 passed**
- [x] `pint --test`: pass
- [x] Vite manifest rebuild (`npm run build`) — trang M6·3 (Branding/Reconcile) trước đó thiếu trong manifest cũ → 500; đã build lại.

## Handoff Notes
- **#10 còn nợ**: bật `Model::shouldBeStrict()` + chuyển writer sang gán tường minh, rồi mới bỏ money/status/tenant_id khỏi `$fillable`.
- Migration mới `bank_txn_inbox.status` + `payment_id`: đã chạy trên `san_test` (test xanh); **chạy `migrate` trên DB dev/prod** khi deploy.
- `storage/framework/{views,cache,sessions}` bị gitignore/untrack — môi trường mới phải `mkdir` (đã tạo local).
- Rate-limit values đặt trong `AppServiceProvider` (public-booking 30/IP + 120/venue, webhook 60/IP, api 60).

## Status
✅ Completed — nhánh `fix/m6-audit-findings`, 5 commit theo tầng, chờ push + PR.
