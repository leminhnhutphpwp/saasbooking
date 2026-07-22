# 10 — Tình huống phát sinh (toàn diện)

Sổ **tình huống nghiệp vụ vận hành** — mọi kịch bản éo le có thể xảy ra khi hệ thống chạy thật, và cách xử lý. Khác với [`11-diem-vo.md`](11-diem-vo.md) (là về *thiết kế schema/bất biến dữ liệu*): doc này là về *hành vi nghiệp vụ*. Luồng chi tiết ở [`07-luong-du-lieu.md`](07-luong-du-lieu.md); yêu cầu gốc ở [`02-yeu-cau-chuc-nang.md`](02-yeu-cau-chuc-nang.md).

Quy ước trạng thái **booking** (xem [`06-erd.md`](06-erd.md)): `pending_deposit` (giữ tạm chờ cọc, có TTL) → `confirmed` (đã cọc) → `completed` / `cancelled` / `no_show` / `expired`. (Lưu ý: `holding` là giá trị của `booking_slots.hold_status`, KHÔNG phải trạng thái booking.)

Mục tiêu: đọc xong thấy **mọi thứ éo le đều đã có đường xử lý**.

---

## Nhóm 1 — Concurrency (tranh chấp giữ chỗ)

| Mã | Tình huống | Hành vi mong đợi | Cơ chế xử lý |
|---|---|---|---|
| C1 | Hai người cùng bấm giữ ô cuối cùng của một sân, cách nhau mili-giây | Đúng một người thắng, người kia thấy "ô vừa có người giữ" | Exclusion constraint (`booking_slots`, GIST trên `tstzrange`) — kẻ thua bị DB từ chối ở commit, app bắt lỗi trả 409, gợi ý ô khác. Xem [`11-diem-vo.md`](11-diem-vo.md) |
| C2 | Đặt cố định (series) sinh buổi rơi trúng một booking lẻ đã tồn tại | Buổi đó KHÔNG được tạo; các buổi còn lại vẫn tạo | Sinh buổi cũng đi qua exclusion constraint; buổi xung đột báo cho chủ sân xử tay (đổi giờ/sân), không chèn đè |
| C3 | Chủ sân đặt hộ (walk-in) đúng ô mà một khách online đang `holding` chờ cọc | Chủ sân thấy ô đang được giữ tạm; muốn ép vẫn được (ưu tiên quầy) → hủy giữ tạm kia + thông báo | Giữ tạm hiển thị rõ trên lịch chủ sân; hành động "ép đặt" ghi audit + nhả `holding` cũ |
| C4 | Hai buổi liền kề (17–18h và 18–19h) cùng sân | KHÔNG coi là trùng | `tstzrange` dùng biên `[)` (đóng-mở), 18:00 không chồng |
| C5 | Cùng một người mở 2 tab, giữ 2 ô khác nhau | Cho phép; mỗi ô một `holding` riêng | Không khóa theo người, khóa theo (sân, khoảng thời gian) |

---

## Nhóm 2 — Thanh toán / cọc (VietQR + đối soát)

