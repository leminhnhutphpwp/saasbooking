# 12 — Lộ trình & Plan triển khai chi tiết

Mỗi phase có **kill criteria** rõ ràng để không đốt thời gian vào thứ thị trường đã từ chối. Phần lộ trình kinh doanh (Phase 0→3) ở trên; **Plan triển khai chi tiết Phase 1** (WBS, test, CI/CD, seed, rủi ro) ở cuối file.

---

## Phase 0 — Validation, KHÔNG CODE (3–4 tuần)

- Đến **10–15 sân pickleball/cầu lông** (bắt đầu từ khu bạn ở). Gặp trực tiếp chủ sân.
- Hỏi đúng 4 câu: (1) đang nhận đặt sân + thu cọc thế nào? (2) bom sân mấy lần/tuần, mất bao nhiêu tiền? (3) quản lý khách đặt cố định ra sao, có nhầm/chồng lịch không? (4) một tháng chịu trả bao nhiêu cho công cụ giải việc này?
- **Bán tay (concierge):** nhận đặt hộ 2–3 sân qua Zalo OA + Google Calendar + QR VietQR của chính chủ sân; bạn đối soát tay. Thu phí thật 200–300k/tháng.
- ❌ **Kill: <3/15 chủ sân đồng ý trả tiền trước → dừng, hoặc đổi cộng đồng (bóng đá mini/tennis).**

## Phase 1 — MVP một cộng đồng (2–2,5 tháng; chỉ nếu Phase 0 đạt)

Module: identity · court-catalog · booking · payment(VietQR) · notification(Zalo). Xem [`05-module-map.md`](05-module-map.md).

- Đặt sân lẻ + **đặt cố định hàng tuần**.
- **Cọc VietQR + đối soát tự động** (Casso/SePay).
- Giá **giờ vàng/thường**, **nhiều sân** song song.
- **Zalo ZNS** xác nhận + nhắc trước 1 ngày / 2 tiếng.
- Lịch chủ sân trên điện thoại: đặt hộ khách vãng lai (tiền mặt), hoàn cọc một chạm.
- Giá thuê **flat** theo số sân (ví dụ 199k ≤4 sân / 399k >4 sân), thu chuyển khoản + invoice tay.
- **Onboarding tận tay:** bạn tự setup từng sân (khai sân, giờ mở, bảng giá, nối Zalo OA + Casso).
- ❌ **KHÔNG:** builder, headless API, metered, cổng thanh toán.
- ❌ **Kill: 3 tháng bán tích cực <8 sân trả phí, hoặc churn >8%/tháng → dừng.**

## Phase 2 — Củng cố + ngách thứ hai (3–4 tháng; nếu ≥8–10 sân, churn <5%)

- **Referral trong cộng đồng** (sân giới thiệu sân) — kênh phân phối rẻ nhất.
- Cảnh báo **khách hay bom**, báo cáo doanh thu theo sân/giờ vàng, quản lý series nâng cao.
- Module `billing` flat tự động (subscription + invoice).
- **Ngách thứ hai dùng chung engine:** sân bóng đá mini / tennis / pickleball khác vùng — hoặc bắt đầu chạm nail/spa (thêm lớp thợ × dịch vụ lên engine sẵn có).
- Thuê 1 bạn support Zalo part-time.
- ✅ **Continue: ~30 khách trả phí, MRR ≥10tr, churn <4%.**

## Phase 3 — Bề rộng (6+ tháng; nếu 30–50 khách ổn định)

- Zalo Mini App đầy đủ, chương trình khách quen của sân.
- Thêm vertical (vd capacity/golf) và headless API cho agency.
- (Cổng thanh toán VNPay/MoMo là **Phase 2 nếu cần** — khớp [`01-san-pham.md`](01-san-pham.md)/[`02-yeu-cau-chuc-nang.md`](02-yeu-cau-chuc-nang.md); VietQR + đối soát đủ cho cọc.)

---

## 5 quyết định nâng xác suất nhiều nhất

1. **Một cộng đồng trước** (pickleball/cầu lông), không "đa ngách từ đầu".
2. **Bán trước khi code** — concierge cho 2–3 sân; Phase 0 fail = tiết kiệm nhiều tháng.
3. **Cọc VietQR + Zalo là lời hứa "hết bom sân"**, không phải danh sách tính năng.
4. **Nhúng trong Zalo + phân phối qua cộng đồng** là moat, không phải công nghệ.
5. **Giá flat + setup tận tay** — support Zalo tận tình là kênh sales rẻ nhất.

