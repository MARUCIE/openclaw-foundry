#!/usr/bin/env bash
#
# audit-auth-surfaces.sh — structural prevention of v6-class auth-gate regressions.
#
# Context: openclaw-foundry shipped a v6 design contract on 2026-05-18 —
# "整个网站可以打开，但是如果要下载任何内容需要完整注册登陆"
# (whole site browseable, but install/download/copy requires login).
# That contract was violated 3 times in 6 hours by surfaces v6 cycle
# decomposition didn't enumerate: SiteGuard (v8), marketplace InstallModal
# copy buttons (v9). This script makes the violation class structurally
# impossible to ship: it scans every data-delivery surface and demands the
# same file imports auth helpers from @/lib/session AND references at
# least one of {loginRedirect, isLoggedIn, readSession}.
#
# Exit codes:
#   0  — every surface is gated, or violations carry @auth-surface-allowlist
#   1  — at least one unguarded surface found; commit blocked
#
# Allowlist syntax (place on same line OR immediately preceding line):
#   // @auth-surface-allowlist: <reason>   — TypeScript/JSX
#   {/* @auth-surface-allowlist: <reason> */}  — JSX block
#
# Run as ad-hoc audit:    bash scripts/audit-auth-surfaces.sh
# Run as pre-commit hook: installed via scripts/install-hooks.sh
#
set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_ROOT="$REPO_ROOT/web"
SCAN_DIRS=("$WEB_ROOT/components" "$WEB_ROOT/app" "$WEB_ROOT/lib")

# Surface patterns — extend here when a new data-delivery primitive surfaces.
# Each pattern matches the LINE in source where the surface is invoked.
SURFACE_PATTERNS=(
  'navigator\.clipboard\.writeText'
  'clipboard\.writeText\b'
  'a\.download\s*='
  '<a[^>]*\bdownload\b'
)

# Auth-helper patterns — at least ONE must appear in the same file as a surface,
# otherwise the surface is presumed un-gated.
AUTH_HELPERS=(
  'loginRedirect'
  'isLoggedIn'
  'readSession'
)

# Files explicitly exempt from the audit (paths relative to repo root).
# Add entries here only with a written reason; the canonical exemption flow
# is the per-line @auth-surface-allowlist comment.
GLOBAL_EXEMPT=(
  'web/lib/session.ts'  # the session module itself defines the helpers
)

violations=()
checked=0

is_globally_exempt() {
  local file="$1"
  local rel="${file#$REPO_ROOT/}"
  for ex in "${GLOBAL_EXEMPT[@]}"; do
    [ "$rel" = "$ex" ] && return 0
  done
  return 1
}

# Returns 0 if the line itself or the immediately preceding line carries the
# @auth-surface-allowlist marker.
has_allowlist_comment() {
  local file="$1"
  local lineno="$2"
  local cur prev
  cur=$(sed -n "${lineno}p" "$file")
  if [ "$lineno" -gt 1 ]; then
    prev=$(sed -n "$((lineno - 1))p" "$file")
  else
    prev=""
  fi
  if echo "$cur"  | grep -q '@auth-surface-allowlist'; then return 0; fi
  if echo "$prev" | grep -q '@auth-surface-allowlist'; then return 0; fi
  return 1
}

file_has_auth_helper() {
  local file="$1"
  # Must import from @/lib/session (single source of truth).
  if ! grep -qE "from\s+['\"]@/lib/session['\"]" "$file"; then
    return 1
  fi
  # Must invoke at least one auth helper.
  for h in "${AUTH_HELPERS[@]}"; do
    if grep -qE "\b${h}\b" "$file"; then
      return 0
    fi
  done
  return 1
}

scan_file() {
  local file="$1"
  is_globally_exempt "$file" && return

  for pat in "${SURFACE_PATTERNS[@]}"; do
    # grep -n returns "lineno:content"; one hit per matching line.
    while IFS= read -r hit; do
      [ -z "$hit" ] && continue
      local lineno="${hit%%:*}"
      checked=$((checked + 1))

      if has_allowlist_comment "$file" "$lineno"; then
        continue
      fi
      if file_has_auth_helper "$file"; then
        continue
      fi

      local rel="${file#$REPO_ROOT/}"
      violations+=("$rel:$lineno  — surface '$pat' has no @/lib/session import + loginRedirect/isLoggedIn/readSession reference")
    done < <(grep -nE "$pat" "$file" 2>/dev/null || true)
  done
}

echo "== auth-surface audit =="
echo "repo:      $REPO_ROOT"
echo "scanning:  ${SCAN_DIRS[*]#$REPO_ROOT/}"
echo

for dir in "${SCAN_DIRS[@]}"; do
  [ -d "$dir" ] || continue
  while IFS= read -r file; do
    scan_file "$file"
  done < <(find "$dir" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) 2>/dev/null)
done

echo "surfaces checked: $checked"
echo "violations:       ${#violations[@]}"
echo

if [ ${#violations[@]} -eq 0 ]; then
  echo "OK   — every data-delivery surface adjoins @/lib/session auth helpers."
  exit 0
fi

echo "FAIL — the following surfaces deliver install/copy payload without an auth gate:"
echo
for v in "${violations[@]}"; do
  echo "  • $v"
done
echo
echo "Remediation (pick ONE per violation):"
echo "  1. Add an auth gate that mirrors web/app/packs/page.tsx PackCard:"
echo "       import { readSession, loginRedirect } from '@/lib/session';"
echo "       // ... derive isLoggedIn from readSession()"
echo "       if (!isLoggedIn) { window.location.assign(loginRedirect()); return; }"
echo "  2. If the surface is genuinely public (footer link / TOS / public doc),"
echo "     add an explicit opt-out comment on the same or preceding line:"
echo "       // @auth-surface-allowlist: <short reason>"
echo
echo "Design contract documented in:"
echo "  doc/00_project/initiative_openclaw_foundry/AUTH_SURFACE_INVARIANT.md"
echo
exit 1
