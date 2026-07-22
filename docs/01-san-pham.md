# 01 — Sản phẩm

Đi sâu vào đặc thù sân: ai dùng, khách vào đặt bằng đường nào, và những tính năng mà một app booking generic luôn làm hụt.

## 1. Hai người dùng

**Chủ sân (người trả tiền).** Có 4–10 sân pickleball/cầu lông. Đau vì: bom sân giờ vàng, quản lý khách đặt cố định bằng sổ/Zalo dễ nhầm, ôm điện thoại chốt lịch cả ngày. Muốn: xem lịch tất cả sân trên điện thoại, biết ai đã cọc, hết chồng lịch.

**Người chơi (khách của chủ sân).** Muốn đặt sân nhanh, thấy sân nào trống giờ nào, chuyển khoản cọc giữ chỗ, được nhắc trước khỏi quên. **Đã quen** đặt trước + chuyển khoản — không phải học gì mới.

## 2. Mặt tiền — khách vào đặt sân bằng đường nào

Ba lớp, **lớp 1 là mặc định ai cũng có**, hai lớp sau là tùy chọn:

| Lớp | Là gì | Cho ai | Phase |
|---|---|---|---|
| **1. Trang đặt sân trên hệ thống** (mặc định) | Mỗi chủ sân có sẵn **một trang đặt sân riêng** host trên hệ thống (subdomain, ví dụ `sancualong.datsan.vn`), có thương hiệu (logo, màu, ảnh, danh sách sân/giá) qua **template + cài đặt**. Mobile-first. Link này gắn vào Zalo OA / Fanpage / bio để khách bấm vào đặt. | **Mọi chủ sân** — không cần có web sẵn | **1** |
| **2. Nhúng vào web có sẵn** (tùy chọn) | Script embed `<script>` hoặc plugin WordPress `[datsan]` để chủ sân nào **đã có web riêng** cắm luồng đặt sân vào đó. | Chủ sân đã có WordPress/Wix/web AI-build | 2 |
| **3. Dịch vụ setup/làm đẹp trang** (tùy chọn, có phí) | Bạn setup hộ + chọn/chỉnh template + gắn thương hiệu cho chủ sân (vẫn trên template, không bespoke). Thu phí một lần. | Chủ sân ngại tự làm | 1 (thủ công) → sản phẩm hóa sau |

**Điểm mấu chốt kiến trúc:** cả ba lớp **gọi chung một booking engine** — trang hệ thống, widget nhúng, plugin WordPress đều đi qua đúng một giao diện công khai của `booking` ([`08`](08-thiet-ke-module-chi-tiet.md)). Một nguồn chống-trùng, một nguồn tiền, dù khách vào từ mặt tiền nào.

> **Zalo là kênh với tới + nhắc, không phải nơi chứa trang.** Trang đặt sân sống trên hệ thống; Zalo OA/ZNS dùng để khách bấm link vào đặt và để gửi xác nhận/nhắc lịch.

## 3. Luồng đặt sân (người chơi)

```
Khách bấm link trang đặt sân của sân (từ Zalo OA / Fanpage / bio) — hoặc widget nhúng trên web sân
  → chọn ngày + khung giờ
  → thấy sân nào còn trống, giá giờ vàng/thường tự hiện đúng
  → chọn sân + xác nhận
  → thấy tiền CỌC cần chuyển
  → QR VietQR hiện ra (nội dung chuyển khoản = MÃ ĐẶT, ví dụ SAN-3F7K)
  → khách chuyển khoản qua app ngân hàng
  → hệ thống ĐỐI SOÁT TỰ ĐỘNG vài giây (Casso/SePay) → khớp số tiền + nội dung
  → giữ chỗ chắc chắn + gửi Zalo ZNS xác nhận (sân, giờ, địa chỉ)
  → nhắc trước 1 ngày + trước 2 tiếng qua Zalo
  → nếu bom: cọc xử lý theo chính sách sân
```

Điểm mấu chốt: **giữ chỗ chỉ chắc chắn SAU khi đối soát thấy tiền** — trước đó là "giữ tạm" có hạn (ví dụ 10 phút), hết hạn tự nhả để người khác đặt. Xem [`07-luong-du-lieu.md`](07-luong-du-lieu.md) luồng (a).

## 4. Màn hình chủ sân

