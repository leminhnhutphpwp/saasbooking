# 04 — Cấu hình per-tenant & Nhúng

Doc này đặc tả **chủ sân chỉnh được gì cho cơ sở của mình** và **cơ chế nhúng trang đặt sân vào mọi mặt tiền**. Nguyên tắc xuyên suốt: **template + settings, KHÔNG builder kéo-thả** (xem [`01-san-pham.md`](01-san-pham.md) §2 — mô hình mặt tiền ba lớp).

---

## 1. Các nhóm cấu hình chủ sân chỉnh được

| Nhóm | Chỉnh gì | Lưu ở đâu | Ràng buộc |
|---|---|---|---|
| **Thương hiệu trang** | Tên cơ sở, logo, màu chủ đạo, ảnh bìa, mô tả, địa chỉ + toạ độ bản đồ, hotline, link Zalo | `tenants.settings` (JSONB) + file lên `storage` | Trong khuôn khổ **template**: chọn màu từ palette, upload ảnh theo tỉ lệ cố định — không sửa layout/HTML |
| **Dịch vụ đã đăng ký** | `tenants.service_id` — Pickleball hoặc Cầu lông; một tenant đúng một service | Bảng platform-scope `platform_services` + FK trên `tenants` | Operator mở/đóng đăng ký bằng backend/seeder; khách muốn thêm service phải đăng ký thêm tenant |
| **Vertical dispatch** | `tenants.vertical` — Phase 1 là `racket_court`, snapshot từ service | Cột `tenants.vertical`, không phải payload/JSONB | Quyết định engine + UI; nhiều service có thể dùng chung vertical |
| **Sân & phân loại tài nguyên** | Danh sách sân, trạng thái, category riêng của cơ sở | `courts` + `resource_categories` | Soft-delete; category tenant-scoped, không phải service platform |
| **Giờ mở cửa** | Giờ mở theo thứ, ngày nghỉ/bảo trì | Bảng `opening_rules`, `blackouts` | Versioned `effective_from/to` (đổi giờ = đóng rule cũ) |
| **Bảng giá** | Giá giờ vàng/giờ thường theo thứ + khoảng giờ, theo sân hoặc chung | Bảng `pricing_rules` | Luật ưu tiên (`priority`); giá **chụp snapshot** vào booking lúc đặt |
| **Chính sách cọc** | Cọc một phần (vd 50k/giờ) hay trả đủ; mức cọc | `tenants.settings.deposit` | Số nguyên VND (`BIGINT`) |
| **Chính sách hủy/bom** | Mốc giờ → % hoàn (vd hủy trước 24h hoàn 100%); bom → giữ cọc/chuyển buổi | `tenants.settings.cancel_policy` | **Chụp snapshot** vào `booking.cancel_policy_snapshot` lúc đặt |
| **Nhắc lịch** | Bật/tắt; thời điểm (trước 1 ngày, trước 2 tiếng); nội dung template ZNS | `tenants.settings.reminders` + `notification_templates` | Template ZNS phải đúng mẫu đã duyệt Zalo |
| **Thanh toán/đối soát** | Số tài khoản nhận cọc, ngân hàng; nối SePay/Casso (khóa webhook) | Bảng `tenant_bank_config` | Khóa mã hoá; chỉ owner xem |
| **Zalo OA** | Kết nối OA (OAuth), chọn template ZNS đã duyệt | Bảng `zalo_oa_config` | Token refresh; đứt kết nối → fallback email |
| **Tên miền** | Subdomain mặc định `sancualong.datsan.vn` (Phase 1); custom domain (Phase 2) | `tenants.subdomain` (Phase 1); bảng `tenant_domains` (Phase 2, module interop) | Subdomain unique toàn cục; custom domain cần verify DNS + cấp TLS |

---

## 2. Lưu cấu hình ở đâu — ranh giới JSONB vs bảng riêng

**Quy tắc:** cái gì **truy vấn/lọc/tính toán** → bảng riêng có cột + index. Cái gì chỉ **đọc nguyên khối để render/áp dụng** → `settings JSONB`.

| Bảng riêng (có logic) | `tenants.settings` (JSONB, đọc nguyên khối) |
|---|---|
| `pricing_rules`, `opening_rules`, `blackouts` — engine tính availability/giá phải join & lọc | Thương hiệu (logo, màu, ảnh, mô tả, liên hệ) |
| `courts` — đối tượng nghiệp vụ, có FK từ booking | `deposit` (mức cọc), `cancel_policy` (mốc→%) |
| `tenant_bank_config`, `zalo_oa_config` — bí mật + vòng đời riêng | `reminders` (bật/tắt, thời điểm) |
| `tenant_domains` (Phase 2) — verify/TLS theo dòng | Cấu hình hiển thị trang (template id, thứ tự block cho phép) |

