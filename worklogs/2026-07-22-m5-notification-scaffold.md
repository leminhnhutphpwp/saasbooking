# 2026-07-22 — M5: Notification (chuẩn bị, ráp Zalo sau)

## Overview
Dựng sẵn hạ tầng thông báo (theo yêu cầu "chuẩn bị sẵn, ráp sau"): event → listener → Notification → **kênh Zalo ZNS qua adapter cắm-được**. Transport mặc định = **log/ghi bảng** (`notification_messages`); khi Zalo OA duyệt template, chỉ **đổi binding** sang HTTP transport, phần còn lại không đổi.

## Files Changed (apps/app/)
| File | Change |
|------|--------|
| `..._create_zalo_oa_configs_table.php` | config OA per-tenant (token encrypted, template ids) |
| `..._create_notification_messages_table.php` | log gửi + **de-dup nhắc lịch** `unique(booking_id, template)` |
| `Models/{ZaloOaConfig,NotificationMessage}.php` · `Customer` (+Notifiable, route zaloZns/mail) | |
| `Contracts/ZaloZnsTransport.php` · `Services/Notification/LogZaloZnsTransport.php` | interface + transport mặc định (ghi bảng + log, savepoint-dedup) |
| `Notifications/Channels/ZaloZnsChannel.php` | kênh tùy biến, uỷ thác transport |
| `Notifications/{BookingConfirmedNotification,BookingReminderNotification}.php` | `ShouldQueue`, `afterCommit` |
| `Listeners/SendBookingConfirmation.php` | nghe `BookingConfirmed` → notify khách |
| `Jobs/SendBookingReminders.php` + schedule (10') | nhắc 1 ngày / 2 tiếng, de-dup |
| `Providers/AppServiceProvider.php` | bind transport + `Event::listen(BookingConfirmed)` |
| `tests/Feature/Notification/NotificationTest.php` | 4 test |

## Key Decisions
1. **Transport cắm-được** — `ZaloZnsTransport` interface; Phase 1 dùng `LogZaloZnsTransport` (ghi `notification_messages`). Ráp Zalo = bind `HttpZaloZnsTransport` trong AppServiceProvider, không sửa gì khác.
2. **De-dup nhắc lịch bằng `unique(booking_id, template)`** — job re-run không gửi trùng; backstop cả ở transport (savepoint bắt 23505).
3. **`afterCommit` set trong constructor** (không khai property typed — xung đột trait `Queueable`).
4. **Test dùng `Notification::fake` + gọi transport trực tiếp** — tránh vướng afterCommit + RefreshDatabase (afterCommit không fire trong transaction test).

## Verification
- [x] `php artisan migrate`: 2 bảng ✓
- [x] `php artisan test`: **59/59 passed** (4 test M5)
  - listener confirm → notify khách ✓ · job nhắc gửi đúng booking sắp tới ✓ · không gửi lại nếu đã gửi ✓ · transport ghi + de-dup ✓
- [x] `pint --test`: pass

## Handoff Notes (ráp sau)
- **HTTP transport:** tạo `HttpZaloZnsTransport implements ZaloZnsTransport` (đọc `ZaloOaConfig`: access_token refresh, gọi ZNS API, map template key→template id), rồi `bind(ZaloZnsTransport::class, HttpZaloZnsTransport::class)`. Test/log transport giữ cho dev.
- **Email dự phòng:** `Customer::routeNotificationForMail` đã có; thêm `'mail'` vào `via()` khi khách chưa follow OA.
- **Timezone nhắc lịch:** slot lưu wall-as-UTC; khi go-live chỉnh cửa sổ theo tz tenant (docs/11 #3).
- **Đăng ký OA + nộp template ZNS** nên làm sớm (khâu duyệt chậm) — đúng cảnh báo rủi ro M0.

## Status
✅ Completed (scaffold) — pipeline chạy end-to-end với log transport, test xanh. Ráp HTTP Zalo = đổi 1 binding. Sang M6 (UI).
