#!/usr/bin/env bash
# scripts/lib/docker.sh — Docker Compose helpers for the SÂN monorepo.
#
# All services (app, web, db, redis, horizon, scheduler, vite) run through the
# single root compose file — there is no local-node process management, so this
# is a thin wrapper: one place to point `docker compose` at the right file and
# the right service names.

COMPOSE_FILE="${COMPOSE_FILE:-$ROOT/docker-compose.yml}"
APP_SERVICE="${APP_SERVICE:-app}"   # runs artisan / composer / php
DB_SERVICE="${DB_SERVICE:-db}"      # postgres 16
VITE_SERVICE="${VITE_SERVICE:-vite}" # runs npm / Vite

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }

# Keep CLI-compiled views separate from the FPM cache on bind-mounted workspaces.
artisan() { dc exec -e VIEW_COMPILED_PATH=/tmp/san-blade-cli "$APP_SERVICE" php artisan "$@"; }

require_docker() {
  command -v docker >/dev/null 2>&1 || log_fail "Docker chưa cài."
  docker info >/dev/null 2>&1        || log_fail "Docker daemon chưa chạy."
  docker compose version >/dev/null 2>&1 || log_fail "Docker Compose (v2) chưa có."
  [ -f "$COMPOSE_FILE" ] || log_fail "Không thấy compose file: $COMPOSE_FILE"
}

# True if a given service is currently running.
service_running() {
  dc ps --status running --services 2>/dev/null | grep -qx "$1"
}

require_app_up() {
  service_running "$APP_SERVICE" || \
    log_fail "Service '$APP_SERVICE' chưa chạy. Chạy: bash scripts/dev.sh up"
}

require_vite_up() {
  service_running "$VITE_SERVICE" || \
    log_fail "Service '$VITE_SERVICE' chưa chạy. Chạy: bash scripts/dev.sh up"
}

# Read a value from apps/app/.env (fallback to a default). Used for DB creds.
env_val() {
  local key="$1" def="$2" file="$ROOT/apps/app/.env"
  [ -f "$file" ] || { echo "$def"; return; }
  local v; v="$(grep -E "^${key}=" "$file" | tail -1 | cut -d= -f2- | tr -d '"'"'"'')"
  echo "${v:-$def}"
}
