# 09 — Kiến trúc mở rộng về sau

> Trả lời câu hỏi *"về sau lớn lên thì có phải đập đi làm lại không?"*. Nguyên tắc xuyên suốt: **phân biệt rõ cái LÀM BÂY GIỜ, cái chỉ CHỪA CỬA (thiết kế sao cho sau này thêm được mà không rewrite), và cái KHÔNG LÀM (chống over-engineer sớm cho solo dev).**

Chốt trước một câu: với kiến trúc hiện tại (single-DB Postgres, modular monolith, [`05-module-map.md`](05-module-map.md)), **không có trục phát triển nào bắt buộc rewrite**. Tất cả là "thêm vào", không phải "đập ra".

> ## Nguyên tắc nền tảng: MỘT HỆ THỐNG, NHIỀU DÒNG SẢN PHẨM
>
> Golf, spa, hay **loại tenant / vertical mới** về sau đều là **cấu hình chạy chung một nền tảng** — cùng codebase, cùng database, cùng `BookingService` / payment / Zalo / `interop` / `WorkingTenant`. **KHÔNG phải app riêng, KHÔNG phải hệ thống khác.** (Ví dụ: chủ sân pickleball và chủ sân golf là hai loại tenant trên cùng một hệ thống, mỗi loại bật cấu hình/tính năng của mình — giống Shopify phục vụ đủ loại cửa hàng trên một nền tảng.)
>
> "Beachhead riêng" / "dòng sản phẩm riêng" chỉ nói về **thị trường & go-to-market** (khác khách, khác giá, khác kênh bán, có thể khác landing/thương hiệu) — **vẫn chung một backend**. Chỉ tách *hệ thống* khi có tín hiệu thật (SLA/scale/đội ngũ khác hẳn — mục 6), điều gần như không xảy ra ở quy mô solo/indie.
>
> **Quy tắc bất di khi thiết kế mới: LUÔN CHỪA ĐƯỜNG.** Thêm loại tenant / hình dạng tồn kho / vertical / tính năng mới phải làm được bằng cách **THÊM** (bảng, module, cấu hình, enum), **không ĐẬP** lõi. Mỗi đề xuất mới phải phân loại rõ **làm bây giờ / 🚪 chừa cửa / ❌ không làm** (mục 7) để người sau — và agent phiên sau — đọc là hiểu ngay đâu là cửa đã chừa.

### Chốt mô hình đăng ký dịch vụ

- **Làm ngay:** operator cấu hình `platform_services` bằng backend/seeder; mỗi service trỏ một `vertical_key` trong registry.
- **Làm ngay:** mỗi lần khách đăng ký một service tạo một tenant riêng. Một account có thể có nhiều memberships và switch giữa các tenant đó.
- **Không làm:** đăng ký một tenant rồi tùy ý bật/tắt nhiều service trong tenant. Ranh giới tenant vẫn là ranh giới dữ liệu, billing, branding và vận hành.
- **Chừa cửa:** UI admin cho catalog, billing/trial enforcement và capacity-session service. Các cột đã có nhưng Phase 1 chưa thực thi billing/commission.

---

## 1. Các trục phát triển dự kiến

