# 08 — Thiết kế module chi tiết (build-ready, theo khuôn mẫu appdhv)

Bản này ánh xạ 7 module sang **Laravel 13 + Inertia + React** đúng pattern của `appdhv`. "Module" ở đây không phải package — mà là một nhóm **Model + Service + Controller + Job** cùng trách nhiệm.

Quy ước lấy từ appdhv (dùng lại y nguyên):
- **Tenant context:** `App\Support\WorkingTenant` là **nơi duy nhất** quyết định request thuộc cơ sở sân nào (như `WorkingSchool`). Middleware `ResolveWorkingTenant` gắn `tenantId` vào request; controller chỉ tin `WorkingTenant::id($request)`, **không tin payload**. Non-operator bị **kẹp cứng** vào `users.tenant_id`.
- **Model:** `id` bigint PK + cột `uuid` cho route binding (`getRouteKeyName(): 'uuid'`); `use SoftDeletes` + `use Concerns\Auditable` (ghi `audit_logs`).
- **Trạng thái:** PHP enum trong `app/Enums`.
- **Ghi chéo module:** gọi method của Service module chủ; việc nền (nhắc, webhook) dùng **queued listener `afterCommit`** hoặc Job (Horizon).
- **Controller:** trả `Inertia::render(...)` (đọc) hoặc `RedirectResponse` với flash (ghi); mọi truy vấn `->where('tenant_id', WorkingTenant::id($request))`.

Nguyên tắc bất di: **module khác chỉ gọi qua Service công khai, không đọc/ghi thẳng bảng module khác.** `BookingService` là nơi duy nhất chạm concurrency; `interop` là mặt tiền, không phải đường tắt vào DB.

---

## 0. Cơ chế render & dispatch theo loại tenant (vertical driver)

Đây là chỗ hiện thực nguyên tắc **"một hệ thống, nhiều dòng sản phẩm"** ([`09-kien-truc-mo-rong.md`](09-kien-truc-mo-rong.md)): hệ thống chọn *engine tồn kho* + *bảng giá* + *component lịch/booking* theo **loại tenant** — không viết code riêng cho từng môn.

### Dispatch theo HÌNH DẠNG, không theo môn
- **Cầu lông, pickleball, tennis, bóng đá mini** = **cùng một hình dạng** (resource-time-slot) → **cùng driver, cùng lịch, cùng luồng đặt**. Khác nhau chỉ ở `courts.court_type` (nhãn) + `pricing_rule` + thương hiệu. **KHÔNG có code riêng cho từng môn.**
- **Golf** = hình dạng **capacity/session** (tee time) → driver khác + lịch khác (tee sheet), nhưng **tái dùng 100%** vòng đời/cọc/Zalo/tenant/interop.

### Khai báo trên tenant
| Cột | Ví dụ | Vai trò |
|---|---|---|
| `tenants.vertical` | `racket_court` · `golf` · `spa`(sau) | Thương hiệu, thuật ngữ, cấu hình mặc định, **chọn UI** |
| suy ra `inventory_mode` | `resource_time_slot` · `capacity_session` | **Chọn ENGINE** (driver) |

`court_type` (badminton/pickleball/tennis) nằm ở mức `courts` — chỉ là nhãn + giá, **KHÔNG đổi engine**.

### Backend — Strategy / Driver
```php
interface InventoryDriver {
    public function availability(int $tenantId, array $criteria): array;
    public function hold(int $tenantId, HoldRequest $req): Booking;  // ném SlotTaken khi trùng
    public function release(Booking $b): void;
}
class ResourceTimeSlotDriver implements InventoryDriver { /* exclusion constraint — Phase 1 */ }
class CapacitySessionDriver  implements InventoryDriver { /* UPDATE counter ≤ capacity — 🚪 chừa cửa */ }
```
```php
// config/booking.php — registry: THÊM vertical = thêm 1 dòng, KHÔNG sửa lõi
'verticals' => [
  'racket_court' => ['mode'=>'resource_time_slot','pricing'=>HourlyPeakPricing::class,'ui'=>'CourtGrid'],
  'golf'         => ['mode'=>'capacity_session',  'pricing'=>GreenFeePricing::class,  'ui'=>'TeeSheet'],
  'spa'          => ['mode'=>'resource_time_slot','pricing'=>ServicePricing::class,   'ui'=>'CourtGrid'],
],
'modes' => [
  'resource_time_slot' => ResourceTimeSlotDriver::class,
  'capacity_session'   => CapacitySessionDriver::class,
],
```
`BookingService` = **dispatcher mỏng + vòng đời chung**: resolve driver theo `tenant.vertical → mode` rồi ủy thác `hold/release/availability`; còn state machine + cọc + event là chung cho mọi vertical. **Concurrency đặc thù hình dạng nằm trong driver** (đây là chi tiết hóa của §3 BookingService bên dưới).