| Mã | Tình huống | Hành vi mong đợi | Cơ chế xử lý |
|---|---|---|---|
| P1 | Khách chuyển **thiếu** tiền cọc | KHÔNG auto-confirm; treo chờ chủ sân xử (nhắc khách bù, hoặc chấp nhận) | Đối soát so `amount` với `deposit_amount`; lệch → **KHÔNG gọi `confirm`; giao dịch treo ở `bank_txn_inbox` và vào hàng chờ "đối soát tay"** cho chủ sân quyết. Xem [`07-luong-du-lieu.md`](07-luong-du-lieu.md) |
| P2 | Khách chuyển **dư** tiền | Không auto-confirm; đưa chủ sân quyết (xác nhận + hoàn/cấn phần dư) | Số tiền ≠ `deposit_amount` → **không auto-khớp; vào hàng chờ đối soát tay** (không đặt status mới); chủ sân xác nhận và xử phần dư |
| P3 | Khách chuyển **đúng tiền nhưng sai/thiếu nội dung** (không có mã đặt) | KHÔNG auto-khớp; vào hàng chờ "giao dịch chưa khớp" để chủ sân gán tay | Khớp bắt buộc theo `memo` chứa mã đặt; không khớp → `bank_txn_inbox` chờ đối soát tay |
| P4 | Tiền về **sau khi hết giữ tạm**, sân **vẫn còn trống** | Ân hạn (grace): vẫn confirm cho khách | Nhánh grace trong đối soát: thử tái-giữ ô; thành công → confirm. Xem [`07-luong-du-lieu.md`](07-luong-du-lieu.md) |
| P5 | Tiền về **sau khi hết giữ tạm**, sân **đã bị người khác đặt** | Không giật chỗ người mới; đánh dấu `orphaned` + tự động khởi tạo hoàn tiền + báo khách | Nhánh orphaned: tạo yêu cầu `refund`, thông báo xin lỗi + hoàn cọc |
| P6 | Khách **chuyển 2 lần** cho cùng booking | Confirm 1 lần; lần 2 ghi nhận dư để hoàn | Idempotency theo `bank_txn_id`; lần 2 là giao dịch khác → booking đã `matched` nên **không confirm lại; giao dịch dư vào hàng chờ đối soát tay** để chủ sân hoàn |
| P7 | Ngân hàng/SePay gửi **webhook trùng** (cùng giao dịch) | Xử lý đúng 1 lần | `bank_txn_inbox.bank_txn_id` UNIQUE → bản ghi trùng bị bỏ qua. Xem [`11-diem-vo.md`](11-diem-vo.md) |
| P8 | Hai booking **cùng số tiền cọc**, khách A chuyển nhưng nội dung mơ hồ | Không được khớp nhầm sang booking B | Khớp theo mã đặt trong `memo`, KHÔNG khớp chỉ theo số tiền; mơ hồ → đối soát tay |
| P9 | Khách bảo "**đã chuyển rồi**" nhưng webhook chưa về (ngân hàng trễ) | Giữ tạm còn hiệu lực trong TTL; chủ sân có nút "đối soát tay" để xác nhận nếu thấy tiền trong app ngân hàng | Kéo dài/gia hạn `holding` thủ công; hoặc chờ webhook; hiển thị trạng thái "đang chờ xác nhận CK" |
| P10 | Khách hoàn tất chuyển khoản nhưng đóng trình duyệt trước khi thấy xác nhận | Vẫn confirm khi webhook về; gửi ZNS/Zalo xác nhận | Đối soát bất đồng bộ, không phụ thuộc client còn mở |
| P11 | SePay/Casso đổi định dạng payload hoặc downtime | Không mất giao dịch; đối soát lại được | Lưu payload thô vào `bank_txn_inbox`; có thể replay; giám sát khoảng trống |

---

## Nhóm 3 — Hủy & Bom sân

| Mã | Tình huống | Hành vi mong đợi | Cơ chế xử lý |
|---|---|---|---|
| H1 | Khách hủy **sớm** (trước ngưỡng chính sách) | Hoàn cọc theo chính sách; nhả ô | `cancel_policy_snapshot` chụp lúc đặt quyết định % hoàn; tạo `refund` |
| H2 | Khách hủy **sát giờ** (sau ngưỡng) | Giữ cọc (mất) theo chính sách; nhả ô cho người khác | Chính sách snapshot; không hoàn hoặc hoàn một phần |
| H3 | Khách **bom** (không tới, không báo) | Đánh dấu `no_show`; giữ cọc; ghi vào lịch sử khách để cảnh báo lần sau | Chủ sân bấm `no_show` sau giờ; hoặc job auto sau X phút; đếm số lần bom/khách |
| H4 | Chủ sân **hủy cả buổi** (mưa, mất điện, sự cố) | Hoàn cọc 100% cho mọi khách buổi đó; thông báo | **MVP:** chủ sân hủy **thủ công từng booking** trên màn Lịch (mỗi lần tạo `refund` + gửi ZNS). Hủy hàng loạt theo sân/khoảng giờ là **Phase 2** |
| H5 | Sân **bảo trì đột xuất** khi đã có booking tương lai | Chặn đặt mới + cảnh báo các booking đã có để chủ sân dời/hoàn | Tạo `blackout`; hệ thống liệt kê booking vướng, không tự xóa — chủ sân quyết dời/hoàn |
| H6 | **Hoàn cọc thất bại** (khách đổi số TK, sai STK) | Không mất dấu; treo "chờ hoàn" để xử lại | `refunds.status ∈ (requested, failed, done)`; chủ sân nhập lại STK, thử lại |
| H7 | Khách yêu cầu hoàn nhưng đã quá lâu / đã `completed` | Theo chính sách; mặc định không hoàn sau khi đã sử dụng | Chặn theo trạng thái + chính sách |

