# 05 — Bản đồ Module

Ngách gọn hơn platform nhiều: **7 module** thay vì 11 (bỏ builder + metering phức tạp; giữ một lớp `interop` gọn thay cho gateway đồ sộ). Vẫn giữ nguyên tắc: **modular monolith trên 1 Postgres**, ranh giới là ranh giới *logic* với quy ước sở hữu dữ liệu.

> **Hiện thực (theo khuôn mẫu appdhv):** mỗi "module" = một nhóm **Model + Service + Controller + Job** trong Laravel, không phải package. Cách ly tenant bằng `App\Support\WorkingTenant` (như `WorkingSchool` của appdhv). Thiết kế chi tiết + giao diện công khai (PHP) ở [`08-thiet-ke-module-chi-tiet.md`](08-thiet-ke-module-chi-tiet.md).

Quy ước: **OWNS** = bảng chỉ module này được INSERT/UPDATE · **REFERENCES** = chỉ đọc / giữ FK-snapshot · giao tiếp ghi chéo module đi qua hàm module chủ hoặc **domain event (queued listener `afterCommit`)**.

| # | Module | Trách nhiệm duy nhất | OWNS | REFERENCES | Phase |
|---|--------|---------------------|------|------------|-------|
| 1 | **identity** | Chủ sân, nhân viên, phân quyền, phiên; mỗi tenant = một cơ sở | `tenants`, `users`, `memberships` | `plan_id` | **1** |
| 2 | **court-catalog** | Sân, loại sân, giờ mở cửa, ngày nghỉ, **bảng giá giờ vàng/thường** | `courts`, `opening_rules`, `blackouts`, `pricing_rules` | — | **1** |
| 3 | **booking** | Nguồn sự thật về "sân còn trống"; đặt một lần + **đặt cố định**; giữ chỗ; máy trạng thái | `customers`, `bookings`, `booking_slots`, `recurring_series` | `courts` (giữ chỗ *qua exclusion constraint*), `payment_id` | **1** |
| 4 | **payment** | Cọc VietQR, hộp thư đối soát ngân hàng (Casso/SePay), hoàn cọc | `payments`, `bank_txn_inbox`, `refunds`, `tenant_bank_config` | `booking_id` | **1** |
| 5 | **notification** | Zalo ZNS (xác nhận + nhắc) + email dự phòng, retry | `notification_templates`, `zalo_oa_config` | nghe domain event qua `afterCommit`, `bookings`, `customers` | **1** |
| 6 | **interop / embed** | Cắm booking engine vào **mọi mặt tiền** (Zalo, WordPress, Wix, web AI-build): API công khai + widget nhúng + plugin WP + webhook ra | `api_keys`, `webhook_endpoints`, `webhook_deliveries` | gọi **giao diện công khai của `booking`**, không SQL riêng | 2 |
| 7 | **billing** | Gói thuê phần mềm flat, subscription của chủ sân | `plans`, `subscriptions`, `invoices` | — | 2 |
| — | **hạ tầng** | Audit + domain events (Phase 1: Laravel `afterCommit`; `event_outbox` là Phase 2) | `audit_logs` | mọi module phát event của mình | **1** |

## Biện minh ranh giới

**`court-catalog` ≠ `booking`** — "Sân nào, giá bao nhiêu, mở giờ nào" thay đổi theo chủ sân (marketing, mùa vụ); "sân còn trống lúc nào" thay đổi theo thời gian thực + concurrency. Tách để sửa giá không đụng tới lock lịch. Giá được **chụp snapshot** vào `booking_slots` lúc đặt.

**`booking` là điểm hẹp concurrency duy nhất** — Mọi việc "xin giữ một khung giờ trên một sân" đi qua đúng một chỗ (`BookingService::createHold()` / `release()`), nơi exclusion constraint của Postgres làm trọng tài chống chồng lịch. Đặt cố định cũng sinh ra các `booking_slots` đi qua đúng cơ chế này — không có đường tắt. (`hold()` là method của `InventoryDriver` bên dưới.)

**`payment` ≠ `booking`** — Webhook đối soát từ Casso/SePay đến bất đồng bộ, có thể trùng, có thể trễ. Payment phải idempotent độc lập, chỉ gọi `booking.confirmDeposit()` / `booking.markPaymentOrphaned()` — không "hiểu" nghiệp vụ đặt sân.

**`notification` tách riêng** — Zalo ZNS có template phải duyệt trước, có hạn mức, có thể lỗi/retry. Cô lập để lỗi gửi tin không kéo theo lỗi đặt sân; nghe domain event qua **queued listener `afterCommit`** (Horizon) để gửi bất đồng bộ. (`event_outbox` chỉ dùng ở Phase 2 cho webhook ra ngoài.)

**`interop` là mặt tiền, không phải đường tắt** — Đây là lời giải cho câu hỏi "kết hợp WordPress": biến `booking` thành cái não đặt sân **cắm được vào mọi mặt tiền** (Zalo, WordPress, Wix, Fanpage, web AI-build) qua API công khai + widget + plugin. Nó **chỉ gọi giao diện công khai của `booking`**, không có SQL riêng chạm bảng lõi — nên mọi mặt tiền chia sẻ đúng một nguồn chống-trùng, một nguồn tiền. Đây **không phải builder**: ta không đi dựng trang (thứ AI/WordPress đã cho không), ta bán backend họ không build được và cắm vào trang của họ. Chi tiết [`08`](08-thiet-ke-module-chi-tiet.md#6-interop--embed--lời-giải-cho-wordpress-không-phải-builder).

**`billing` tối giản, Phase 2** — Giá thuê phần mềm flat theo số sân. Không đo lượt đặt (đó là metered — sai người mua). Giai đoạn đầu thu chuyển khoản + invoice tay, chưa cần module.

## So với bản platform (đã archive)

Bỏ hẳn: `builder` (kéo-thả tự do — commodity), `template` đồ sộ (chỉ cần seed 1–2 mẫu sân), `inventory` tách riêng (gộp vào `court-catalog` + `booking`), `metering` (thay bằng `billing` flat). **Giữ lại dạng gọn:** `gateway` → thu về `interop` (một API + widget + plugin, không phải cả cổng developer). → Vẫn ít hơn ~4 module và ~½ độ phức tạp so với platform.