---

## Stack (theo khuôn mẫu appdhv — Laravel + Inertia)

**PHP · Laravel 13 + Inertia 2 + React 18 · PostgreSQL · Horizon queue · 1 VPS + Docker.**

> Chọn stack này vì bạn đã có sẵn khuôn mẫu chạy được (`appdhv`) và quen tay — đúng nguyên tắc "monolith nhàm chán, một người vận hành được". Kiến trúc database ([`06-erd.md`](06-erd.md)) **không đổi** vì nó nằm ở tầng Postgres; chỉ tầng app dùng Laravel.

| Thành phần | Lựa chọn (theo appdhv) | Lý do |
|---|---|---|
| App | **Laravel 13 + Inertia 2 + React 18** (Vite) — controller trả `Inertia::render(...)`, data vào thẳng props, **không cần API cho dashboard** | Một monolith, đỡ tầng API, quen tay |
| DB | **PostgreSQL** (appdhv cũng `pgsql`) | Exclusion constraint chống double-book + RLS chỉ có ở Postgres |
| ORM / migration | **Eloquent** + migration Laravel; raw SQL qua `DB::statement` cho `btree_gist`, `EXCLUDE`, RLS | Model + migration là tài liệu sống của ERD |
| Queue / nền | **Laravel Queue + Horizon** (job hết-hạn-giữ-tạm, cuốn chiếu series, nhắc ZNS, webhook ra) + **Scheduler** cho job định kỳ | Thay pg-boss; đã có sẵn Horizon trong appdhv |
| UI | **shadcn/ui + Radix + Tailwind + lucide-react** (đã có `components.json`) | Bộ component sẵn, mobile-first |
| Auth / route | **Breeze** (scaffold Inertia+React) + **Ziggy** (route sang JS) + **Sanctum** (token cho embed API Phase 2) | Có sẵn trong khuôn mẫu |
| Đối soát | **SePay** (mặc định) hoặc Casso — webhook → `bank_txn_inbox`; khớp `memo`=booking.code | Instant, phí ~0 |
| Zalo | **Zalo OA + ZNS** qua Laravel Notification (queued); email dự phòng | Kênh khách đang ở sẵn |
| Admin nền tảng | **Filament 5.7+** (đã có trong appdhv) — quản tenant/plan (tùy chọn) | Panel admin dựng nhanh; **dùng bản mới nhất ≥5.7** vì Form/Table đã được cải thiện hiệu năng |
| Hosting | **Docker Compose** (theo appdhv) + Caddy/nginx trên 1 VPS | Endpoint webhook ổn định + Horizon chạy nền |

**Vì sao theo khuôn mẫu:** tận dụng lại đúng pattern của appdhv — `WorkingTenant` (như `WorkingSchool`) để cách ly tenant, trait `Auditable` cho audit log, model `id` + `uuid` (route key), Horizon cho queue. Một người vận hành: sự cố 2h sáng debug bằng `psql` + `php artisan` + log Horizon.

## Cấu trúc thư mục Phase 1 (chuẩn Laravel, theo appdhv)

```
app/
  Enums/                 # BookingStatus, PaymentStatus, HoldStatus, CourtType (PHP enum)
  Support/
    WorkingTenant.php    # NGUỒN DUY NHẤT quyết định request thuộc cơ sở nào (như WorkingSchool)
  Http/Middleware/
    ResolveWorkingTenant.php
    HandleInertiaRequests.php   # share auth + flash + workingTenant
  Models/
    Concerns/Auditable.php      # tái dùng nguyên từ appdhv
    Tenant.php Court.php OpeningRule.php Blackout.php PricingRule.php
    Customer.php Booking.php BookingSlot.php RecurringSeries.php
    Payment.php BankTxnInbox.php Refund.php
  Services/
    Booking/BookingService.php     # hold()/release() — điểm hẹp concurrency
    Booking/AvailabilityService.php # compute-on-read nhiều sân
    Booking/SeriesService.php       # sinh buổi cuốn chiếu
    Payment/ReconcileService.php    # đối soát SePay/Casso, 3 nhánh
    Catalog/PricingService.php      # resolve giá giờ vàng/thường
  Jobs/
    ExpireStaleHolds.php GenerateSeriesOccurrences.php SendBookingReminders.php
  Http/Controllers/
    Manager/                 # dashboard chủ sân (Inertia)
    Public/BookingController.php   # trang đặt sân + tạo hold
    Webhook/BankReconcileController.php  ZaloWebhookController.php
database/migrations/         # gồm DB::statement cho btree_gist + EXCLUDE no_double_book + RLS
resources/js/
  Pages/Manager/ Pages/Public/     # component Inertia (khớp Inertia::render)
  Layouts/ components/ (shadcn) lib/
routes/ web.php (+ Inertia) · api.php (webhook + embed Phase 2)
tests/Feature/                # test concurrency exclusion + idempotency đối soát (PHPUnit/Pest)
docs/                         # bộ tài liệu này
```

