#!/usr/bin/env bash
# Check only added UI lines, preserving valid legacy code and non-UI sources.
set -uo pipefail

payload=$(cat)
file=""
if [[ "$payload" =~ \"file_path\"[[:space:]]*:[[:space:]]*\"([^\"]*)\" ]]; then
  file="${BASH_REMATCH[1]}"
fi
[[ -z "$file" || "$file" != *.jsx && "$file" != *.css ]] && exit 0
[[ "$file" == */tokens.css || "$file" == */theme.css ]] && exit 0
[[ ! -f "$file" ]] && exit 0

added=$(git diff --no-ext-diff -U0 -- "$file" | awk '/^\+[^+]/ { print substr($0, 2) }' | grep -vE '^[[:space:]]*--[a-z0-9-]+:' | grep -v 'url(#' || true)
[[ -z "$added" ]] && exit 0
violations=$(printf '%s\n' "$added" | grep -nE '#[0-9a-fA-F]{3,8}\b|(text|bg|border|shadow|rounded|p|m|gap|w|h)-\[[^]]+\]|outline-none' || true)
if [[ -n "$violations" ]]; then
  printf 'Design-token violations in added UI lines of %s:\n%s\n' "$file" "$violations" >&2
  exit 2
fi