**Lưu ý:** `cancel_policy` để JSONB trong settings *là bản hiện hành*; khi đặt sân phải **chụp** sang `booking.cancel_policy_snapshot` (đổi chính sách sau không hồi tố — xem [`11-diem-vo.md`](11-diem-vo.md) #1). Mọi thay đổi cấu hình ghi `audit_logs` qua trait `Auditable` (khôi phục/đối chiếu được ai đổi gì).

---

## 3. Ranh giới template vs builder (chốt)

- ✅ **Template + settings:** chủ sân đổi logo/màu/ảnh/mô tả, bật/tắt các khối cho sẵn, sắp thứ tự trong khuôn khổ template. Trang luôn mobile-first, không vỡ layout.
- ❌ **Builder kéo-thả tự do:** KHÔNG làm. Đây là commodity (AI/WordPress/Wix đã cho không); giá trị của ta là backend chống-trùng + VietQR + Zalo, không phải đi thi dựng trang.
- Kỹ thuật: trang render từ **template cố định** + `settings`; "tùy biến" = validate `settings` bằng schema, không cho chèn HTML/JS tự do → không thể phá layout hay lõi.

---

## 4. Wizard onboarding <15 phút

Mục tiêu định nghĩa lại: **<15 phút có trang đặt sân nhận cọc VietQR** (xem [`02-yeu-cau-chuc-nang.md`](02-yeu-cau-chuc-nang.md)).

| Bước | Làm gì | Kết quả |
|---|---|---|
| 1. Đăng ký dịch vụ + khai cơ sở | Chọn đúng một service đang active, nhập tên cơ sở; server tạo tenant + owner membership và snapshot vertical | `platform_services` + `tenants` + `memberships` |
| 2. Thêm sân | Số sân + loại (cầu lông/pickleball) | Các dòng `courts` |
| 3. Bảng giá | Giá giờ thường + đánh dấu khung giờ vàng | `pricing_rules` |
| 4. Nối tiền | Nhập tài khoản nhận + nối SePay/Casso | `tenant_bank_config`, đối soát chạy |
| 5. Nối Zalo | Kết nối OA, chọn template nhắc | `zalo_oa_config` |
| 6. Xuất trang | Xem trước `sub.datsan.vn`, bật nhận đặt | Trang live |

**Setup tận tay:** giai đoạn đầu có thể cấu hình hộ từng sân để giảm rào cản onboarding.

---

## 5. Cơ chế nhúng chi tiết

### Lớp 1 — Trang subdomain (mặc định, ai cũng có)
- Laravel route **theo hostname**: `sancualong.datsan.vn` → resolve tenant từ subdomain → render trang đặt sân (Inertia) gọi thẳng `BookingService` (không qua HTTP API). Xem [`08-thiet-ke-module-chi-tiet.md`](08-thiet-ke-module-chi-tiet.md) §6.
- Custom domain (Phase 2): thêm dòng `tenant_domain`, verify DNS (CNAME), cấp TLS (Caddy on-demand) — xem [`09-kien-truc-mo-rong.md`](09-kien-truc-mo-rong.md).

### Lớp 2 — Nhúng vào web có sẵn (tùy chọn)
| Kênh | Cách dùng | Ghi chú |
|---|---|---|
| **Script embed** | `<script src="https://cdn.datsan.vn/embed.js" data-tenant="KEY"></script>` — bundle React build riêng bằng Vite, render widget đặt sân | Gọi **API công khai** (`/v1/availability`, `/v1/holds`) |
| **Plugin WordPress** | Shortcode `[datsan id="KEY"]` bọc widget trên | Cho chủ sân đã có web WP |

### Bảo mật nhúng (bắt buộc)
- **API key theo tenant** (`api_keys` — bảng module interop, **Phase 2**; không có trong ERD Phase-1 ở [`06-erd.md`](06-erd.md)) — Sanctum xác thực; key public dùng cho widget chỉ có scope đọc availability + tạo hold, **không** đọc dữ liệu khác.
- **Origin allowlist + CORS:** mỗi tenant khai danh sách domain được nhúng; request từ origin lạ bị chặn.
- **Rate limit (throttle):** giới hạn theo key + IP, chống spam tạo hold.
- **Bất biến:** widget/plugin **chỉ gọi Service công khai của `booking`** — không có đường chạm thẳng DB lõi; nên Zalo/subdomain/WordPress chia sẻ đúng một nguồn chống-trùng, một nguồn tiền.

UI hiện hành nằm trong `apps/app/resources/js/Pages/Manager`; tài liệu này chỉ giữ contract cấu hình và dữ liệu.