---

# Plan triển khai chi tiết (Phase 1)

Mục tiêu Phase 1: MVP đặt sân pickleball/cầu lông chạy thật cho 1 cộng đồng, ~2–2,5 tháng solo full-time. Chia thành 8 milestone tuần tự (M0→M7); mỗi milestone có task, phụ thuộc, **Definition of Done (DoD)**, ước lượng.

> Nguyên tắc build bám khuôn mẫu `appdhv`: Breeze auth → `WorkingTenant` + `ResolveWorkingTenant` → migration (Eloquent + `DB::statement` cho phần Postgres đặc thù) → Service (nghiệp vụ) → Controller trả `Inertia::render` → Pages React + shadcn. Model dùng `id` bigint + `uuid` route key, `SoftDeletes`, trait `Auditable`. Việc nền qua Horizon; job định kỳ qua Scheduler.

## Bảng milestone tổng quan

| MS | Tên | Ước lượng | Phụ thuộc |
|----|-----|-----------|-----------|
| M0 | Khởi tạo dự án + hạ tầng | 3–4 ngày | — |
| M1 | Identity + Multi-tenant (`WorkingTenant`) | 4–5 ngày | M0 |
| M2 | Court-catalog (sân, giờ mở, giá giờ vàng) | 4–5 ngày | M1 |
| M3 | **Booking engine** (availability, hold, series) | 10–12 ngày | M2 |
| M4 | Payment — cọc VietQR + đối soát SePay | 7–9 ngày | M3 |
| M5 | Notification — Zalo ZNS xác nhận + nhắc | 4–5 ngày | M3, M4 |
| M6 | Giao diện chủ sân + trang đặt sân công khai | 10–12 ngày | M3, M4 |
| M7 | Hardening + go-live | 5–6 ngày | tất cả |

Đường găng (critical path) là **M3 → M4 → M6**. Zalo ZNS (M5) và SePay sandbox (M4) có khâu duyệt/đăng ký bên thứ ba — **khởi động thủ tục ngay từ M0** (xem Rủi ro triển khai).

---

## M0 — Khởi tạo dự án + hạ tầng (3–4 ngày)

**Task:**
1. `composer create-project laravel/laravel` (Laravel 13) hoặc clone khung từ `appdhv` (giữ Breeze/Inertia/Horizon/Filament/shadcn có sẵn).
2. Cài Inertia 2 + React 18 + Vite, Breeze (stack React), Ziggy, Sanctum, Horizon, `spatie/laravel-permission`, shadcn/ui + Tailwind + lucide-react.
3. Docker Compose theo `appdhv`: `app` (php-fpm), `db` (postgres 16), `redis` (queue Horizon), `nginx`/caddy, `vite`.
4. `.env`: `DB_CONNECTION=pgsql`, `QUEUE_CONNECTION=redis`, tách `.env.example`.
5. CI cơ bản: `pint` (format), `phpunit`/pest chạy trên Postgres, `vite build`.
6. Bê nguyên `app/Models/Concerns/Auditable.php` + bảng `audit_logs` từ appdhv.

**DoD:** `docker compose up` chạy; trang Breeze login hiển thị; `php artisan test` xanh (0 test thật); Horizon dashboard mở được; CI chạy.

## M1 — Identity + Multi-tenant (4–5 ngày)

