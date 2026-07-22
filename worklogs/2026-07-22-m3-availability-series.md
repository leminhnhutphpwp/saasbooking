# 2026-07-22 — M3 (phần cuối): Availability + Đặt cố định

## Overview
Hoàn tất M3: `AvailabilityService` (compute-on-read đa sân) và `SeriesService` (đặt cố định hàng tuần) sinh buổi qua đúng `BookingService` (một đường chống-trùng). Cùng job cuốn chiếu `GenerateSeriesOccurrences`.

## Files Changed
| File | Change |
|------|--------|
| `..._create_recurring_series_table.php` | `recurring_series` (snapshot giá/cọc, end_date hữu hạn, generated_through cursor) + composite FK `bookings.series_id` |
| `app/Enums/SeriesStatus.php` | active/ended/cancelled |
| `app/Models/RecurringSeries.php` | model (uuid, Auditable, casts) |
| `..._add_vertical_to_tenants` (M3 core) | (đã có) — series dùng driver dispatch |
| `app/Services/Booking/AvailabilityService.php` | `search()` compute-on-read: opening − blackout − slot busy; cắt slot theo duration |
| `app/Services/Booking/SeriesService.php` | `create()` (chụp giá, sinh horizon 4 tuần, trả conflicts), `cancelOccurrence()`, `extendHorizon()` |
| `app/Services/Booking/SeriesResult.php` | DTO {series, generated, conflicts} |
| `app/Services/Booking/BookingService.php` | `createHold` nhận `price_snapshot` override (series dùng giá đã chụp) |
| `app/Jobs/GenerateSeriesOccurrences.php` + `routes/console.php` | Scheduler hằng ngày |
| `tests/Feature/Booking/SeriesTest.php` | 3 test (sinh 4 buổi confirmed, hủy 1 buổi không ảnh hưởng, conflict ghi nhận) |
| `tests/Feature/Booking/AvailabilityTest.php` | 2 test (trừ slot busy, cắt theo duration) |

## Key Decisions
1. **Series occurrences confirm ngay** (owner đặt cố định = booking đã chốt) → committed, không bị sweeper hết-hạn. Cọc/thanh toán từng buổi tinh chỉnh ở M4.
2. **Conflict không làm hỏng series** — buổi trùng slot → ghi vào `conflicts`, các buổi khác vẫn sinh.
3. **Rolling horizon 4 tuần** + `generated_through` cursor; job cuốn chiếu sinh tiếp (docs/11 #5 — không sinh vô hạn).
4. **Timezone (Phase 1 single-tz):** Laravel lưu timestamptz theo **wall-clock-as-UTC** nhất quán (format không offset). Availability parse opening window cùng quy ước → khớp. Exclusion constraint vẫn đúng vì mọi ghi cùng convention. Multi-tz/DST là việc sau (docs/11 #3).

## Bug fixed (đáng ghi nhớ)
**Arrow function `fn()` bắt biến theo GIÁ TRỊ** — `->each(fn ($s) => $busy[] = ...)` không mutate `$busy` ngoài (luôn rỗng) → availability trừ sai. Đổi sang `foreach`. (Regular closure `use (&$x)` thì OK — như trong expireStaleHolds/extendHorizon.)

## Verification
- [x] `php artisan migrate`: recurring_series + FK ✓
- [x] `php artisan test`: **47/47 passed** trên PostgreSQL (thêm 5 test M3-cuối)
  - series sinh 4 buổi confirmed ✓ · hủy 1 buổi, series active + buổi khác nguyên ✓ · date trùng → conflict, 3 buổi kia vẫn sinh ✓ · availability trừ slot busy → 2 khoảng trống ✓ · cắt duration ✓
- [x] `npm run build`: pass · `pint --test`: pass

## Status
✅ Completed — M3 XONG hoàn toàn (concurrency + hold + availability + đặt cố định). Sẵn sàng M4 (Payment: cọc VietQR + đối soát).
