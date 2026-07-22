#!/usr/bin/env bash
# scripts/migrate.sh — Migration & seeder manager for SÂN.
#
# Why a wrapper instead of raw artisan: the project has a HARD rule (see
# .claude/rules/testing) — migrate:fresh / db:wipe / bulk DELETE are FORBIDDEN
# because seed/demo data is real test material and the anti-double-book proof
# lives in Postgres. This script makes the safe paths one word and puts the
# destructive ones behind an explicit --force-danger + typed confirmation.
#
# Usage: bash scripts/migrate.sh <command> [args]
#   up | run          artisan migrate (safe, additive).
#   status            artisan migrate:status.
#   rollback [--step=N]   Roll back the last batch (or N steps).
#   seed [--class=X]  Run a seeder — a SPECIFIC class only (never the whole DatabaseSeeder blind).
#   fresh --force-danger   migrate:fresh — WIPES ALL DATA. Guarded.
# -------------------------------------------------------------------
set -eo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/lib/common.sh"
source "$ROOT/scripts/lib/docker.sh"

require_docker

CMD="${1:-status}"; shift || true

case "$CMD" in
  up|run)   require_app_up; print_step "migrate"; artisan migrate "$@" ;;
  status)   require_app_up; artisan migrate:status ;;
  rollback) require_app_up; print_step "migrate:rollback $*"; artisan migrate:rollback "$@" ;;
  seed)
    if [ $# -eq 0 ]; then
      log_fail "Phải chỉ định seeder cụ thể: seed --class=CourtDemoSeeder (không seed mù cả DatabaseSeeder)."
    fi
    require_app_up; print_step "db:seed $*"; artisan db:seed "$@" ;;
  fresh)
    # Intent-check FIRST — block the destructive path before anything else,
    # regardless of whether the app container happens to be up.
    if [ "${1:-}" != "--force-danger" ]; then
      log_fail "migrate:fresh bị chặn theo .claude/rules/testing (xoá sạch seed/demo = mất test material).
       Nếu THỰC SỰ cần: bash scripts/migrate.sh fresh --force-danger"
    fi
    require_app_up
    confirm_destructive "XOÁ SẠCH toàn bộ database rồi migrate lại từ đầu"
    print_step "migrate:fresh"; artisan migrate:fresh ;;
  help|-h|--help)
    grep -E '^#( |$)' "$0" | sed -E 's/^# ?//' | sed '/^-+$/d' ;;
  *) log_fail "Lệnh không hợp lệ: '$CMD'. Chạy: bash scripts/migrate.sh help" ;;
esac