---

## Nhóm 4 — Đặt cố định (series)

| Mã | Tình huống | Hành vi mong đợi | Cơ chế xử lý |
|---|---|---|---|
| S1 | Khách xin **nghỉ 1 buổi** trong series | Chỉ buổi đó hủy (hoàn/bảo lưu theo thỏa thuận); series tiếp tục | Hủy 1 `booking` con; series giữ nguyên; ô buổi đó mở lại cho người khác |
| S2 | Khách muốn **đổi sân/giờ giữa chừng** | Kết thúc series cũ từ mốc X, tạo series mới từ mốc đó | Không sửa quá khứ; tách series, giữ lịch sử |
| S3 | Buổi rơi vào **lễ/tết/ngày đóng cửa** | Buổi đó không sinh (hoặc sinh rồi tự hủy); không tính tiền | Kiểm tra `blackout`/lịch nghỉ khi sinh buổi; bỏ qua ngày đóng cửa |
| S4 | **Gia hạn** cuối kỳ (khách muốn đá tiếp) | Tạo series mới nối tiếp; giữ ưu tiên khung giờ cho khách ruột | Nhắc chủ sân trước khi series hết; tạo series kế tiếp |
| S5 | Chủ sân **tăng giá** giữa lúc series đang chạy | Các buổi đã chốt giữ giá cũ (snapshot); buổi tương lai chưa sinh áp giá mới khi gia hạn | `price_snapshot` theo từng buổi; series không tự đổi giá đã cam kết |
| S6 | Khách **bỏ ngang** khi còn nợ tiền các buổi đã đá | Chủ sân xử tay theo thỏa thuận | **Theo dõi công nợ ngoài phạm vi MVP** — xử lý tay; mô hình công nợ (bảng/FR/màn hình) để **Phase 2+** |
| S7 | Sinh buổi cuốn chiếu nhưng một buổi tương lai **vướng lịch** (ai đó đã đặt lẻ) | Buổi vướng không sinh, báo chủ sân; các buổi khác vẫn sinh | Xem C2 |
| S8 | Khách đặt cố định nhưng **chưa cọc** cho các buổi | Giữ tạm có giới hạn / yêu cầu cọc kỳ đầu; không giữ vô thời hạn | Chính sách cọc cho series; buổi chưa cọc có thể hết hạn giữ |

---

## Nhóm 5 — Vận hành & cấu hình