**Task:**
1. Migration `tenants` (id, uuid, name, slug UNIQUE, timezone default 'Asia/Ho_Chi_Minh', status), `users` thêm `tenant_id` nullable, `memberships` (nếu tách vai trò).
2. Model `Tenant`, sửa `User` (thêm `tenant_id`, `isGlobalOperator()`), role qua `spatie` (`super_admin`, `owner`, `staff`).
3. `app/Support/WorkingTenant.php` — **port từ `WorkingSchool`**: `resolve()` kẹp cứng non-operator vào `users.tenant_id`, super_admin chuyển tự do; `id()`, `switchable()`.
4. `ResolveWorkingTenant` middleware + `HandleInertiaRequests::share` (auth, flash, workingTenant, workingTenantId).
5. (Tùy chọn, khuyến nghị) RLS: migration `DB::statement` bật policy `tenant_id = current_setting('app.tenant_id')`; middleware `SET LOCAL app.tenant_id`.
6. Feature test: user non-operator KHÔNG đọc được dữ liệu tenant khác kể cả khi forge `?tenant_id`.

**DoD:** đăng nhập ra đúng tenant; `WorkingTenant::id()` trả đúng; test cách ly tenant xanh.

## M2 — Court-catalog (4–5 ngày)

**Task:**
1. Migration + Model: `courts` (uuid, tenant_id, name, court_type enum, status, SoftDeletes), `opening_rules` (weekday[], open/close local, tz, effective_from/to), `blackouts` (period tstzrange), `pricing_rules` (weekday[], start/end local, price_per_hour bigint, priority). Xem [`06-erd.md`](06-erd.md).
2. `Enums/CourtType`, `App\Enums` cho status.
3. `Services/Catalog/PricingService::resolve()` (luật ưu tiên) + `Services/Catalog/CatalogService::openingWindows()` (khớp [`08-thiet-ke-module-chi-tiet.md`](08-thiet-ke-module-chi-tiet.md) §2).
4. `Manager/CourtController` (Inertia CRUD scope tenant) + Pages `Manager/Courts/Index`, form thêm/sửa sân, quản lý giờ mở + bảng giá.
5. Feature test `PricingService` (giờ vàng đè giờ thường, ưu tiên đúng).

**DoD:** chủ sân tạo/sửa sân + giờ mở + bảng giá qua UI; `PricingService::resolve` đúng theo test.

## M3 — Booking engine (10–12 ngày) — LÕI, phần khó nhất

**Task (theo thứ tự phụ thuộc):**
1. Migration `customers`, `bookings` (uuid, code, tenant_id, customer_id, series_id nullable, status enum, channel, hold_expires_at, total/deposit_amount, payment_mode, cancel_policy_snapshot jsonb), `booking_slots` (court_id, start_at, end_at, price_snapshot, hold_status).
2. **Migration `DB::statement`**: `CREATE EXTENSION btree_gist` + `EXCLUDE no_double_book` (xem [`06-erd.md`](06-erd.md)). **Viết test concurrency TRƯỚC khi viết service.**
3. `Enums/BookingStatus`, `HoldStatus`, `CancelReason`.
4. `Services/Booking/AvailabilityService::search()` — compute-on-read đa sân (opening − blackout − slot holding/committed), cache 30–60s.
5. `Services/Booking/BookingService`: `createHold()` (DB::transaction; bắt SQLSTATE 23P01 → `SlotTakenException`), `release()`, `confirmDeposit()`, `markPaymentOrphaned()`, `cancel()`, `markNoShow()`.
6. `Services/Booking/SeriesService`: `create()` (chụp giá/cọc, sinh buổi horizon 4 tuần qua `createHold`, trả conflicts), `cancelOccurrence()`.
7. `Jobs/ExpireStaleHolds` (Scheduler mỗi phút), `Jobs/GenerateSeriesOccurrences` (Scheduler hằng ngày).
8. Events `BookingConfirmed`/`BookingCancelled` (cho M5).

**DoD:** test concurrency xanh (2 request song song → 1 giữ, 1 nhận 409); series sinh đúng + hủy 1 buổi không ảnh hưởng buổi khác; hold hết hạn tự nhả; xem [`10-tinh-huong-phat-sinh.md`](10-tinh-huong-phat-sinh.md) & [`11-diem-vo.md`](11-diem-vo.md).

## M4 — Payment: cọc VietQR + đối soát (7–9 ngày)

