#!/usr/bin/env bash
# scripts/dev.sh — Unified dev manager for SÂN (Laravel + Inertia on Docker).
#
# Why: one memorable entrypoint instead of a dozen `docker compose exec app …`
# incantations, with the project's guardrails baked in (e.g. tests never touch a
# destructive migrate — see scripts/migrate.sh). Everything runs inside compose.
#
# Usage: bash scripts/dev.sh <command> [args]
#   setup            First run: .env, key:generate, composer + npm install, migrate.
#   up [service]     Start all services (or one) detached.
#   down             Stop the stack (keeps volumes/data).
#   restart [svc]    Restart all services (or one).
#   status           Show service state + ports.
#   logs [svc] [n]   Tail logs (default: app, 80 lines).
#   shell [svc]      Open bash in a container (default: app).
#   artisan <args>   Run `php artisan <args>` in the app container.
#   test [args]      Run the PHPUnit/Pest suite (real Postgres).
#   pint [--test]    Run Laravel Pint (code style).
#   build            Rebuild frontend assets (npm run build).
#   migrate <args>   Delegate to scripts/migrate.sh.
#   backup <args>    Delegate to scripts/backup.sh.
# -------------------------------------------------------------------
set -eo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/lib/common.sh"
source "$ROOT/scripts/lib/docker.sh"

CMD="${1:-status}"; shift || true
APP_DIR="$ROOT/apps/app"

cmd_setup() {
  require_docker
  print_header "SÂN — setup"
  if [ ! -f "$APP_DIR/.env" ]; then
    print_step "Tạo apps/app/.env từ .env.example"
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  else
    log_info ".env đã có — giữ nguyên"
  fi
  print_step "Khởi động stack"; dc up -d
  print_step "composer install"; dc exec "$APP_SERVICE" composer install
  print_step "npm install";      dc exec "$VITE_SERVICE" npm install
  print_step "key:generate";     artisan key:generate
  print_step "migrate";          dc exec -e DB_CONNECTION=migrator "$APP_SERVICE" php artisan migrate --database=migrator
  print_success_note "Setup xong. Mở http://localhost:8000"
}
print_success_note() { echo ""; log_info "$1"; }

cmd_status() {
  require_docker
  print_header "SÂN — trạng thái service"
  dc ps --format "table {{.Service}}\t{{.State}}\t{{.Ports}}" 2>/dev/null || dc ps
  echo ""
}

case "$CMD" in
  setup)   cmd_setup ;;
  up)      require_docker; print_step "up ${1:-(tất cả)}"; dc up -d "$@" ;;
  down)    require_docker; print_step "down (giữ volume/data)"; dc down ;;
  restart) require_docker; print_step "restart ${1:-(tất cả)}"; dc restart "$@" ;;
  status)  cmd_status ;;
  logs)    require_docker; dc logs --tail="${2:-80}" -f "${1:-$APP_SERVICE}" ;;
  shell)   require_docker; require_app_up; dc exec "${1:-$APP_SERVICE}" bash ;;
  artisan) require_docker; require_app_up; artisan "$@" ;;
  test)    require_docker; require_app_up; print_step "php artisan test $*"; artisan test "$@" ;;
  pint)    require_docker; require_app_up; print_step "pint $*"; dc exec "$APP_SERVICE" ./vendor/bin/pint "$@" ;;
  build)   require_docker; require_vite_up; print_step "npm run build"; dc exec "$VITE_SERVICE" npm run build ;;
  migrate) bash "$ROOT/scripts/migrate.sh" "$@" ;;
  backup)  bash "$ROOT/scripts/backup.sh" "$@" ;;
  help|-h|--help)
    grep -E '^#( |$)' "$0" | sed -E 's/^# ?//' | sed '/^-+$/d' ;;
  *) log_fail "Lệnh không hợp lệ: '$CMD'. Chạy: bash scripts/dev.sh help" ;;
esac