- **Lịch dạng lưới:** trục ngang = sân, trục dọc = giờ; ô đã đặt hiện tên khách + trạng thái cọc (đã cọc / chờ cọc / khách quen cố định).
- **Đặt hộ khách vãng lai:** khách gọi điện/tới trực tiếp → chủ sân đặt tay, đánh dấu **trả tiền mặt** (không cần cọc VietQR).
- **Quản lý khách đặt cố định:** danh sách các "suất cố định hàng tuần", còn mấy buổi, đã thu tiền tới đâu.
- **Hoàn cọc một chạm:** khi hủy hợp lệ.
- **Tùy biến trang đặt sân:** đổi logo, màu, ảnh bìa, mô tả — trong khuôn khổ template (không kéo-thả tự do).
- **Cảnh báo bom:** khách nào hay bom (đánh dấu, Phase 2).

## 5. Tính năng đặc thù sân — phần một app generic hay làm hụt

### (a) Đặt cố định hàng tuần (recurring) — nguồn doanh thu #1 của sân
Khách ruột giữ "19h–21h thứ 3 hàng tuần, sân số 2, trong 8 tuần". Cần:
- Tạo một **series**: sân + thứ + giờ + số buổi (hoặc khoảng ngày).
- Thu cọc/tiền cho cả series (hoặc theo tháng).
- Sinh các buổi cụ thể ra lịch, **giữ chỗ cả loạt** để không ai đặt chèn.
- Hủy **một buổi** trong series (khách báo nghỉ hôm đó) mà series vẫn tiếp tục.
- Chi tiết kỹ thuật: [`07-luong-du-lieu.md`](07-luong-du-lieu.md) luồng (b).

### (b) Giá giờ vàng / giờ thường (peak pricing)
Giờ tối + cuối tuần đắt hơn giờ trưa ngày thường. Cần luật giá theo **thứ + khoảng giờ**; giá được tính lúc đặt và **chụp lại** vào booking (đổi bảng giá sau không ảnh hưởng đặt cũ — [`11-diem-vo.md`](11-diem-vo.md) #1).

### (c) Nhiều sân song song (multi-court)
Một cơ sở có N sân giống nhau. Khách chọn giờ → hệ thống hiện các sân còn trống → **tự gán sân trống** hoặc để khách chọn sân cụ thể. Availability tính trên tất cả sân cùng lúc.

### (d) Cọc chống bom + chính sách
- Cọc một phần (ví dụ 50k/giờ) hoặc trả đủ — chủ sân cấu hình.
- Bom sân → cọc theo chính sách: **giữ cọc** (mất), hoặc chuyển buổi. Ghi rõ trạng thái `no_show`.
- Hủy sớm (trước X giờ) → hoàn cọc; hủy muộn → giữ cọc.

### (e) Giờ mở cửa + ngày nghỉ
Luật giờ mở theo thứ; nghỉ lễ/bảo trì (blackout) chặn đặt.

## 6. Phạm vi MVP — làm gì, KHÔNG làm gì

**Có (Phase 1):**
- **Trang đặt sân riêng trên hệ thống** (template có thương hiệu) — mặc định mọi chủ sân
- Đặt sân một lần + đặt cố định hàng tuần
- Cọc VietQR + đối soát tự động
- Giá giờ vàng/thường, nhiều sân
- Zalo ZNS xác nhận + nhắc lịch
- Lịch chủ sân trên điện thoại, đặt hộ khách vãng lai, hoàn cọc
- Giá thuê phần mềm **flat** theo số sân (ví dụ 199–399k/tháng)

**Tùy chọn (Phase 2+):** widget nhúng + plugin WordPress cho ai đã có web; webhook ra CRM/kế toán.

**KHÔNG làm (commodity hoặc lệch lời hứa):**
- ❌ Builder kéo-thả module/page tự do — thứ AI/WordPress/Wix đã cho không; ta bán backend họ không build được, không đi thi dựng trang
- ❌ Headless "cổng developer" đồ sộ — chỉ cần một API + widget + plugin gọn (`interop`)
- ❌ Metered billing theo lượt — chủ sân muốn giá cố định
- ❌ Cổng thanh toán (VNPay/MoMo) — VietQR đủ và tốt hơn cho cọc (Phase 2 nếu cần)
- ❌ Ghép sân/chia tiền, bán đồ/nước, chấm công — ngoài lời hứa cốt lõi

Nguyên tắc: **mọi thứ không phục vụ trực tiếp "hết bom sân + hết rối đặt cố định" đều để sau.**