| Trục | Kịch bản | Độ khó |
|---|---|---|
| Nhiều tenant hơn | 10 → 100 → 1000 cơ sở sân | Thấp — single-DB thừa sức (mục 5) |
| Vertical **cùng hình dạng** | Spa/nail: thêm lớp thợ × dịch vụ × thời lượng | Trung bình — thêm bảng, tái dùng engine (mục 4) |
| Dịch vụ cùng engine | Pickleball, cầu lông, tennis, bóng đá mini | Thấp — thêm `platform_service` cùng `vertical_key`; tài nguyên chi tiết dùng `resource_categories` |
| Vertical **khác hình dạng** | **Golf (tee time), lớp học, sự kiện** — mô hình capacity/sức chứa | Trung bình–cao — thêm chế độ tồn kho song song (mục 3) |
| Multi-resource / booking | Sân + trọng tài + đèn, caddie, buggy | Trung bình — thêm bảng nối (mục 2) |
| Nhiều khu vực địa lý | Tenant ở nhiều tỉnh/timezone | Thấp — đã lưu `timestamptz` + `tz` sẵn ([`11-diem-vo.md`](11-diem-vo.md) #3) |
| API / embed cho agency | Đối tác cắm booking vào hệ thống của họ | Thấp — module `interop` đã tách sẵn |

---

## 2. Schema đã chừa cửa sẵn thế nào

Map tới ERD hiện tại ([`06-erd.md`](06-erd.md)) — mỗi trục có **đường di trú (migration path) chỉ-thêm-không-đổi**:

| Trục | Cửa đã chừa | Đường di trú (không rewrite) |
|---|---|---|
| Dịch vụ mới cùng engine | `platform_services.vertical_key` dispatch vào registry; `tenants.service_id` cố định dịch vụ đã đăng ký | Thêm service row; chỉ thêm code nếu cần vertical/engine mới. **Không sửa booking lifecycle.** |
| Multi-resource (sân + trọng tài + đèn) | `booking_slot` giữ chỗ ở **mức item**, exclusion constraint gắn `(tenant_id, court_id, tstzrange)` | Thêm bảng nối `booking_slot_resource(booking_slot_id, resource_id, tstzrange)` + exclusion constraint riêng cho từng loại resource. **`bookings`/`booking_slots` không đổi.** |
| Giá đổi theo mùa/khuyến mãi | Giá & cọc đã **snapshot** vào `booking_slot`/`recurring_series` ([`11-diem-vo.md`](11-diem-vo.md) #1) | Thêm cột/luật vào `pricing_rule`; đơn cũ không bị ảnh hưởng vì đọc snapshot. |
| Webhook ra ngoài đảm bảo | Hiện dùng queued listener `afterCommit` ([`08-thiet-ke-module-chi-tiet.md`](08-thiet-ke-module-chi-tiet.md)) | Thêm bảng `event_outbox` + dispatcher khi cần *at-least-once* thật sự (agency tích hợp). Ghi sự kiện cùng transaction nghiệp vụ. |
| Đối tác/agency | Module `interop` bọc `BookingService` qua `routes/api.php` + Sanctum | Bật route, phát API key. Lõi không đổi. |

Điểm mấu chốt: **`BookingService` là cửa duy nhất chạm concurrency**. Mọi mở rộng đi qua nó → không đẻ ra đường chống-trùng thứ hai để lệch nhau.

---

## 3. Hai hình dạng tồn kho — chừa cửa cho golf / lớp học / sự kiện

Đến giờ mọi thứ ta thiết kế thuộc **một hình dạng tồn kho**: *tài nguyên bị chiếm theo khung giờ* (sân — và spa cũng vậy). Nhưng có một hình dạng **thứ hai** mà vài ngách đặt chỗ cần — và câu hỏi *"sân golf thì sao?"* rơi đúng vào đó.

| | Resource-time-slot (đang làm) | Capacity / session (chừa cửa) |
|---|---|---|
| Ngách | Sân pickleball/cầu lông/tennis, spa | **Golf (tee time)**, lớp học, sự kiện, tour |
| Đơn vị đặt | Một tài nguyên bị chiếm khoảng `[start,end]` | Một **chỗ trong một suất** có sức chứa (tee time chứa 4) |
| Chống trùng | Exclusion constraint trên `tstzrange` | **UPDATE có điều kiện** `booked+held+qty ≤ capacity` |
| Availability | Compute-on-read từ giờ mở | Suất **vật chất hóa** (tee sheet mỗi N phút) |
| Người/booking | 1 khách | **Nhiều** (flight tối đa 4) |

**Hai hình dạng gặp nhau ở tầng `booking`** — đây là điểm chốt của việc chừa cửa: `BookingService` (giữ tạm → cọc → đối soát → confirm/grace/orphaned → nhắc → hủy/hoàn/bom), multi-tenant `WorkingTenant`, payment/VietQR, Zalo, `interop` **tái dùng 100%** cho cả hai hình dạng. Chỉ **tầng tồn kho + giá + người tham gia** là khác.

Bản platform gốc (`_archive-platform/`) **đã từng có** chế độ capacity này (`session` với `capacity/booked_qty/held_qty`); ta cắt đi để làm ngách sân cho gọn. Nên đây là **pattern đã biết, không phải phát minh mới** — chỉ dựng lại khi chạm ngách capacity.

**Đường di trú (chỉ khi thật sự làm golf/lớp học — KHÔNG phải bây giờ):**

| Cần thêm | Chi tiết |
|---|---|
| Bảng `session` (tee time / suất) | `capacity`, `booked_qty`, `held_qty`, `start_at`; job vật chất hóa tee sheet mỗi N phút |
| Nhánh capacity trong `BookingService` | `createHold` thêm đường: UPDATE điều kiện counter thay cho exclusion constraint — **cùng vòng đời, cùng cọc/đối soát** |
| Bảng `booking_participant` | Flight nhiều người chơi trên một booking |
| Giá phong phú hơn | Golf: green fee theo hội viên/khách/vãng lai, 9–18 hố, twilight, + caddie + buggy (mở rộng `pricing_rule`; caddie/xe dùng multi-resource ở mục 2) |

→ **`bookings`, payment, notification, interop, tenant KHÔNG đổi** — chỉ thêm một tồn kho song song. Ước lượng lõi phủ ~70% cho golf; ~30% còn lại là tồn kho + giá + flight.

> **Quan trọng — chừa cửa ≠ nên làm sớm, và "riêng" ≠ hệ thống khác.** Golf là **thị trường khác hẳn** (green fee 1–3tr+/vòng, kênh đại lý/doanh nghiệp/hội viên, vận hành caddie), nên là **dòng sản phẩm riêng về go-to-market** — nhưng **vẫn chạy chung nền tảng này** (xem nguyên tắc "một hệ thống, nhiều dòng sản phẩm" ở đầu doc). Gộp vào *bán* sớm = loãng tiêu điểm ([`00-dinh-huong-va-danh-gia.md`](00-dinh-huong-va-danh-gia.md)). Ta *thiết kế để mở được cửa*, không *bước qua cửa* lúc này.

---

## 4. Mở rộng sang vertical spa/nail từ court

Court là trường hợp *đơn giản nhất* của cùng một engine (resource bị chiếm theo khung giờ). Spa chỉ là court + vài lớp phủ:

| Khái niệm court | Spa/nail cần thêm | Bảng/cột thêm |
|---|---|---|
| `court` (resource thuần) | `resource` = **thợ/kỹ thuật viên** | Đổi tên khái niệm; cùng bảng, thêm `resource_type` |
| Khung giờ chọn tay | **Dịch vụ có thời lượng** (60' massage) + **buffer** dọn dẹp | Bảng `service(duration_min, buffer_min)`; `booking_slot` suy ra `end_at` từ duration |
| — | Thợ nào làm được dịch vụ nào | Bảng nối `resource_service` |
| Giá theo giờ | Giá theo **dịch vụ** | `pricing_rule` gắn `service_id` thay vì chỉ giờ |

**Engine hold + exclusion constraint + đối soát cọc + Zalo tái dùng 100%.** Đây là lý do chọn court trước: làm đúng lõi ở dạng đơn giản nhất, spa là phần mở rộng chứ không phải hệ thống mới. Xem lộ trình Phase 2 ở [`12-lo-trinh.md`](12-lo-trinh.md).

---

## 5. DB scaling khi tăng tải — kèm NGƯỠNG kích hoạt

**Đừng làm sớm.** Mỗi mục dưới đây chỉ bật khi chạm ngưỡng thật.

| Kỹ thuật | Làm khi nào (ngưỡng) | Ghi chú |
|---|---|---|
| Index dẫn đầu `tenant_id` | **Ngay từ đầu** | Mọi index nghiệp vụ: `(tenant_id, ...)`. Rẻ, bắt buộc. |
| Index GiST cho exclusion | **Ngay từ đầu** | Đi kèm exclusion constraint; vừa chống trùng vừa tăng tốc truy vấn khoảng thời gian. |
| Cache availability 30–60s | **Ngay từ đầu** | Đã có trong thiết kế ([`07-luong-du-lieu.md`](07-luong-du-lieu.md)). |
| Connection pooling (PgBouncer) | Khi > ~vài trăm kết nối đồng thời | Laravel + PHP-FPM sinh nhiều kết nối; PgBouncer transaction-mode giải quyết rẻ. |
| Read replica | Khi báo cáo/đọc availability đè nặng primary | Tách đọc báo cáo & availability sang replica; ghi (hold/đối soát) vẫn ở primary. |
| Partition `booking_slots`, `payments` theo tháng | Khi bảng > ~chục triệu dòng | Partition theo `start_at`/`created_at`; query gần đây chỉ chạm partition mới. |
| Tách DB / sharding theo tenant | **Gần như không bao giờ** cho quy mô này | Xem mục 6. |

**Single-DB đủ tới cỡ nào (ước lượng):** một Postgres trên VPS tầm trung thừa sức cho **hàng nghìn tenant** và **hàng chục triệu booking**. Với mục tiêu indie 30–100 tenant ([`00-dinh-huong-va-danh-gia.md`](00-dinh-huong-va-danh-gia.md)), bạn còn cách ngưỡng cần partition/replica **rất xa** — có thể không bao giờ chạm. Việc cần làm sớm chỉ là: index đúng + cache availability + backup.

---

## 6. Khi nào KHÔNG nên tách (chống cám dỗ)

Solo dev dễ chết vì kiến trúc phức tạp hơn vì thiếu kiến trúc.

- **Giữ modular monolith 1 Postgres.** Ranh giới module là *logic* (Service/Model), không phải network. Mọi bảo đảm giao dịch (exclusion constraint, đối soát idempotent, snapshot) **chỉ đúng khi ở trong một DB** ([`06-erd.md`](06-erd.md)).
- **Không microservices** cho tới khi có đội ≥ vài người và một service có tải/nhịp release thật sự khác biệt. Trước đó, tách = tự thêm việc vận hành 2h sáng.
- **Không multi-DB/sharding theo tenant** trừ khi có yêu cầu pháp lý cách ly dữ liệu (thường không) hoặc một tenant khổng lồ chiếm phần lớn tải. RLS + `tenant_id` + composite FK đã đủ cách ly.
- **Không event-sourcing/CQRS**: `audit_logs` + snapshot đã cho đủ vết lịch sử cần thiết.

Tín hiệu thật để cân nhắc tách: một phần hệ thống có SLA khác hẳn (vd cổng đối soát cần 99.99%), hoặc một tenant enterprise đòi cách ly cứng — lúc đó tách *đúng phần đó*, không tách cả hệ.

---

## 7. Bảng tổng: làm bây giờ vs chừa cửa vs không làm

| Việc | Trạng thái | Lý do |
|---|---|---|
| `tenant_id` mọi bảng + composite FK + RLS | ✅ Làm ngay | Nền multi-tenant, sau khó thêm |
| Index dẫn đầu `tenant_id` + GiST exclusion | ✅ Làm ngay | Rẻ, bắt buộc |
| Snapshot giá/cọc, `timestamptz`+`tz`, status enum | ✅ Làm ngay | Bất biến dữ liệu, sau không sửa được ([`11-diem-vo.md`](11-diem-vo.md)) |
| Cache availability | ✅ Làm ngay | Đơn giản, hiệu quả |
| `court_type` mở rộng, `booking_slot` mức item | 🚪 Chừa cửa | Thêm loại sân / multi-resource sau, 0 rewrite |
| Module `interop` tách sẵn | 🚪 Chừa cửa | Bật API/embed Phase 2 |
| `event_outbox` | 🚪 Chừa cửa | Thêm khi cần webhook đảm bảo |
| Lớp `service`/`resource_service` cho spa | 🚪 Chừa cửa | Vertical 2 cùng hình dạng, phủ lên engine sẵn có |
| Chế độ tồn kho **capacity/session** (golf/lớp/sự kiện) | 🚪 Chừa cửa | Hình dạng thứ 2; pattern đã có ở platform gốc, gặp nhau ở tầng `booking` (mục 3) |
| PgBouncer, read replica, partition | ⏸ Không làm sớm | Chỉ khi chạm ngưỡng tải (mục 5) |
| **Làm golf sớm như Phase-2** | ❌ Không làm | Thị trường khác hẳn (giá/kênh/hội viên) — beachhead riêng, dễ loãng tiêu điểm (mục 3) |
| Microservices, multi-DB, sharding, CQRS | ❌ Không làm | Over-engineer cho quy mô solo/indie |

**Kết luận:** kiến trúc hiện tại là "monolith nhàm chán nhưng chừa cửa đúng chỗ" — mở rộng bằng cách thêm bảng/module, không đập lõi. Cụ thể hóa từng bước ở [`12-lo-trinh.md`](12-lo-trinh.md).
