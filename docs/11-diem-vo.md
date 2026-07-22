# 11 — Sổ "Điểm vỡ" (bản ngách sân)

Những chỗ thiết kế ngây thơ sẽ sập sau vài tháng. Mỗi điểm đủ 3 vế: sai lầm → hậu quả → quyết định chặn (đã nằm trong [`06-erd.md`](06-erd.md)). Có thêm 3 điểm **đặc thù sân** mà app booking generic hay bỏ sót: đặt cố định, giá giờ vàng, đối soát VietQR.

---

### #1 — Giá đọc sống thay vì snapshot
- **Ngây thơ:** `booking_slots` đọc giá từ `pricing_rules` hiện hành.
- **Hậu quả:** chủ sân tăng giá giờ vàng → doanh thu các buổi đã đặt (kể cả series đang chạy) đổi hồi tố; khách cãi.
- **Chặn:** `price_snapshot` trên `booking_slots`, `price_per_session_snapshot` trên `recurring_series` — chụp lúc đặt.

### #2 — Double-booking một sân
- **Ngây thơ:** SELECT "sân này giờ này trống không?" rồi INSERT.
- **Hậu quả:** hai người đặt cùng lúc cùng thấy trống → cùng giữ giờ vàng; đúng lúc đông nhất.
- **Chặn:** `EXCLUDE USING gist (tenant_id, court_id, tstzrange)` — DB là trọng tài, race thua nhận 23P01 → 409. **Không bao giờ check-then-act.**

### #3 — Timezone
- **Ngây thơ:** lưu "19:00" không tz, hoặc coi giờ mở cửa là UTC.
- **Hậu quả:** đổi region server / suy diễn sai → khách tới sai giờ, lịch lệch hàng loạt.
- **Chặn:** thời điểm cụ thể = `timestamptz`; luật lặp (giờ mở, series) = giờ địa phương + cột `tz`.

### #4 — Materialize lưới slot rồi đổi giờ mở cửa
- **Ngây thơ:** sinh sẵn mọi slot 30 phút; đổi giờ mở → xóa & sinh lại.
- **Hậu quả:** xóa nhằm slot đang có booking → booking mồ côi/lỗi FK giữa đêm.
- **Chặn:** **không materialize** (compute-on-read); `opening_rule` versioned `effective_from/to` — đổi giờ = đóng rule cũ mở rule mới. Booking đã có đứng độc lập.

### #5 — Đặt cố định sinh buổi vô hạn
- **Ngây thơ:** tạo series → sinh ngay booking cho toàn bộ tương lai, hoặc coi series là "vô hạn".
- **Hậu quả:** hàng nghìn dòng vô nghĩa; hoặc series không bao giờ kết thúc, không đối soát được doanh thu; đổi giá/hủy phải sửa cả rừng.
- **Chặn:** `recurring_series` có `end_date` hữu hạn; **job cuốn chiếu** chỉ sinh buổi trong horizon gần (ví dụ 4 tuần), sinh thêm khi thời gian trôi tới `end_date` ([`07-luong-du-lieu.md`](07-luong-du-lieu.md) luồng b).

### #6 — Tiền dạng float
- **Ngây thơ:** `price DECIMAL/FLOAT`.
- **Hậu quả:** lệch 1đ khi cộng giờ hoặc đối soát với số tiền chuyển khoản → cả buổi tối đi tìm.
- **Chặn:** `BIGINT` VND nguyên + cột `currency`. Mọi phép tính tiền là số nguyên.

### #7 — Đối soát VietQR trùng / khớp sai
- **Ngây thơ:** nhận webhook Casso/SePay → `if chưa matched thì matched` trong code; khớp chỉ theo số tiền.
- **Hậu quả:** webhook gửi lại → cọc khớp 2 lần; hai booking cùng số tiền → khớp nhầm booking; giữ nhầm sân.
- **Chặn:** idempotency bằng `UNIQUE(bank_txn_id)` ở `bank_txn_inbox` + `payment`; khớp bằng **`memo` chứa `booking.code`** (mã duy nhất trên nội dung chuyển khoản), không chỉ số tiền. Số tiền lệch → để chủ sân xử tay, không auto-confirm.

### #8 — Webhook/tiền đến sau khi giữ tạm hết hạn
- **Ngây thơ:** hết hạn giữ tạm = từ chối, hoặc confirm mù.
- **Hậu quả:** nuốt tiền khách (đã chuyển mà mất sân, không ai biết), hoặc giữ chồng sân.
- **Chặn:** 3 nhánh tường minh khi đối soát: còn hạn → confirm; hết hạn + sân còn → **grace giữ lại**; sân mất → `orphaned` + refund tự sinh + báo hai phía ([`07-luong-du-lieu.md`](07-luong-du-lieu.md) luồng a).

### #9 — FK xuyên tenant
- **Ngây thơ:** FK theo `id` đơn.
- **Hậu quả:** bug cho cơ sở A giữ sân của cơ sở B; báo cáo lộ chéo dữ liệu.
- **Chặn:** composite FK `(tenant_id, id)` + `UNIQUE(tenant_id, id)` + RLS. Ba lớp.

### #10 — Trạng thái bằng cờ boolean
- **Ngây thơ:** `is_paid`, `is_cancelled`, `is_no_show`.
- **Hậu quả:** xuất hiện dòng vừa paid vừa cancelled vừa no_show — không ai hiểu.
- **Chặn:** một cột `status` ENUM + state machine trong code + `audit_logs` ghi mọi transition kèm actor.

### #11 — Hoàn cọc sửa thẳng payment
- **Ngây thơ:** hủy → set `payment.amount = 0` hoặc `refunded = true`.
- **Hậu quả:** mất dấu số tiền gốc; đối soát doanh thu sai; tranh chấp không có bằng chứng.
- **Chặn:** `refund` là ledger riêng trỏ payment; `payment.amount` bất biến; `SUM(refund.amount) <= payment.amount`.

### #12 — Sửa/xóa sân khi còn booking
- **Ngây thơ:** xóa cứng `court` khi chủ sân bỏ một sân.
- **Hậu quả:** booking lịch sử + series trỏ vào sân đã xóa → lỗi FK, báo cáo vỡ.
- **Chặn:** **soft-delete** (`court.status='archived'`); sân archived không nhận đặt mới nhưng booking cũ vẫn tham chiếu được.

---

## Nguyên tắc chung

1. **Bất biến sống ở DB constraint, không ở if-check** (#2, #7, #9, #10) — code có race, constraint thì không.
2. **Lịch sử là snapshot, hiện hành là FK** (#1, #11, #12) — cái đã chốt với khách thì đóng băng.
3. **Luật versioned, sự kiện bất biến, sinh có horizon** (#4, #5) — không sửa đè quá khứ, không sinh vô hạn.
4. **Tiền và trạng thái không có kiểu "gần đúng"** (#6, #10).
5. **Đối soát khớp bằng mã duy nhất, không bằng số tiền** (#7) — đặc thù VietQR.
