# 00 — Định hướng & Đánh giá khả năng thành công

## 1. Định vị

> **"Mỗi chủ sân có trang đặt sân riêng, thu cọc VietQR chống bom, nhắc lịch tự động qua Zalo — cho sân pickleball / cầu lông."**

Không phải nền tảng đa ngành. Không phải builder kéo-thả. Là **một trợ lý đặt sân bán một lời hứa duy nhất: chủ sân hết bom sân, hết ôm trống giờ vàng.** Chủ sân có ngay trang đặt sân riêng trên hệ thống; ai đã có web riêng thì nhúng vào (tùy chọn); Zalo là kênh với tới khách + nhắc lịch.

## 2. Vì sao ngách thắng platform (với solo dev)

- Khác biệt của platform nằm ở **kiến trúc** (headless, builder) — thứ chủ sân không nhìn thấy, không trả tiền. Đó là lối mòn.
- Khác biệt của ngách nằm ở **một nỗi đau cụ thể + một cộng đồng cụ thể** — chủ sân hiểu ngay và kể cho nhau nghe.
- Trong booking (red ocean), **feature bị copy trong vài tuần**. Moat solo dev giữ được là **phân phối trong cộng đồng + nhúng sẵn trong Zalo**, không phải công nghệ.

## 3. Vì sao chọn beachhead sân pickleball / cầu lông

Rào cản lớn nhất của cả loại dự án này là **thay đổi hành vi**, không phải giá. Với sân, khách **đã** đặt trước + chuyển khoản giữ chỗ — bạn chỉ số hóa hành vi có sẵn. Đây là điểm khác biệt sống còn so với spa/nail (nơi bắt cọc là thay đổi hành vi).

| Yếu tố | Sân pickleball / cầu lông | Nail / spa |
|---|---|---|
| **Đặt cọc giữ chỗ** | **Đã là chuẩn mực** — không cần đổi hành vi | Chưa phổ biến → phải thuyết phục |
| Thị trường | Pickleball bùng nổ 2024–2026, sân mọc khắp nơi, chủ trẻ chịu công nghệ | Khổng lồ nhưng phần mềm đã bão hòa (Myspa, Salo, EasySalon...) |
| Đối thủ phần mềm | Mỏng, gần đất trống | Dày, đã có đội sales |
| Khách hàng | Chủ 4–10 sân, chi trả cao hơn, nỗi đau rõ | Tiệm 1–2 ghế, siêu nhạy giá |
| Phân phối | Cộng đồng chơi trên FB/Zalo cực kết dính, lan truyền nhanh | Phân tán |
| Engine | Đơn giản (sân = tài nguyên, không thợ/dịch vụ/thời lượng) | Phức tạp (thợ × dịch vụ × thời lượng) |

**Nỗi đau chủ sân trả tiền để giải:**
1. **Bom sân** — khách đặt giờ vàng rồi không tới, sân trống, mất tiền.
2. **Đặt cố định rối** — khách ruột giữ khung giờ hàng tuần, quản lý bằng sổ/Zalo dễ nhầm, chồng lịch.
3. **Ôm điện thoại chốt Zalo** — chủ sân trả lời tin nhắn cả ngày, tối vẫn phải chốt lịch.

## 4. Rủi ro riêng của hướng sân (không giấu)

- Cần **đặt cố định hàng tuần** (khách ruột giữ 19h thứ 3), **giá giờ vàng/giờ thường**, **quản lý nhiều sân song song** — tính năng thật, đừng coi nhẹ (chi tiết [`01-san-pham.md`](01-san-pham.md)).
- Đã có vài app đặt sân ở VN — mỏng hơn spa nhưng không phải zero. Khác biệt phải là **cọc + Zalo + phân phối cộng đồng**, không phải "cũng có lịch".
- Sân lớn có thể đã dùng Google Sheet + Zalo pinned message — "đủ tốt" với họ; phải cho thấy tiền cứu được từ chống bom.

## 5. Đánh giá khả năng thành công (định lượng, công tâm)

| Lớp rủi ro | Mức | Ghi chú |
|---|---|---|
| Khả thi kỹ thuật (solo) | **Cao ~90%** | Engine đơn giản hơn bản platform; không builder/headless/metered |
| Hoàn thành sản phẩm | **Trung bình** | MVP ngách ~2–2,5 tháng (so với 12–18 tháng bản platform) |
| Go-to-market | **Trung bình–cao** | Vẫn là phần khó nhất, nhưng cộng đồng pickleball kết dính giúp phân phối |
| Hành vi khách | **Thấp** ✓ | Đặt cọc đã là thói quen — rủi ro lớn nhất được xóa |

**Xác suất theo mốc:**

| Mốc | Xác suất | So với bản platform |
|---|---|---|
| Ship được MVP | ~85% | ▲ (70%) |
| Đạt 8–10 sân trả phí | ~35% | ▲ (25%) |
| Indie bền vững 30–60 sân, 15–40tr MRR | ~12–15% | ▲ (8–10%) |
| Mở rộng đa ngách (spa, sân khác) | tùy Phase 2 | — |

Ngách nâng xác suất ở **mọi lớp** so với platform, chủ yếu nhờ: engine đơn giản hơn, hành vi khách có sẵn, cộng đồng phân phối tốt hơn.

## 6. Moat — vẫn không nằm ở tính năng

Cọc + nhắc Zalo **copy được**. Cái không copy được:
1. **Sống trong cộng đồng pickleball** — chủ sân giới thiệu chủ sân; bạn là "người làm phần mềm sân của dân pickleball".
2. **Nhúng trong Zalo** — nơi cả chủ sân lẫn người chơi đang ở sẵn.
3. **Đối soát VietQR mượt + đặt cố định làm tới nơi** — phần annoying để làm lại cho đúng.

**Feature mở cửa; cộng đồng giữ cửa.**

## 7. Chốt

Ngách này không phải lối mòn — không vì công nghệ khác, mà vì chọn một trận đủ nhỏ (dân pickleball + nỗi đau bom sân + đặt cọc đã là thói quen) để một người thắng được. Kiểm chứng bằng Phase 0: đi gặp sân thật, bán bằng miệng, trước khi viết dòng code nào ([`12-lo-trinh.md`](12-lo-trinh.md)).