**Task:**
1. Migration + Model: `payments` (uuid, tenant_id, booking_id, method, amount, status, memo_ref, bank_txn_id UNIQUE, matched_at), `bank_txn_inbox` (provider, bank_txn_id UNIQUE, amount, memo), `refunds`, `tenant_bank_config` (số TK, ngân hàng, cấu hình SePay).
2. `PaymentService::initDeposit()` — sinh QR VietQR (chuẩn VietQR/napas, nội dung = `booking.code`).
3. `Services/Payment/ReconcileService::ingest()` — nhận webhook SePay/Casso → `bank_txn_inbox` (idempotent UNIQUE) → khớp `memo`→booking.code + amount → **3 nhánh** confirm/grace/orphaned+refund (xem [`07-luong-du-lieu.md`](07-luong-du-lieu.md) luồng a).
4. `Webhook/BankReconcileController` (xác thực chữ ký/token SePay).
5. Hoàn cọc: `requestRefund()` + màn hình "refund chờ xử lý" cho chủ sân (chuyển khoản tay, đánh dấu done).
6. Feature test: (a) idempotency webhook trùng; (b) 3 nhánh đối soát; (c) khớp sai số tiền → không auto-confirm.

**DoD:** đặt sân → QR → chuyển khoản sandbox → đối soát tự động confirm; webhook trùng không cộng đôi; test xanh.

## M5 — Notification: Zalo ZNS (4–5 ngày)

**Task:**
1. `Models/ZaloOaConfig`; adapter Zalo OA (access token refresh) + `ZaloZnsChannel`.
2. Laravel Notification (`ShouldQueue`, `$afterCommit=true`): `BookingConfirmedNotification`, `BookingReminderNotification`. Queued listener `afterCommit` cho event từ M3.
3. `Jobs/SendBookingReminders` (Scheduler mỗi 5–10 phút, quét booking confirmed sắp tới: nhắc trước 1 ngày + 2 tiếng, đánh dấu đã nhắc để không gửi lặp).
4. Email dự phòng (Resend/SES) khi khách chưa follow OA.
5. Test: gửi đúng thời điểm, không gửi trùng.

**DoD:** confirmed → ZNS xác nhận; job nhắc chạy đúng mốc, không lặp.

## M6 — Giao diện chủ sân + trang đặt sân (10–12 ngày)

**Task:**
1. **Trang đặt sân công khai** (`Public/BookingController` + Pages `Public/Booking`): chọn ngày/giờ → sân trống + giá → cọc → QR VietQR → trạng thái. Mobile-first, theo template có thương hiệu (logo/màu tenant). Xem [`03-giao-dien-quan-ly.md`](03-giao-dien-quan-ly.md) & [`04-cau-hinh-per-tenant.md`](04-cau-hinh-per-tenant.md).
2. **Dashboard chủ sân** (Manager): lịch lưới sân×giờ, đặt hộ khách vãng lai (tiền mặt), quản lý đặt cố định, hoàn cọc một chạm, cấu hình sân/giá/thương hiệu.
3. shadcn components (Dialog, Select, Popover, Calendar) + `lib/` helpers; Ziggy cho route.
4. Playwright E2E: luồng khách đặt sân end-to-end + chủ sân đặt hộ.

**DoD:** đặt sân trọn luồng qua UI thật (staging); chủ sân thao tác lịch + hoàn cọc; E2E xanh.

## M7 — Hardening + go-live (5–6 ngày)

**Task:**
1. Rà [`10-tinh-huong-phat-sinh.md`](10-tinh-huong-phat-sinh.md): xử lý các case còn hở (đổi giờ mở khi có booking, DST, khách bom liên tục...).
2. Rate limit webhook/booking công khai; log + Sentry; healthcheck.
3. Seed/demo data (xem dưới); onboarding script setup 1 sân < 15 phút.
4. Backup Postgres tự động + thử restore.
5. Checklist go-live (dưới).

**DoD:** deploy production; onboard được 1 sân thật; backup+restore đã thử.

---

## Chiến lược test (bám khuôn mẫu appdhv: PHPUnit/Pest + Playwright)

