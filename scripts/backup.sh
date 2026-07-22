#!/usr/bin/env bash
# scripts/backup.sh — Backup / restore the SÂN Postgres database.
#
# Why: bookings, deposits (money), the bank-txn inbox and the audit log are
# relational data that CANNOT be regenerated. This makes a consistent dump,
# rotates old ones, and ships a restore path — because "a backup you never
# restored is not a backup". Runs pg_dump INSIDE the db container so the
# password never hits the host process list.
#
# Usage:
#   bash scripts/backup.sh [db]                 # create a dump (default)
#   bash scripts/backup.sh restore <file.sql.gz>  # OVERWRITE the DB (guarded)
#   bash scripts/backup.sh list                 # list existing dumps
#
# Env: BACKUP_DIR (default <root>/backups) · RETENTION_DAYS (default 7)
# -------------------------------------------------------------------
set -eo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/lib/common.sh"
source "$ROOT/scripts/lib/docker.sh"

require_docker

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DB_NAME="$(env_val DB_DATABASE san)"
DB_USER="$(env_val DB_USERNAME postgres)"

ensure_db_up() {
  service_running "$DB_SERVICE" || log_fail "Service '$DB_SERVICE' chưa chạy — khởi động stack trước khi backup."
}

# `date` is fine here (host shell), unlike the workflow sandbox.
tag() { date +%Y%m%d-%H%M%S; }

do_backup() {
  ensure_db_up
  mkdir -p "$BACKUP_DIR"
  local out="$BACKUP_DIR/san-$(tag).sql.gz"
  print_step "pg_dump $DB_NAME → $(basename "$out")"
  dc exec -T "$DB_SERVICE" pg_dump -U "$DB_USER" --clean --if-exists "$DB_NAME" | gzip > "$out"
  local size; size="$(du -h "$out" | cut -f1)"
  log_info "Backup xong ($size): $out"
  # Rotate
  local removed
  removed=$(find "$BACKUP_DIR" -name 'san-*.sql.gz' -mtime "+$RETENTION_DAYS" -print -delete | wc -l | tr -d ' ')
  [ "$removed" -gt 0 ] && log "Đã xoá $removed bản cũ hơn ${RETENTION_DAYS} ngày."
}

do_restore() {
  local file="$1"
  [ -n "$file" ] || log_fail "Thiếu file. Dùng: backup.sh restore <file.sql.gz>"
  [ -f "$file" ] || log_fail "Không thấy file: $file"
  ensure_db_up
  confirm_destructive "GHI ĐÈ database '$DB_NAME' bằng $(basename "$file")"
  print_step "Khôi phục $DB_NAME"
  gunzip -c "$file" | dc exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME"
  log_info "Khôi phục xong."
}

do_list() {
  print_header "Backups ($BACKUP_DIR)"
  if [ -d "$BACKUP_DIR" ] && ls "$BACKUP_DIR"/san-*.sql.gz >/dev/null 2>&1; then
    ls -lh "$BACKUP_DIR"/san-*.sql.gz | awk '{printf "  %s  %s\n", $5, $NF}'
  else
    log "Chưa có backup nào."
  fi
  echo ""
}

case "${1:-db}" in
  db|"")   do_backup ;;
  restore) do_restore "${2:-}" ;;
  list)    do_list ;;
  help|-h|--help)
    grep -E '^#( |$)' "$0" | sed -E 's/^# ?//' | sed '/^-+$/d' ;;
  *) log_fail "Lệnh không hợp lệ: '$1'. Chạy: bash scripts/backup.sh help" ;;
esac
