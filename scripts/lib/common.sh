#!/usr/bin/env bash
# scripts/lib/common.sh — Shared utilities (logging, formatting, prompts).
# Sourced by every top-level script; expects the caller to have set $ROOT.

CONSOLE_WIDTH=${CONSOLE_WIDTH:-72}

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'
BLUE=$'\033[0;34m'; CYAN=$'\033[0;36m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

log()      { echo "  $1"; }
log_info() { echo -e "  ${GREEN}${BOLD}info:${RESET} $1"; }
log_warn() { echo -e "  ${YELLOW}warn:${RESET} $1"; }
log_fail() { echo -e "  ${RED}fail:${RESET} $1" >&2; exit 1; }
log_time() { echo "  ${DIM}[$(date '+%H:%M:%S')]${RESET} $1"; }

print_kv()   { printf "  ${BOLD}%-14s${RESET} %s\n" "$1" "$2"; }
print_line() { printf '%*s\n' "${2:-$CONSOLE_WIDTH}" | tr ' ' "${1:--}"; }
print_step() { echo -e "  ${CYAN}>${RESET} $1"; }

print_header() {
  local title="$1" width="${2:-$CONSOLE_WIDTH}"
  local pad=$(( (width - ${#title} - 2) / 2 ))
  echo ""; print_line "=" "$width"
  printf "%${pad}s ${BOLD}%s${RESET}\n" "" "$title"
  print_line "=" "$width"; echo ""
}

print_section() { echo ""; echo -e "  ${BOLD}$1${RESET}"; echo ""; }

# Yes/No prompt; aborts on anything but y/Y.
prompt() {
  local response
  echo -ne "  ${YELLOW}$1${RESET} (y/N): "
  read -r response
  [[ "$response" =~ ^[Yy]$ ]] || { log "Đã huỷ."; exit 1; }
}

# Loud confirmation for irreversible actions.
confirm_destructive() {
  echo ""; log_warn "Hành động này sẽ: $1"
  log_warn "KHÔNG thể hoàn tác."
  prompt "Chắc chắn tiếp tục?"
}