| Mã | Tình huống | Hành vi mong đợi | Cơ chế xử lý |
|---|---|---|---|
| O1 | Chủ sân **đổi bảng giá** khi đã có booking tương lai | Booking đã tạo giữ giá đã chốt; chỉ booking mới áp giá mới | `price_snapshot` trên `booking_slots`. Xem [`11-diem-vo.md`](11-diem-vo.md) |
| O2 | Chủ sân **archive/xóa sân** còn booking tương lai | Không xóa cứng; cảnh báo các booking còn lại để dời/hoàn trước | Soft-delete/`status=archived`; chặn đặt mới; liệt kê booking vướng |
| O3 | Chủ sân **đổi giờ mở cửa** | Booking cũ ngoài giờ mới vẫn giữ; đặt mới theo giờ mới | Giờ mở là cấu hình đọc lúc tính lịch trống, không ảnh hưởng booking đã chốt |
| O4 | **Lệch múi giờ / DST** (dù VN không DST, nhưng thiết kế phải đúng) | Mọi thời điểm nhất quán | Lưu UTC + hiển thị theo tz cơ sở (`Asia/Ho_Chi_Minh`). Xem [`11-diem-vo.md`](11-diem-vo.md) |
| O5 | Chủ sân **đổi chính sách cọc/hủy** | Booking cũ theo chính sách lúc đặt; booking mới theo chính sách mới | `cancel_policy_snapshot` theo từng booking |
| O6 | Chủ sân **đổi số tài khoản nhận cọc** | Booking mới dùng STK mới; QR đang chờ vẫn hợp lệ theo STK cũ | Cấu hình bank theo tenant; QR chụp STK tại thời điểm tạo |
| O7 | Đổi **thời lượng khung** (60→90 phút) | Chỉ áp cho đặt mới | Cấu hình đọc lúc tạo booking |

---

## Nhóm 6 — Zalo & thông báo

| Mã | Tình huống | Hành vi mong đợi | Cơ chế xử lý |
|---|---|---|---|
| Z1 | Khách **chưa follow OA** → không gửi ZNS được | Không mất thông báo; fallback | Thứ tự fallback: ZNS → SMS → email → hiển thị mã tra cứu trên trang xác nhận |
| Z2 | ZNS **lỗi / hết quota** | Retry có giới hạn; rồi fallback; cảnh báo chủ sân nạp quota | Job gửi có retry + backoff (Horizon); đánh dấu `failed` sau N lần |
| Z3 | **Nhắc lịch trùng** (job chạy 2 lần) | Chỉ gửi 1 lần | Cờ `reminded_at` trên booking; idempotent theo (booking, loại nhắc) |
| Z4 | Khách **hủy** ngay sau khi hệ thống vừa xếp lịch nhắc | Không gửi nhắc cho booking đã hủy | Job nhắc lọc theo trạng thái `confirmed` tại thời điểm gửi |
| Z5 | Nhắc gửi đúng lúc **đổi giờ/dời sân** | Nội dung nhắc phản ánh trạng thái mới nhất | Render nội dung lúc gửi, không cache nội dung cũ |
| Z6 | Sai/không có số điện thoại khách | Bỏ kênh SMS/ZNS, dùng kênh còn lại; nhắc chủ sân bổ sung | Validate liên hệ; fallback |

---

## Nhóm 7 — Đa tenant & phân quyền

| Mã | Tình huống | Hành vi mong đợi | Cơ chế xử lý |
|---|---|---|---|
| T1 | `super_admin` chuyển sang cơ sở khác để hỗ trợ | Chuyển được; mọi thao tác ghi audit theo cơ sở đang chọn | `WorkingTenant` cho phép super_admin đổi; scope theo cơ sở đang chọn |
| T2 | Nhân viên **chưa được gán cơ sở** | Không thấy dữ liệu cơ sở nào; hiển thị hướng dẫn liên hệ chủ | Middleware chặn khi thiếu tenant gán |
| T3 | Nhân viên cơ sở A **cố xem/sửa dữ liệu cơ sở B** (đổi URL/id) | Bị chặn hoàn toàn | Scope `tenant_id` + policy; ID cơ sở lấy từ `WorkingTenant`, không tin tham số client |
| T4 | Chủ sân có **nhiều cơ sở** | Chuyển qua lại; dữ liệu tách bạch | `WorkingTenant` + bộ chọn cơ sở |
| T5 | Rò rỉ dữ liệu qua đối soát/webhook (giao dịch của cơ sở này khớp booking cơ sở khác) | Không xảy ra | Mã đặt gắn cơ sở; đối soát trong phạm vi tenant |

---

## Nhóm 8 — Biên thời gian & tiền

