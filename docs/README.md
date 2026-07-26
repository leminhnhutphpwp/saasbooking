# SÂN — Trang đặt sân + cọc chống bom + nhắc lịch qua Zalo

> **Một câu:** Mỗi chủ sân có trang đặt sân riêng, thu cọc VietQR chống bom, nhắc lịch tự động qua Zalo; nhúng vào web có sẵn là tùy chọn.
> **Beachhead:** sân pickleball / cầu lông · **Người làm:** solo dev · **Thị trường:** Việt Nam · **Stack:** Laravel 13 + Inertia + React + PostgreSQL (theo khuôn mẫu `appdhv`).

Đây là bộ tài liệu hiện hành. Git history và `worklogs/` lưu các bản cũ; không dùng worklog làm nguồn sự thật.

---

## Đọc theo nhu cầu

### Sản phẩm
| # | File | Nội dung |
|---|---|---|
| 01 | [`01-san-pham.md`](01-san-pham.md) | Người dùng, **mặt tiền ba lớp**, luồng đặt, tính năng đặc thù sân, phạm vi |
| 02 | [`02-yeu-cau-chuc-nang.md`](02-yeu-cau-chuc-nang.md) | **Đặc tả yêu cầu chức năng** (FR), use case chi tiết, NFR, ma trận phân quyền |

### Cấu hình
| # | File | Nội dung |
|---|---|---|
| 04 | [`04-cau-hinh-per-tenant.md`](04-cau-hinh-per-tenant.md) | **Cấu hình app cho từng khách hàng** + cơ chế nhúng (subdomain / script / plugin WordPress) |

### Kiến trúc
| # | File | Nội dung |
|---|---|---|
| 05 | [`05-module-map.md`](05-module-map.md) | 7 module, sở hữu dữ liệu (OWNS/REFERENCES), ánh xạ sang Laravel |
| 06 | [`06-erd.md`](06-erd.md) | Mô hình dữ liệu: sân, giá giờ vàng, đặt cố định, cọc, đối soát; multi-tenant `WorkingTenant` |
| 07 | [`07-luong-du-lieu.md`](07-luong-du-lieu.md) | 4 luồng: đặt+cọc+đối soát, sinh lịch cố định, bom/hủy, nhắc lịch |
| 08 | [`08-thiet-ke-module-chi-tiet.md`](08-thiet-ke-module-chi-tiet.md) | **Thiết kế module chi tiết (build-ready):** cơ chế render/dispatch theo loại tenant (golf vs cầu lông vs pickleball), Service/Controller/Job Laravel, giao diện công khai |
| 09 | [`09-kien-truc-mo-rong.md`](09-kien-truc-mo-rong.md) | **Dự trù kiến trúc về sau**: vertical mới, multi-resource, DB scaling — làm gì bây giờ vs chừa cửa |

### Rủi ro
| # | File | Nội dung |
|---|---|---|
| 10 | [`10-tinh-huong-phat-sinh.md`](10-tinh-huong-phat-sinh.md) | **Sổ tình huống phát sinh toàn diện** (edge case nghiệp vụ) + cách xử lý |
| 11 | [`11-diem-vo.md`](11-diem-vo.md) | Điểm vỡ thiết kế dữ liệu (schema) đặc thù ngách sân |

### Delivery
| # | File | Nội dung |
|---|---|---|
| 12 | [`12-lo-trinh.md`](12-lo-trinh.md) | Trạng thái hiện tại, ưu tiên go-live và reserved doors |

---

Thông thường chỉ cần: `01–02` cho nghiệp vụ, `05–08` cho backend/data, `10–11` cho bug/edge case, và `12` cho ưu tiên hiện tại.

## Nguyên tắc xuyên suốt

1. **Bán trước khi code** — Phase 0 đi gặp sân thật, không viết dòng nào.
2. **Một cộng đồng trước** (pickleball/cầu lông); ngách khác dùng chung engine, để sau.
3. **Cọc + Zalo là lời hứa "hết bom sân"**, không phải danh sách tính năng.
4. **Moat = nhúng trong Zalo + phân phối qua cộng đồng**, không phải công nghệ.
5. **Giá flat + setup tận tay** — support Zalo tận tình là kênh sales rẻ nhất.
6. **Đúng khuôn mẫu appdhv** — Laravel + Inertia + Postgres, `WorkingTenant`, `Auditable`, Horizon.