### Frontend — component registry (Inertia + React)
```js
// resources/js/Booking/registry.js
export const CALENDAR = { CourtGrid: CourtGridCalendar, TeeSheet: TeeSheetCalendar };
export const FLOW     = { CourtGrid: CourtBookingFlow,  TeeSheet: TeeTimeBookingFlow };
```
Controller truyền prop `ui` (suy từ `tenant.vertical`); trang Inertia chọn component từ registry. **Vỏ chung** (layout, bước QR cọc, xác nhận Zalo) bọc mọi vertical.

### Ví dụ cụ thể — "golf / cầu lông / pickleball thì sao?"
| Vertical | Môn / loại | inventory_mode | Lịch (UI) | Đơn vị đặt | Chống trùng | Phase |
|---|---|---|---|---|---|---|
| `racket_court` | **cầu lông, pickleball, tennis, futsal** | resource_time_slot | **Court grid** (sân × giờ) | 1 sân, `[start,end]`, theo giờ | exclusion constraint | **1** |
| `golf` | **golf** | capacity_session | **Tee sheet** (giờ xuất phát mỗi ~8–10') | 1 chỗ trong tee time (flight ≤4) | UPDATE counter | 🚪 chừa cửa |
| `spa` | spa/nail | resource_time_slot | Court grid (thợ × giờ) | thợ + dịch vụ có thời lượng | exclusion constraint | 🚪 chừa cửa |

→ **Cầu lông và pickleball chung 100%** (chỉ khác nhãn + giá). **Golf khác lịch + driver + giá**, phần còn lại tái dùng. **Phase 1 chỉ hiện thực** `racket_court` + `ResourceTimeSlotDriver` + `CourtGrid`; interface `InventoryDriver` + registry là **cửa đã chừa** — thêm golf sau = 1 driver + 1 component + 1 dòng config, **0 rewrite lõi**.

---

## 1. identity

- **Vai trò:** chủ sân + nhân viên, phân quyền, phiên; một `tenant` = một cơ sở sân.
- **Thành phần:** `Models/Tenant`, `Models/User` (thêm `tenant_id`), `Models/Membership`; `Support/WorkingTenant`; `Middleware/ResolveWorkingTenant` + `HandleInertiaRequests` (share `auth`, `flash`, `workingTenant`). Auth = **Breeze**; role qua `spatie/laravel-permission` (appdhv dùng `getRoleNames()`).
- **Giao diện:**
  ```php
  WorkingTenant::id(Request $request): ?int      // tenant của request (đã kẹp cứng per-user)
  WorkingTenant::switchable(?User $user)          // danh sách cơ sở user được chuyển
  ```
- **Bất biến:** mọi truy vấn nghiệp vụ scope theo `WorkingTenant::id()`; super_admin mới chuyển cơ sở tự do.

---

## 2. court-catalog

- **Vai trò:** khai báo sân, giờ mở cửa, ngày nghỉ, **bảng giá giờ vàng/thường**.
- **Thành phần:** `Models/Court`, `OpeningRule`, `Blackout`, `PricingRule`; `Services/Catalog/PricingService`; `Http/Controllers/Manager/CourtController` (Inertia CRUD, scope `tenant_id`).
- **Giao diện (Service):**
  ```php
  PricingService::resolve(int $tenantId, int $courtId, Carbon $startAt, Carbon $endAt): int
  // trả GIÁ (VND, int) theo luật ưu tiên; BookingService gọi lúc giữ chỗ rồi CHỤP vào booking_slot
  CatalogService::openingWindows(int $tenantId, int $courtId, CarbonImmutable $date): array
  ```
- **Điểm mở rộng:** thêm loại sân (tennis, bóng đá mini) = thêm case trong enum `CourtType` + luật giá — không đụng schema.
- **Bất biến:** giá trả về là giá trị *tại thời điểm hỏi*; module khác phải snapshot (điểm vỡ #1).

---

## 3. booking — module lõi, làm mạnh nhất

`Services/Booking/*` — bốn service con, mỗi cái một trách nhiệm.

### 3.1 AvailabilityService (compute-on-read, đa sân)
```php
AvailabilityService::search(int $tenantId, array $criteria): array
// criteria: date, courtType?, startAt?, durationMin?  → mỗi sân: khung trống + giá đã resolve
```
`opening_rule` − `blackout` − `booking_slot` đang `holding|committed` → cắt khung theo `durationMin`. Cache 30–60s/(sân,ngày). **Không materialize lưới slot.**

### 3.2 BookingService — điểm hẹp concurrency DUY NHẤT
```php
BookingService::createHold(int $tenantId, HoldRequest $req): Booking
// 1 DB::transaction: INSERT booking(pending_deposit) + booking_slot(holding)
// exclusion constraint bắn SQLSTATE 23P01 → ném SlotTakenException → HTTP 409
BookingService::release(Booking $booking): void
BookingService::confirmDeposit(Booking $booking): void        // ReconcileService gọi
BookingService::markPaymentOrphaned(Booking $booking): void
```
Mọi con đường giữ một khung giờ trên một sân — đặt lẻ, đặt cố định, đặt hộ — **đều đi qua đây**, trong một `DB::transaction`, dựa vào exclusion constraint làm trọng tài. Không có đường thứ hai.

### 3.3 SeriesService — đặt cố định
```php
SeriesService::create(int $tenantId, SeriesRequest $req): SeriesResult
// chụp giá/cọc vào recurring_series; sinh buổi trong horizon (4 tuần), mỗi buổi qua createHold();
// buổi vướng lịch → trả về conflicts cho chủ sân xử tay (không làm hỏng cả series)
SeriesService::cancelOccurrence(Booking $booking): void        // hủy 1 buổi, series vẫn chạy
```
Job `GenerateSeriesOccurrences` (Scheduler hằng ngày) sinh tiếp tới `end_date` (điểm vỡ #5).

### 3.4 Vòng đời + state machine
```php
BookingService::cancel(Booking $b, string $actor, CancelReason $reason): ?Refund
BookingService::markNoShow(Booking $b): void
```
Chuyển trạng thái hợp lệ khai bằng enum `BookingStatus`; mọi transition ghi `audit_logs` (trait `Auditable`); hủy tính hoàn theo `cancel_policy_snapshot` rồi gọi `PaymentService::requestRefund`.

- **Thành phần:** `Models/Customer`, `Booking`, `BookingSlot`, `RecurringSeries`; `Enums/BookingStatus`, `HoldStatus`; `Http/Controllers/Public/BookingController` (trang đặt sân) + `Manager/CalendarController` (lịch chủ sân); `Jobs/ExpireStaleHolds` (Scheduler mỗi phút).
- **Điểm mở rộng:** cần "sân + trọng tài + đèn" (multi-resource) sau này = thêm bảng nối `booking_slot_resource`, không đổi `bookings`.
- **Bất biến:** không double-book (exclusion constraint); giá/cọc là snapshot; giữ tạm có `hold_expires_at`, hết hạn tự nhả.

---

## 4. payment

- **Vai trò:** cọc VietQR + đối soát ngân hàng + hoàn cọc. Idempotent độc lập với booking.
- **Thành phần:** `Models/Payment`, `BankTxnInbox`, `Refund`, `TenantBankConfig`; `Services/Payment/ReconcileService`; `Http/Controllers/Webhook/BankReconcileController` (nhận webhook SePay/Casso).
- **Giao diện:**
  ```php
  PaymentService::initDeposit(Booking $b, int $amount): QrPayload   // QR + memo=booking.code
  ReconcileService::ingest(array $rawTxn): void                     // webhook → đối soát → gọi BookingService::*
  PaymentService::requestRefund(Payment $p, int $amount, RefundReason $r): Refund
  ```
- **Ba nhánh đối soát** (`ReconcileService::ingest`): còn hạn → `confirmDeposit`; hết hạn + sân còn → grace; sân mất → `markPaymentOrphaned` + refund tự sinh + báo hai phía (xem [`07-luong-du-lieu.md`](07-luong-du-lieu.md) luồng a).
- **Bất biến:** idempotent bằng `unique(bank_txn_id)` trên `bank_txn_inbox` + `payments`; `payments.amount` bất biến, hoàn cọc là dòng `refunds` riêng (điểm vỡ #7, #11).

---

## 5. notification

- **Vai trò:** Zalo ZNS (xác nhận + nhắc) + email dự phòng.
- **Thành phần:** Laravel **Notification** (`ShouldQueue`, `$afterCommit = true`) + kênh tùy biến `ZaloZnsChannel`; `Jobs/SendBookingReminders` (Scheduler quét booking sắp tới); `Models/ZaloOaConfig`.
- **Cách nối:** dùng **queued listener `afterCommit`** cho sự kiện `BookingConfirmed`/`BookingCancelled` — gửi ZNS *sau khi transaction commit*, lỗi gửi không kéo theo lỗi đặt sân. (Không cần bảng outbox thủ công ở Phase 1; Laravel `afterCommit` + Horizon lo phần này.)
- **Điểm mở rộng:** thêm kênh (SMS, Zalo Mini App push) = thêm channel, không đổi luồng.

---

## 6. interop / embed — lời giải cho WordPress, KHÔNG phải builder

- **Bối cảnh:** mặt tiền **mặc định** là *trang đặt sân riêng host trên hệ thống* — do chính app Laravel+Inertia render, gọi thẳng `BookingService` (không qua HTTP). `interop` là lớp **tùy chọn** cho chủ sân *đã có web riêng* (WordPress/Wix/AI-build). Xem mô hình ba lớp ở [`01-san-pham.md`](01-san-pham.md#2-mặt-tiền--khách-vào-đặt-sân-bằng-đường-nào).
- **Vai trò:** biến `BookingService` thành cái não đặt sân dùng được ở **mọi** mặt tiền.
- **Thành phần:** `routes/api.php` (Sanctum + throttle) — lớp mỏng bọc *đúng* Service của `booking`:
  ```
  GET  /v1/availability     → AvailabilityService::search
  POST /v1/holds            → BookingService::createHold   (trả QR VietQR)
  GET  /v1/bookings/{code}  → trạng thái + cọc
  ```
  Thêm: **widget nhúng** (`<script>` build riêng bằng Vite, gọi API trên); **plugin WordPress** (`[datsan id=...]` bọc widget); **webhook ra** (`booking.confirmed`... bắn tới endpoint tenant qua Job).
- **Bất biến kiến trúc:** interop **chỉ gọi Service công khai của `booking`**, không có query riêng chạm bảng lõi — nên Zalo/WP/Wix/AI-site chia sẻ đúng một nguồn chống-trùng, một nguồn tiền.
- **Vì sao thắng builder:** builder là thứ AI/WordPress đã cho không (commodity); ta bán backend họ không build được (chống trùng + VietQR + Zalo + chống bom), cắm vào mặt tiền của họ.
- **Phase:** widget + API đọc availability + tạo hold: **Phase 2**; plugin WP + webhook ra: **Phase 2–3**.

**Ranh giới:** ✅ *trang đặt sân có thương hiệu* (logo/màu/ảnh qua template + settings) — trong phạm vi. ❌ *builder kéo-thả tự do* — không làm.

---

## 7. billing (Phase 2)

- **Vai trò:** gói thuê phần mềm **flat** theo số sân. Không metered.
- **Thành phần:** `Models/Plan`, `Subscription`, `Invoice`; có thể quản bằng **Filament 5.7+** (panel admin nền tảng, đã có trong appdhv). Dùng bản **≥5.7** — Form/Table đã được cải thiện hiệu năng.
- **Giao diện:**
  ```php
  BillingService::assertActive(int $tenantId): void   // chặn nhẹ khi hết hạn thuê
  ```

---

## Hạ tầng chung

- **Sự kiện:** Laravel Events + **queued listener `afterCommit`** (Horizon) — mối nối bất đồng bộ an toàn giữa module. (Nếu Phase 2 cần giao webhook ra ngoài *đảm bảo*, thêm bảng `event_outbox` + dispatcher; Phase 1 chưa cần.)
- **Audit:** trait `Concerns\Auditable` (bê nguyên từ appdhv) ghi `audit_logs` mọi create/update/delete.
- **Job định kỳ (Scheduler):** `ExpireStaleHolds` (mỗi phút), `GenerateSeriesOccurrences` (hằng ngày), `SendBookingReminders` (mỗi 5–10 phút).

## Thứ tự build (Phase 1)

1. `identity` + hạ tầng: `WorkingTenant`, `ResolveWorkingTenant`, `HandleInertiaRequests`, Breeze auth, migration RLS.
2. `court-catalog`: model + migration + `PricingService` + Manager CRUD (Inertia).
3. `booking`: migration `bookings`/`booking_slots` + **`DB::statement` tạo exclusion constraint** → `BookingService` → `AvailabilityService` → `SeriesService`. **Viết `tests/Feature` concurrency cho exclusion constraint TRƯỚC.**
4. `payment`: SePay/Casso webhook + `ReconcileService` (3 nhánh) + test idempotency.
5. `notification`: Zalo ZNS Notification + `SendBookingReminders`.
6. Trang đặt sân (Public) + dashboard chủ sân (Manager) — Inertia + shadcn.

→ `interop`/`billing` để Phase 2; `BookingService` đã phơi **Service công khai sạch** từ Phase 1 để Phase 2 chỉ việc bọc `routes/api.php` lên — không sửa lõi.
