# 2026-07-22 — Bộ scripts dev/migrate/backup

## Overview
Thêm thư mục `scripts/` (thiếu so với dự án tham chiếu `aivideo`): một entrypoint thống nhất cho vòng đời dev thay vì gõ `docker compose exec app …` mỗi lần, **thích ứng đúng stack SÂN** (Laravel + Docker compose + Postgres, không phải MySQL/Node của aivideo nên bỏ hẳn phần quản lý process/PID — mọi thứ chạy trong compose).

## Files Changed
| File | Change |
|------|--------|
| `scripts/lib/common.sh` | log/màu/prompt/`confirm_destructive` |
| `scripts/lib/docker.sh` | wrapper `dc`/`artisan`, `require_docker`, `service_running`, `require_app_up`, `env_val` (đọc apps/app/.env) |
| `scripts/dev.sh` | setup·up·down·restart·status·logs·shell·artisan·test·pint·build; delegate migrate/backup |
| `scripts/migrate.sh` | up·status·rollback·seed(bắt buộc --class)·**fresh có chốt chặn** |
| `scripts/backup.sh` | pg_dump/restore/list (Postgres, xoay vòng 7 ngày) |
| `scripts/README.md` | hướng dẫn |
| `.gitignore` | thêm `/backups/` |

## Key Decisions
1. **Chốt chặn `migrate:fresh`** — theo `.claude/rules/testing` (xoá seed/demo = mất test material). Chặn ý-định-nguy-hiểm TRƯỚC cả require_app_up; muốn xoá phải `fresh --force-danger` + gõ xác nhận.
2. **`seed` bắt buộc `--class`** — không seed mù cả `DatabaseSeeder`.
3. **Bỏ `process.sh`** của aivideo — SÂN chạy 100% trong compose, không có node process local cần quản lý PID/port.
4. **Chưa viết `deploy.sh`** — để dành M7 (chưa chốt VPS/registry); tránh script "giả".
5. **pg_dump chạy trong container `db`** — mật khẩu không lộ ra process list host.

## Verification
- [x] `bash -n` tất cả script: pass
- [x] `dev.sh help` / `status`: chạy (status hiện đúng db+redis running)
- [x] `migrate.sh fresh` không flag → bị chặn đúng thông điệp
- [ ] Chưa chạy backup/restore thật (cần app+db seed) — smoke sau khi có seed data

## Handoff Notes
- Dùng từ **repo root**: `bash scripts/dev.sh <cmd>`. Lần đầu: `dev.sh setup`.
- `deploy.sh` là việc M7.
- Đây là task trên nhánh `chore/dev-scripts` → PR riêng (theo rule git-workflow mới).

## Status
✅ Completed
