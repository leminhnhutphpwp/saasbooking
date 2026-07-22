# Scripts — SÂN

Một entrypoint duy nhất cho vòng đời dev, thay vì gõ `docker compose exec app …` mỗi lần. Mọi thứ chạy **trong Docker compose** (stack: `app · web · db · redis · horizon · scheduler · vite`). Chạy từ **repo root**.

```
scripts/
├── lib/
│   ├── common.sh   # màu / log / prompt / confirm
│   └── docker.sh   # wrapper docker compose + tên service + đọc .env
├── dev.sh          # quản lý dev (up/down/status/logs/shell/test/pint/build…)
├── migrate.sh      # migrate/seed — CÓ chốt chặn migrate:fresh (rule testing)
├── backup.sh       # pg_dump / restore / list (Postgres)
└── README.md
```

## Bắt đầu nhanh

```bash
bash scripts/dev.sh setup      # lần đầu: .env, key:generate, composer+npm install, migrate
bash scripts/dev.sh up         # khởi động stack → http://localhost:8000
bash scripts/dev.sh status     # trạng thái service + port
bash scripts/dev.sh test       # chạy test suite (Postgres thật)
bash scripts/dev.sh pint --test
bash scripts/dev.sh logs app   # tail log
bash scripts/dev.sh shell      # bash trong container app
bash scripts/dev.sh artisan tinker
```

## Migrate / seed (có chốt chặn)

```bash
bash scripts/migrate.sh up               # migrate (an toàn, chỉ thêm)
bash scripts/migrate.sh status
bash scripts/migrate.sh seed --class=CourtDemoSeeder
bash scripts/migrate.sh rollback --step=1
```

`migrate:fresh` / `db:wipe` **bị chặn** theo [`.claude/rules/testing`](../.claude/rules/testing/SKILL.md) — seed/demo là test material thật. Muốn xoá sạch phải cố ý: `bash scripts/migrate.sh fresh --force-danger` (còn hỏi xác nhận nữa).

## Backup / restore

```bash
bash scripts/backup.sh            # tạo dump (backups/san-<ts>.sql.gz), xoay vòng 7 ngày
bash scripts/backup.sh list
bash scripts/backup.sh restore backups/san-20260722-101500.sql.gz   # GHI ĐÈ — hỏi xác nhận
```

## Chưa có (để dành)

- `deploy.sh` — đợi **M7 (hardening + go-live)**, khi đã chốt VPS/registry. Chưa dựng để tránh script "giả".
