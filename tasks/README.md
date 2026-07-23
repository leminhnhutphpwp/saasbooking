# Task Ledger — quy trình giao việc cho agent

Đây là **nguồn sự thật** cho việc-đang-làm của SÂN. Manager phân rã việc thành **1 file `.md` / 1 task**; agent **nhận việc bằng cách sửa trạng thái ngay trong file** → agent khác đọc thấy đã có người nhận thì **không đụng vào**. Chống giẫm chân + audit + an toàn xuyên phiên.

> Lịch sử milestone đã xong nằm ở `../task-status.md` + `../worklogs/`. Thư mục này chỉ chứa **việc đang/ sắp làm**.

## Vai trò

- **Manager (Claude chính):** phân rã việc → viết file task với **`scope` (danh sách file) KHÔNG chồng lấn nhau**; điều phối; **review + verify + merge**; cập nhật `BOARD.md`. KHÔNG tự code feature trừ việc quản trị (task file, review, hotfix nhỏ).
- **Agent thực thi:** nhận đúng 1 task, làm **chỉ trong `scope`**, ghi nhật ký, trả kết quả để manager review.

## Vòng đời trạng thái

`todo` → `claimed` → `in-review` → `done`  ·  (`blocked` khi vướng)

## Giao thức NHẬN VIỆC (claim) — bắt buộc

1. Đọc `BOARD.md`. Chọn 1 task **`status: todo`** mà **mọi `depends_on` đã `done`**.
2. Mở file task, kiểm tra lại `status`. **Nếu ≠ `todo` → BỎ QUA** (đã có người nhận).
3. **Nhận việc = sửa file ngay:** đặt `status: claimed`, `owner: <tên/agent-id của bạn>`, `updated: <ngày>`, và thêm 1 dòng ở mục **## Nhật ký**. Thao tác edit này CHÍNH LÀ cái khoá.
4. Chỉ sửa các file nằm trong `scope`. **Tuyệt đối không đụng file thuộc task khác đang `claimed`/`in-review`.** Nếu cần file ngoài `scope` → dừng, ghi `blocked` + báo manager (đừng tự mở rộng).
5. Xong: đặt `status: in-review`, điền kết quả ở mục **## Verification** (build/test/ảnh).
6. **Manager review:** đọc diff + chạy verify. Đạt → `status: done` + merge. Chưa đạt → về `claimed` kèm ghi chú.

## Quy tắc chống giẫm chân

- **`scope` của các task chạy song song PHẢI rời nhau** — manager đảm bảo khi viết task. Đây mới là lớp chống trùng thật; `status` là ledger điều phối/audit.
- Task có phụ thuộc thì làm **tuần tự** (sửa chung file cũng an toàn vì không đồng thời).
- 1 branch / 1 task: dùng `branch:` khai trong file (theo `.claude/rules/git-workflow`).

## Mẫu file task

Copy `_TEMPLATE.md`. `id` tăng dần `T01, T02…`. Đặt tên `T<NN>-<slug>.md`.

## Bảng điều khiển

`BOARD.md` = bảng liệt kê mọi task (id · tiêu đề · status · owner · priority · depends_on). Manager cập nhật mỗi khi trạng thái đổi.