| Loại | File | Kiểm gì |
|---|---|---|
| Concurrency | `tests/Feature/Booking/NoDoubleBookTest.php` | 2 request song song cùng sân/giờ → đúng 1 thành công, 1 nhận 409 (exclusion constraint) |
| Idempotency | `tests/Feature/Payment/ReconcileIdempotencyTest.php` | webhook cùng `bank_txn_id` gửi 2 lần → chỉ confirm 1 lần, không cộng đôi |
| Đối soát 3 nhánh | `tests/Feature/Payment/ReconcileBranchesTest.php` | còn hạn→confirm; hết hạn+sân còn→grace; sân mất→orphaned+refund |
| Series | `tests/Feature/Booking/RecurringSeriesTest.php` | sinh buổi đúng horizon; hủy 1 buổi không đụng buổi khác; buổi vướng lịch → conflict |
| Tenant isolation | `tests/Feature/Tenant/IsolationTest.php` | non-operator forge `?tenant_id` không đọc được tenant khác |
| Pricing | `tests/Feature/Catalog/PricingResolveTest.php` | giờ vàng đè giờ thường theo priority |
| E2E | `tests/e2e/booking-flow.spec.js` (Playwright) | khách đặt sân → QR → (mock đối soát) → confirmed; chủ sân đặt hộ |

**Nguyên tắc:** Feature test chạy trên **PostgreSQL thật** (không SQLite) vì exclusion constraint/RLS là Postgres-only. Concurrency test dùng nhiều connection/transaction song song để chạm được race thật.

## CI/CD & Deploy

- **CI (mỗi push):** `pint --test` → `php artisan test` (Postgres service) → `npm run build`. Playwright ở nhánh chính/nightly.
- **Deploy:** Docker Compose trên 1 VPS (theo `appdhv`): container `app`, `db` (Postgres 16), `redis`, `nginx`/caddy (TLS on-demand cho subdomain sân), `horizon` (worker), `scheduler` (`php artisan schedule:work`). Deploy = `git pull` → `composer install --no-dev` → `php artisan migrate --force` → `npm run build` → `php artisan horizon:terminate` (Horizon tự khởi lại) → `php artisan config:cache`.
- **Backup:** cron `pg_dump` hằng ngày sang S3/object storage + `wal` nếu có; **thử restore định kỳ**.

**Checklist go-live Phase 1:**
- [ ] Migrate + RLS bật trên production.
- [ ] SePay production key + webhook URL đã trỏ đúng, test 1 giao dịch thật số nhỏ.
- [ ] Zalo OA đã duyệt template ZNS (xác nhận + nhắc).
- [ ] Backup Postgres tự động + đã thử restore 1 lần.
- [ ] Rate limit + healthcheck + Sentry bật.
- [ ] Onboard thử 1 sân thật, chạy 1 booking thật đầu-cuối.

## Seed / demo data

`database/seeders`: 1 `tenant` demo ("Sân Pickleball Demo"), 4–6 `courts`, `opening_rules` (6h–23h), `pricing_rules` (giờ vàng 17–22h cuối tuần đắt hơn), vài `customers`, ít booking mẫu (gồm 1 series cố định). Dùng để bán/demo và cho E2E. Lệnh: `php artisan migrate:fresh --seed`.

## Rủi ro triển khai & cách giảm

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| **Zalo OA duyệt template ZNS chậm** (vài ngày–tuần) | M5 trễ, không nhắc được | **Đăng ký OA + nộp template ngay M0**; tạm dùng email/SMS/gọi tay tới khi duyệt |
| **SePay/Casso sandbox + đăng ký** | M4 trễ | Đăng ký sớm; có thể test đối soát bằng cách nhập tay giao dịch trước khi có webhook thật |
| **Concurrency khó test đúng** | double-book lọt production | Viết `NoDoubleBookTest` với connection song song **trước** khi code service; không tin "chắc là ổn" |
| **DST / timezone** | lệch giờ | Luật lặp lưu giờ địa phương + tz; test quanh mốc đổi giờ (VN không DST nhưng giữ nguyên tắc) |
| **Solo dev quá tải M3+M6** | trễ tổng thể | M3 và M6 là 2 khối lớn nhất — không nhồi tính năng ngoài phạm vi; bám [`02-yeu-cau-chuc-nang.md`](02-yeu-cau-chuc-nang.md) |
| **VietQR sai định dạng nội dung** | đối soát không khớp | Chuẩn hóa `booking.code` ngắn, chỉ chữ+số; test khớp memo kỹ ([`11-diem-vo.md`](11-diem-vo.md) #7) |