| Mã | Tình huống | Hành vi mong đợi | Cơ chế xử lý |
|---|---|---|---|
| B1 | Đặt khung **vắt qua nửa đêm** (23:30–00:30) | Xử lý đúng một khoảng liên tục | Dùng `tstzrange` timestamp thật, không tách theo ngày |
| B2 | Đặt **sát giờ đóng cửa** (kết thúc đúng giờ đóng) | Cho phép nếu nằm trọn trong giờ mở | Kiểm tra khung ⊆ giờ mở cửa |
| B3 | Đặt **quá sát hiện tại** (còn 5 phút nữa bắt đầu) | Theo cấu hình "đặt trước tối thiểu"; mặc định chặn nếu quá gấp để kịp cọc | Ngưỡng lead-time cấu hình được |
| B4 | **Số tiền cọc lẻ** (12.500đ) | Tính và đối soát chính xác | Tiền dạng số nguyên (đồng), không dùng float. Xem [`11-diem-vo.md`](11-diem-vo.md) |
| B5 | **Hết hạn giữ tạm đúng lúc** khách bấm "Tôi đã chuyển" | Xử lý dứt khoát một trạng thái | Kiểm tra TTL trong transaction; hết hạn → nhả + báo đặt lại; còn hạn → chờ đối soát |
| B6 | Đặt **quá xa tương lai** (đặt cho 1 năm sau) | Theo cấu hình giới hạn tầm đặt | Ngưỡng "đặt trước tối đa" cấu hình |
| B7 | Khung giờ **không chia đều** (sân mở 6h–22h, khung 90 phút) | Sinh khung hợp lệ, không lố giờ đóng | Thuật toán sinh lịch trống theo bước + biên |

---

## Nhóm 9 — Kỹ thuật & hạ tầng

| Mã | Tình huống | Hành vi mong đợi | Cơ chế xử lý |
|---|---|---|---|
| K1 | Webhook đối soát đến **khi app đang deploy** | Không mất giao dịch | Ghi vào `bank_txn_inbox` trước, xử lý sau; hoặc nhà cung cấp retry; endpoint idempotent |
| K2 | **Job Horizon fail** giữa chừng (gửi ZNS, sinh series) | Tự retry; không tạo trùng | Job idempotent + retry/backoff; theo dõi `failed_jobs` |
| K3 | **DB timeout / deadlock** đúng lúc giữ chỗ | Giao dịch rollback sạch, khách được báo thử lại | `DB::transaction` bao trọn; không để `holding` mồ côi |
| K4 | Nhiều webhook đối soát dồn cùng lúc (giờ cao điểm) | Xử lý tuần tự an toàn | Hàng đợi; khóa theo giao dịch; idempotency |
| K5 | Job **hết hạn giữ tạm** (expire holds) không chạy do worker chết | Không giữ chỗ vĩnh viễn | Cron/Horizon giám sát; TTL cũng kiểm tra lazy khi đọc lịch trống |
| K6 | Trùng lặp gửi email/ZNS do at-least-once của queue | Người nhận thấy 1 lần (chấp nhận hiếm khi 2) | Cờ idempotent + dedup theo (booking, loại) |
| K7 | Khôi phục sau sự cố: cần **đối soát lại** một khoảng thời gian | Replay được từ `bank_txn_inbox` | Lưu payload thô + có công cụ đối soát lại |

---

## Nguyên tắc xử lý xuyên suốt

1. **Không bao giờ nuốt tiền im lặng** — mọi khoản không khớp/không giữ được chỗ đều thành `refund` hoặc hàng chờ xử lý tay.
2. **Không tự sửa quá khứ** — đổi giá/chính sách/giờ chỉ áp cho cái mới; cái đã chốt dùng snapshot.
3. **Idempotent mọi cửa vào bất đồng bộ** — webhook, job, nhắc lịch đều chịu được chạy lại.
4. **Chủ sân là người quyết cuối** ở các ca mờ (thiếu/dư tiền, ép đặt, bảo trì) — hệ thống đưa hàng chờ + gợi ý, không tự ý.
5. **Luôn có fallback thông báo** — ZNS → SMS → email → mã tra cứu trên màn hình.
