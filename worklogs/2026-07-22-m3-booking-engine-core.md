# 2026-07-22 — M3 (lõi): Booking engine — chống double-book

## Overview
Phần khó nhất & quan trọng nhất: `BookingService` là điểm hẹp concurrency DUY NHẤT, chống double-book bằng **Postgres exclusion constraint** (không check-then-act). Giữ tạm (hold + TTL), vòng đời confirm/cancel/expire, và **vertical driver dispatch** (docs/08 §0). Test concurrency viết TRƯỚC service — và xanh trên Postgres thật.

## Files Changed
| File | Change |
|------|--------|
| `..._add_vertical_to_tenants_table.php` | `tenants.vertical` (default racket_court) — chọn engine/UI |
| `..._create_customers_table.php` | khách cuối (unique tenant+phone) |
| `..._create_bookings_table.php` | booking (uuid, code SAN-XXXX, status, hold_expires_at, snapshots, cancel_policy jsonb, reminded_at) |
| `..._create_booking_slots_table.php` | **`DB::statement` btree_gist + `EXCLUDE no_double_book`** trên `(tenant_id, court_id, tstzrange) WHERE hold_status IN (holding,committed)` |
| `app/Enums/{BookingStatus,HoldStatus,PaymentMode,BookingChannel,CancelReason}.php` | enums vòng đời |
| `app/Exceptions/SlotTakenException.php` | 23P01 → 409 |
| `app/Contracts/InventoryDriver.php` | interface hold/release/commit |
| `app/Services/Booking/Drivers/ResourceTimeSlotDriver.php` | bắt `QueryException 23P01` → SlotTakenException |
| `config/booking.php` | **registry vertical→mode→driver + ui** (thêm golf = thêm 1 dòng) |
| `app/Services/Booking/BookingService.php` | createHold (1 transaction) · release · confirmDeposit · markPaymentOrphaned · cancel · markNoShow · expireStaleHolds |
| `app/Events/{BookingConfirmed,BookingCancelled}.php` | cho M5 (ZNS) |
| `app/Jobs/ExpireStaleHolds.php` + `routes/console.php` | Scheduler mỗi phút nhả hold hết hạn |
| `app/Models/{Customer,Booking,BookingSlot}.php` | models |
| `tests/Feature/Booking/NoDoubleBookTest.php` | 5 test concurrency |
| `tests/Feature/Booking/BookingLifecycleTest.php` | 3 test confirm/expire/cancel |

## Key Decisions
1. **Exclusion constraint là trọng tài** — driver bắt SQLSTATE `23P01`, ném `SlotTakenException`; transaction rollback → không booking mồ côi. KHÔNG có đường chống-trùng thứ hai.
2. **Đặt lẻ và (sau này) series đi chung `booking_slots`** — một cơ chế duy nhất.
3. **Vertical dispatch qua config** — `BookingService::driverFor()` đọc `tenant.vertical` → mode → driver. Phase 1 chỉ `racket_court`/`ResourceTimeSlotDriver`; golf/capacity là cửa chừa (config comment sẵn).
4. **deposit_amount tạm = total** — chính sách cọc tinh chỉnh ở M4; cancel_policy_snapshot dùng default 24h/100% tới khi có config tenant.

## Verification
- [x] `php artisan migrate`: 4 bảng + extension btree_gist + constraint no_double_book ✓
- [x] `php artisan test`: **42/42 passed** trên **PostgreSQL** (8 test booking mới)
  - overlap cùng sân → SlotTakenException ✓ · không booking mồ côi ✓ · adjacent `[)` OK ✓ · released tái đặt ✓ · snapshot giá + TTL ✓ · confirm commit + event ✓ · expire nhả slot + tái đặt ✓ · cancel nhả + event ✓
- [x] `npm run build`: pass · `pint --test`: pass

## Handoff Notes
- **Còn lại của M3** (task 4 & 6): `AvailabilityService::search()` (compute-on-read đa sân: opening − blackout − slot busy) và `SeriesService` + migration `recurring_series` + `GenerateSeriesOccurrences` job (đặt cố định). `bookings.series_id` đã có (nullable, FK thêm khi có bảng series).
- **Concurrency test hiện là tuần tự** (chèn slot chồng → 23P01) — chứng minh constraint là trọng tài. Test 2-connection song song thật là nice-to-have, có thể thêm sau.
- Driver dispatch sẵn sàng cho golf: thêm `CapacitySessionDriver` + 1 dòng `config/booking.php`.

## Status
✅ Completed (lõi concurrency + hold + dispatch) — trái tim M3 xong & test. ⚠️ Còn AvailabilityService + SeriesService (đặt cố định). Đây là phần lớn nhất; nên tách increment.
