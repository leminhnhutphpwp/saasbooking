# 02 — Yêu cầu chức năng & Use cases

Đặc tả nền cho toàn bộ hệ thống "SÂN". Mọi doc thiết kế ([03](03-giao-dien-quan-ly.md), [04](04-cau-hinh-per-tenant.md), [06](06-erd.md), [07](07-luong-du-lieu.md), [08](08-thiet-ke-module-chi-tiet.md)) bám vào các mã FR/UC ở đây. Ưu tiên ghi theo **MoSCoW** (M=Must, S=Should, C=Could, W=Won't-now) + **Phase**.

---

## 1. Actor & quyền hạn

| Actor | Là ai | Quyền chính | Đăng nhập? |
|---|---|---|---|
| **Người chơi** (end-user) | Khách đặt sân | Xem sân trống, đặt sân, cọc VietQR, hủy trong hạn, xem lịch mình đặt | Không (định danh bằng SĐT + OTP nhẹ / link Zalo) |
| **Nhân viên** (staff) | Lễ tân/quản sân | Xem & thao tác lịch, đặt hộ khách vãng lai, đánh dấu check-in/no-show, thu tiền mặt | Có (theo membership tenant) |
| **Chủ sân** (owner) | Người trả tiền thuê phần mềm | Toàn quyền trong cơ sở: sân, bảng giá, giờ mở, nhân viên, cấu hình trang, báo cáo, hoàn cọc, gói thuê | Có (theo membership tenant) |
| **Super admin** (operator nền tảng) | Bạn — chủ SaaS | Quản tenant/gói, impersonate hỗ trợ, xem audit toàn hệ thống, đổi cơ sở tự do | Có (global operator) |

Cách ly: mọi actor có đăng nhập bị scope qua `WorkingTenant` ([08](08-thiet-ke-module-chi-tiet.md)); owner/staff chỉ chuyển giữa tenant có membership, super_admin chuyển tự do. Một account có thể đăng ký nhiều dịch vụ nhưng mỗi lần tạo tenant riêng. Người chơi không thuộc tenant nào — họ tương tác qua trang công khai của một cơ sở cụ thể.

---

## 2. Danh mục yêu cầu chức năng (FR)

### Nhóm A — Sân & lịch mở (module court-catalog)
| Mã | Chức năng | MoSCoW | Phase |
|---|---|---|---|
| FR-A1 | CRUD sân, loại sân (pickleball/cầu lông/khác), soft-delete (archive) | M | 1 |
| FR-A2 | Cấu hình giờ mở cửa theo thứ, versioned theo thời gian | M | 1 |
| FR-A3 | Ngày nghỉ/bảo trì (blackout) theo sân hoặc cả cơ sở | M | 1 |
| FR-A4 | Bảng giá **giờ vàng/giờ thường** theo thứ + khoảng giờ, có ưu tiên | M | 1 |
| FR-A5 | Nhân bản cấu hình sân (tạo nhanh N sân giống nhau) | S | 2 |

### Nhóm B — Đặt sân (module booking)
| Mã | Chức năng | MoSCoW | Phase |
|---|---|---|---|
| FR-B1 | Xem sân trống theo ngày/khung giờ (đa sân, compute-on-read) | M | 1 |
| FR-B2 | Đặt sân lẻ + tính giá server-side + tạo giữ tạm (hold) | M | 1 |
| FR-B3 | Chống double-book bằng exclusion constraint (23P01 → 409) | M | 1 |
| FR-B4 | **Đặt cố định hàng tuần** (series): tạo, sinh buổi cuốn chiếu, giữ cả loạt | M | 1 |
| FR-B5 | Hủy **một buổi** trong series mà series vẫn chạy | M | 1 |
| FR-B6 | Chủ sân/nhân viên **đặt hộ khách vãng lai** (tiền mặt, bỏ qua QR) | M | 1 |
| FR-B7 | Đánh dấu **no-show (bom)** → giữ cọc | M | 1 |
| FR-B8 | Hủy đặt sân (khách/chủ sân) theo chính sách + hoàn cọc | M | 1 |
| FR-B9 | Đổi giờ/đổi sân cho một booking (reschedule) | S | 2 |
| FR-B10 | Chặn đặt nếu khách bom nhiều lần (cảnh báo/yêu cầu cọc cao hơn) | C | 2 |
| FR-B11 | Đánh dấu **check-in → completed** (đã đến, đã đá xong) | S | 2 |

### Nhóm C — Cọc & tiền (module payment)
| Mã | Chức năng | MoSCoW | Phase |
|---|---|---|---|
| FR-C1 | Sinh QR VietQR (số tiền cọc + nội dung = mã đặt) | M | 1 |
| FR-C2 | **Đối soát tự động** qua webhook SePay/Casso, khớp memo=mã đặt + số tiền | M | 1 |
| FR-C3 | Ba nhánh đối soát: confirm / grace / orphaned+refund | M | 1 |
| FR-C4 | Cấu hình cọc: cọc một phần (đ/giờ) hoặc trả đủ, theo cơ sở | M | 1 |
| FR-C5 | Hoàn cọc (ledger refund) + đánh dấu "đã chuyển khoản trả" | M | 1 |
| FR-C6 | Chính sách hủy/giữ cọc theo thời điểm (trước X giờ) | M | 1 |
| FR-C7 | Thu tiền mặt cho khách vãng lai (`payment_mode='cash'`) | M | 1 |
| FR-C8 | **Hàng chờ giao dịch ngân hàng chưa khớp / đối soát tay** (chủ sân gán tay giao dịch thiếu/dư/sai nội dung vào booking) | M | 1 |
| FR-C9 | Cổng thanh toán VNPay/MoMo (bổ sung, nếu cần) | C | 2 |

### Nhóm D — Khách hàng & thông báo
| Mã | Chức năng | MoSCoW | Phase |
|---|---|---|---|
| FR-D1 | Hồ sơ khách (SĐT, tên, lịch sử đặt, số lần bom) — CRM nhẹ | M | 1 |
| FR-D2 | Zalo ZNS xác nhận đặt sân | M | 1 |
| FR-D3 | Zalo ZNS nhắc trước 1 ngày + trước 2 tiếng | M | 1 |
| FR-D4 | Email dự phòng khi chưa follow Zalo OA | S | 1 |
| FR-D5 | Tin nhắn hủy/hoàn cọc | M | 1 |
| FR-D6 | Khách quen/điểm thưởng (loyalty) | W | 3 |

### Nhóm E — Cấu hình & giao diện (xem [04](04-cau-hinh-per-tenant.md))
| Mã | Chức năng | MoSCoW | Phase |
|---|---|---|---|
| FR-E1 | Trang đặt sân riêng trên hệ thống (subdomain, template có thương hiệu) | M | 1 |
| FR-E2 | Tùy biến branding: logo, màu, ảnh bìa, mô tả, địa chỉ, SĐT | M | 1 |
| FR-E3 | Cấu hình chính sách hủy/cọc/giờ giữ tạm hiển thị cho khách | M | 1 |
| FR-E4 | Widget nhúng `<script>` + plugin WordPress | S | 2 |
| FR-E5 | Webhook ra (booking.confirmed…) tới endpoint tenant | C | 2 |

### Nhóm F — Vận hành nền tảng
| Mã | Chức năng | MoSCoW | Phase |
|---|---|---|---|
| FR-F1 | Phân quyền owner/staff (mời, thu hồi) | M | 1 |
| FR-F2 | Audit log mọi thao tác (trait Auditable) | M | 1 |
| FR-F3 | Báo cáo doanh thu theo sân/giờ vàng/ngày | S | 2 |
| FR-F4 | Gói thuê phần mềm flat theo số sân (billing) | S | 2 |
| FR-F5 | Super admin: quản tenant/gói (Filament), impersonate hỗ trợ | S | 2 |

---

## 3. Use case chi tiết

### UC-01 — Đặt sân lẻ + cọc
- **Actor:** người chơi. **Tiền điều kiện:** cơ sở active, còn sân trống.
- **Luồng chính:**
  1. Khách mở trang đặt sân (subdomain / link Zalo), chọn ngày + khung giờ.
  2. Hệ thống hiện các sân trống + giá (giờ vàng/thường đúng theo luật).
  3. Khách chọn sân, xác nhận; hệ thống tính giá + cọc **server-side**.
  4. Tạo `booking(pending_deposit, hold_expires_at=+10')` + `booking_slot(holding)` trong 1 transaction.
  5. Hiện QR VietQR (nội dung = mã đặt `SAN-XXXX`).
  6. Khách chuyển khoản → webhook đối soát khớp → `confirmed` + ZNS xác nhận.
- **Luồng phụ/ngoại lệ:**
  - 3a. Hai khách cùng chọn ô cuối → exclusion constraint chặn → 409 "Sân vừa có người giữ" → quay lại bước 2.
  - 6a. Hết 10' chưa thấy tiền → job `ExpireStaleHolds` chuyển `expired`, nhả sân.
  - 6b. Tiền về sau khi hết hạn nhưng sân còn → grace re-confirm; sân mất → orphaned + refund tự sinh + báo hai phía (xem [07](07-luong-du-lieu.md), [10](10-tinh-huong-phat-sinh.md)).
- **Hậu điều kiện:** sân được giữ chắc chắn; ghi audit; counter doanh thu +1.

### UC-02 — Đặt cố định hàng tuần
- **Actor:** chủ sân (thường tạo hộ khách ruột) hoặc người chơi.
- **Luồng chính:**
  1. Chọn khách + sân + thứ + khung giờ + khoảng ngày (vd 8 tuần).
  2. Hệ thống chụp giá/cọc vào `recurring_series`, sinh các buổi trong horizon 4 tuần; mỗi buổi qua `createHold`.
  3. Thu cọc/tiền cả loạt (hoặc theo tháng).
  4. Trả về danh sách buổi giữ được + **buổi vướng lịch** (nếu có).
- **Ngoại lệ:** 2a. Một buổi trùng lịch đã có người đặt → không sinh buổi đó, đưa vào `conflicts` để chủ sân đổi sân/giờ; series vẫn active.
- **Hậu điều kiện:** series active; job `GenerateSeriesOccurrences` cuốn chiếu sinh tiếp tới `end_date`.

### UC-03 — Đối soát cọc tự động
- **Actor:** hệ thống (webhook SePay/Casso). **Tiền điều kiện:** có `payment(awaiting)`.
- **Luồng chính:**
  1. Nhận webhook giao dịch ngân hàng (bank_txn_id, amount, memo).
  2. `INSERT bank_txn_inbox` (unique bank_txn_id; trùng → bỏ qua).
  3. Khớp `memo`→`booking.code` + số tiền.
  4. Nếu booking còn hạn → `confirmDeposit`; hết hạn+sân còn → grace; sân mất → orphaned+refund.
- **Ngoại lệ:** 3a. Số tiền lệch → không auto-confirm, đưa vào hàng chờ chủ sân xử tay. 2a. Webhook trùng → ACK & thoát (idempotent).
- **Hậu điều kiện:** trạng thái booking/payment nhất quán; không bao giờ nuốt tiền im lặng.

### UC-04 — Hủy & hoàn cọc
- **Actor:** người chơi (link Zalo) hoặc chủ sân.
- **Luồng chính:**
  1. Yêu cầu hủy một booking.
  2. Tính tiền hoàn theo `cancel_policy_snapshot` (hủy sớm→hoàn; muộn→giữ cọc).
  3. `status=cancelled`, nhả sân (release), tạo `refund(requested)` nếu có.
  4. Chủ sân chuyển khoản trả → đánh dấu `refund=done` → ZNS báo khách.
- **Ngoại lệ:** 1a. Booking thuộc series → chỉ hủy buổi đó (UC liên quan FR-B5).

### UC-05 — Chủ sân đặt hộ khách vãng lai
- **Actor:** chủ sân/nhân viên. **Luồng chính:** mở lịch → chọn ô trống → nhập tên/SĐT khách → chọn `payment_mode=cash` → tạo `booking(confirmed)` ngay (bỏ qua QR) → đánh dấu đã thu tiền mặt. **Ngoại lệ:** ô đã bị giữ → exclusion chặn.

### UC-06 — Quản lý sân & bảng giá
- **Actor:** chủ sân. **Luồng chính:** thêm/sửa sân → cấu hình giờ mở theo thứ → tạo luật giá giờ vàng/thường (thứ + khoảng giờ + đơn giá + ưu tiên). **Ngoại lệ:** đổi giá không ảnh hưởng booking đã đặt (snapshot — [11](11-diem-vo.md) #1); đổi giờ mở dùng versioned rule ([11](11-diem-vo.md) #4).

### UC-07 — Cấu hình trang đặt sân
- **Actor:** chủ sân. **Luồng chính:** vào Cài đặt → đổi logo/màu/ảnh bìa/mô tả/địa chỉ → đặt chính sách cọc & hủy & thời gian giữ tạm → xem trước → lưu (áp dụng ngay lên trang công khai). Chi tiết [04](04-cau-hinh-per-tenant.md).

---

## 4. Yêu cầu phi chức năng (NFR)

| Mã | Loại | Yêu cầu |
|---|---|---|
| NFR-1 | Đúng đắn | **Không bao giờ double-book** (exclusion constraint); **không mất/nuốt cọc** (3 nhánh đối soát + refund tự sinh); tiền là số nguyên VND |
| NFR-2 | Hiệu năng | Đối soát cọc → xác nhận trong **vài giây**; trang xem sân trống < 1s; chịu **burst đặt giờ vàng** (nhiều người cùng đặt một khung) không sai |
| NFR-3 | Đồng thời | Mọi thao tác giữ chỗ đi qua 1 điểm hẹp (`BookingService`), transaction Postgres; chống double-submit (idempotency key/nút disable) |
| NFR-4 | Bảo mật | Cách ly tenant 3 lớp (WorkingTenant + composite FK + RLS); **không tin `tenant_id` từ payload**; chống forge; webhook có chữ ký; rate-limit API embed |
| NFR-5 | Trải nghiệm | **Mobile-first** (khách đặt trên điện thoại); tiếng Việt; ít bước; hiển thị QR rõ |
| NFR-6 | Khả dụng | Uptime mục tiêu ≥ 99.5%; job nền (Horizon) tự retry; lỗi gửi ZNS không kéo lỗi đặt sân |
| NFR-7 | Dữ liệu | Sao lưu Postgres hằng ngày; audit log mọi thay đổi; timestamp `timestamptz`, luật lặp giờ địa phương + tz |
| NFR-8 | Vận hành | Một người vận hành: debug bằng `psql` + `php artisan` + log Horizon; Docker Compose |

---

## 5. Ma trận phân quyền (role × nhóm chức năng)

| Nhóm chức năng | Người chơi | Nhân viên | Chủ sân | Super admin |
|---|---|---|---|---|
| Đặt sân (trang công khai) | ✅ (của mình) | ✅ (đặt hộ) | ✅ | — |
| Xem/thao tác lịch cơ sở | — | ✅ | ✅ | ✅ (impersonate) |
| Check-in / no-show | — | ✅ | ✅ | — |
| Thu tiền mặt | — | ✅ | ✅ | — |
| Hoàn cọc | — | ⛔ | ✅ | — |
| Quản lý sân / giá / giờ mở | — | ⛔ | ✅ | — |
| Cấu hình trang / branding | — | ⛔ | ✅ | — |
| Quản lý nhân viên | — | ⛔ | ✅ | — |
| Báo cáo doanh thu | — | ⚠️ (giới hạn) | ✅ | ✅ |
| Gói thuê / thanh toán SaaS | — | ⛔ | ✅ | ✅ |
| Quản tenant / audit toàn hệ thống | — | — | — | ✅ |

✅ toàn quyền · ⚠️ giới hạn · ⛔ cấm · — không áp dụng. Cấu hình chi tiết per-role có thể tinh chỉnh qua `spatie/laravel-permission`.

---

Liên quan: use case dạng bước → luồng dữ liệu kỹ thuật ở [07](07-luong-du-lieu.md); tình huống phát sinh đầy đủ ở [10](10-tinh-huong-phat-sinh.md); bất biến dữ liệu ở [11](11-diem-vo.md); ưu tiên theo phase ở [12](12-lo-trinh.md).
