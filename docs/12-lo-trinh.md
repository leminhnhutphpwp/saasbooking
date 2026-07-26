# 12 — Roadmap hiện tại

Tài liệu này chỉ mô tả việc còn lại. Lịch sử implementation nằm trong Git và [`../worklogs/`](../worklogs/README.md).

## Hiện trạng

Lõi Phase 1 đã có:

- Multi-tenant với `WorkingTenant`, memberships và đăng ký từng dịch vụ.
- Court catalog, opening/pricing rules và availability.
- Booking hold, chống double-book, đặt cố định và thao tác tại quầy.
- VietQR, đối soát idempotent ba nhánh và refund ledger.
- Notification scaffold/Zalo transport, public booking và manager console.
- PostgreSQL test suite, Pint và frontend production build.

## Ưu tiên tiếp theo

### Go-live

1. Chạy migrations trên môi trường staging/production và kiểm tra backfill.
2. Cấu hình SePay/Casso thật; xác minh chữ ký và một giao dịch E2E.
3. Cấu hình Zalo OA/ZNS thật; duyệt template xác nhận và nhắc lịch.
4. Chạy backup restore drill; giám sát Horizon, scheduler và lỗi ứng dụng.
5. Browser QA desktop/mobile cho đăng ký dịch vụ, tenant switch, giá, public booking và payment status.

### Sau tín hiệu thị trường

- Billing flat/subscription và invoice.
- Embed/API cho đối tác.
- Báo cáo vận hành và cảnh báo khách no-show.
- Vertical hoặc inventory shape mới chỉ khi beachhead có tín hiệu trả phí rõ ràng.

## Reserved doors

- Capacity/session inventory cho golf, lớp học, sự kiện.
- Spa/nail trên resource-time-slot với catalog dịch vụ/thời lượng riêng.
- Custom domain và headless API.

Các cửa này phải mở bằng cách thêm driver/bảng/config, không sửa vòng đời booking chung. Xem [`09-kien-truc-mo-rong.md`](09-kien-truc-mo-rong.md).

## Không làm trong Phase 1

- Drag-and-drop builder.
- Metered billing.
- Microservices hoặc database riêng theo vertical.
- Cổng thanh toán mới ngoài VietQR reconciliation.
- Bật nhiều dịch vụ tùy ý trong một tenant; mỗi đăng ký dịch vụ tạo tenant riêng.
