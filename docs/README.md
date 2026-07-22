# SÂN — Trang đặt sân + cọc chống bom + nhắc lịch qua Zalo

> **Một câu:** Mỗi chủ sân có trang đặt sân riêng, thu cọc VietQR chống bom, nhắc lịch tự động qua Zalo; nhúng vào web có sẵn là tùy chọn.
> **Beachhead:** sân pickleball / cầu lông · **Người làm:** solo dev · **Thị trường:** Việt Nam · **Stack:** Laravel 13 + Inertia + React + PostgreSQL (theo khuôn mẫu `appdhv`).

Bộ tài liệu đã **commit hoàn toàn vào ngách**. Bản "nền tảng đa ngành" cũ lưu ở `_archive-platform/` (chỉ tham khảo).

---

## Cấu trúc tài liệu (đọc theo thứ tự)

### Phần A — Định hướng & Sản phẩm
| # | File | Nội dung |
|---|---|---|
| 00 | [`00-dinh-huong-va-danh-gia.md`](00-dinh-huong-va-danh-gia.md) | Định vị, vì sao ngách thắng platform, chọn beachhead, đánh giá khả năng thành công |
| 01 | [`01-san-pham.md`](01-san-pham.md) | Người dùng, **mặt tiền ba lớp**, luồng đặt, tính năng đặc thù sân, phạm vi |
| 02 | [`02-yeu-cau-chuc-nang.md`](02-yeu-cau-chuc-nang.md) | **Đặc tả yêu cầu chức năng** (FR), use case chi tiết, NFR, ma trận phân quyền |

### Phần B — Trải nghiệm & Giao diện
| # | File | Nội dung |
|---|---|---|
| 03 | [`03-giao-dien-quan-ly.md`](03-giao-dien-quan-ly.md) | **Giao diện app quản lý chủ sân**: sơ đồ điều hướng + screen inventory (mỗi màn hình gồm gì) |
| 04 | [`04-cau-hinh-per-tenant.md`](04-cau-hinh-per-tenant.md) | **Cấu hình app cho từng khách hàng** + cơ chế nhúng (subdomain / script / plugin WordPress) |

### Phần C — Kiến trúc & Dữ liệu
| # | File | Nội dung |
|---|---|---|
| 05 | [`05-module-map.md`](05-module-map.md) | 7 module, sở hữu dữ liệu (OWNS/REFERENCES), ánh xạ sang Laravel |
| 06 | [`06-erd.md`](06-erd.md) | Mô hình dữ liệu: sân, giá giờ vàng, đặt cố định, cọc, đối soát; multi-tenant `WorkingTenant` |
| 07 | [`07-luong-du-lieu.md`](07-luong-du-lieu.md) | 4 luồng: đặt+cọc+đối soát, sinh lịch cố định, bom/hủy, nhắc lịch |
| 08 | [`08-thiet-ke-module-chi-tiet.md`](08-thiet-ke-module-chi-tiet.md) | **Thiết kế module chi tiết (build-ready):** cơ chế render/dispatch theo loại tenant (golf vs cầu lông vs pickleball), Service/Controller/Job Laravel, giao diện công khai |
| 09 | [`09-kien-truc-mo-rong.md`](09-kien-truc-mo-rong.md) | **Dự trù kiến trúc về sau**: vertical mới, multi-resource, DB scaling — làm gì bây giờ vs chừa cửa |

### Phần D — Rủi ro & Chất lượng
| # | File | Nội dung |
|---|---|---|
| 10 | [`10-tinh-huong-phat-sinh.md`](10-tinh-huong-phat-sinh.md) | **Sổ tình huống phát sinh toàn diện** (edge case nghiệp vụ) + cách xử lý |
| 11 | [`11-diem-vo.md`](11-diem-vo.md) | Điểm vỡ thiết kế dữ liệu (schema) đặc thù ngách sân |

### Phần E — Triển khai
| # | File | Nội dung |
|---|---|---|
| 12 | [`12-lo-trinh.md`](12-lo-trinh.md) | Lộ trình 4 phase + kill criteria + **plan triển khai chi tiết** (WBS, test, deploy) + stack |

---

## Bản đồ phụ thuộc (đọc gì trước gì)

```
00 định hướng ─► 01 sản phẩm ─► 02 yêu cầu chức năng
                                    │
        ┌───────────────┬──────────┴───────────┐
        ▼               ▼                        ▼
   03 giao diện    04 cấu hình/nhúng      05 module ─► 06 ERD ─► 07 luồng ─► 08 module chi tiết
                                                                     │
                                              09 kiến trúc mở rộng ◄─┘
                                                                     │
                                    10 tình huống ─ 11 điểm vỡ ◄─────┘
                                                                     │
                                                       12 plan triển khai
```

## Nguyên tắc xuyên suốt

1. **Bán trước khi code** — Phase 0 đi gặp sân thật, không viết dòng nào.
2. **Một cộng đồng trước** (pickleball/cầu lông); ngách khác dùng chung engine, để sau.
3. **Cọc + Zalo là lời hứa "hết bom sân"**, không phải danh sách tính năng.
4. **Moat = nhúng trong Zalo + phân phối qua cộng đồng**, không phải công nghệ.
5. **Giá flat + setup tận tay** — support Zalo tận tình là kênh sales rẻ nhất.
6. **Đúng khuôn mẫu appdhv** — Laravel + Inertia + Postgres, `WorkingTenant`, `Auditable`, Horizon.
