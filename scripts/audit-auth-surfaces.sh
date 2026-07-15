#!/usr/bin/env bash
#
# audit-auth-surfaces.sh — job-pack payload auth boundary check.
#
# Current contract, updated 2026-05-18:
#   - Skill / MCP / API-doc copy actions are public.
#   - Only job-pack payload actions require registration/login.
#   - Pack guide pages may stay public, but pack install/config/artifact
#     payloads must go through Worker auth/token routes and R2, then be
#     tombstoned in the Pages static export before deploy.
#
# Run as ad-hoc audit:    bash scripts/audit-auth-surfaces.sh
# Run as pre-commit hook: installed via scripts/install-hooks.sh
#
set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PACK_PAGE="$REPO_ROOT/web/app/packs/page.tsx"
PROTECTED_HELPERS="$REPO_ROOT/web/lib/protected-downloads.ts"
SESSION_HELPER="$REPO_ROOT/web/lib/session.ts"
LOGIN_PAGE="$REPO_ROOT/web/app/login/page.tsx"
AUTH_CALLBACK_PAGE="$REPO_ROOT/web/app/auth/callback/page.tsx"
WECHAT_LANDING_PAGE="$REPO_ROOT/web/app/auth/wechat-landing/page.tsx"
PACKS_ROUTE="$REPO_ROOT/worker/src/routes/packs.ts"
WECHAT_AUTH_ROUTE="$REPO_ROOT/worker/src/routes/auth-wechat.ts"
HEADERS_FILE="$REPO_ROOT/web/public/_headers"
DEPLOY_WORKFLOW="$REPO_ROOT/.github/workflows/deploy.yml"
UPLOAD_SCRIPT="$REPO_ROOT/scripts/upload-protected-packs-to-r2.mjs"
PRUNE_SCRIPT="$REPO_ROOT/scripts/prune-public-pack-downloads.mjs"

violations=()
checked=0

require_file() {
  local file="$1"
  local label="$2"
  checked=$((checked + 1))
  if [ ! -f "$file" ]; then
    violations+=("$label missing: ${file#$REPO_ROOT/}")
  fi
}

require_pattern() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  checked=$((checked + 1))
  if ! grep -qE "$pattern" "$file" 2>/dev/null; then
    violations+=("$label missing in ${file#$REPO_ROOT/}")
  fi
}

reject_pattern() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  checked=$((checked + 1))
  if grep -qE "$pattern" "$file" 2>/dev/null; then
    violations+=("$label found in ${file#$REPO_ROOT/}")
  fi
}

echo "== job-pack auth boundary audit =="
echo "repo: $REPO_ROOT"
echo

require_file "$PACK_PAGE" "pack page"
require_file "$PROTECTED_HELPERS" "protected download helper"
require_file "$SESSION_HELPER" "session helper"
require_file "$LOGIN_PAGE" "login page"
require_file "$AUTH_CALLBACK_PAGE" "auth callback page"
require_file "$WECHAT_LANDING_PAGE" "wechat landing page"
require_file "$PACKS_ROUTE" "worker packs route"
require_file "$WECHAT_AUTH_ROUTE" "worker wechat auth route"
require_file "$UPLOAD_SCRIPT" "R2 upload script"
require_file "$PRUNE_SCRIPT" "Pages prune script"

require_pattern "$PROTECTED_HELPERS" "from ['\"]@/lib/session['\"]" "session helper import"
require_pattern "$PROTECTED_HELPERS" "\\brequireRegistered\\b" "registered-session gate"
require_pattern "$PROTECTED_HELPERS" "copyProtectedPackInstallCommand" "protected install-copy helper"
require_pattern "$PROTECTED_HELPERS" "downloadProtectedPackFile" "protected file-download helper"
require_pattern "$PROTECTED_HELPERS" "navigator\\.clipboard\\.writeText" "protected clipboard write"
require_pattern "$PROTECTED_HELPERS" "a\\.download\\s*=" "protected browser download"

require_pattern "$PACK_PAGE" "copyProtectedPackInstallCommand" "pack page protected install-copy call"
require_pattern "$PACK_PAGE" "downloadProtectedPackFile" "pack page protected file-download call"
require_pattern "$PACK_PAGE" "loginRedirect.*packs#install-" "pack page login return path"

require_pattern "$SESSION_HELPER" "function safeReturnPath" "safe return path helper"
require_pattern "$LOGIN_PAGE" "safeReturnPath\\(sp\\?\\.get\\('return'\\)\\)" "login return path sanitizer"
require_pattern "$AUTH_CALLBACK_PAGE" "safeReturnPath\\(saved\\)" "email callback return sanitizer"
require_pattern "$WECHAT_LANDING_PAGE" "safeReturnPath\\(data\\.return_to\\)" "wechat landing return sanitizer"
require_pattern "$PROTECTED_HELPERS" "loginRedirect\\(returnPath\\)" "protected helper shared re-auth redirect"
reject_pattern "$PROTECTED_HELPERS" "/login\\?return=\\$\\{encodeURIComponent\\(returnPath\\)\\}" "protected helper raw return redirect"
require_pattern "$WECHAT_AUTH_ROUTE" "function safeReturnPath" "worker safe return path helper"
require_pattern "$WECHAT_AUTH_ROUTE" "safeReturnPath\\(c\\.req\\.query\\('return'\\)\\)" "wechat start return sanitizer"
require_pattern "$WECHAT_AUTH_ROUTE" "safeReturnPath\\(decoded\\.r\\)" "wechat exchange return sanitizer"

require_pattern "$PACKS_ROUTE" "pack:\\s*mapPack\\(row\\)" "public pack detail metadata-only response"
require_pattern "$PACKS_ROUTE" "mintDownloadToken\\(c\\.env\\.DB, id, access\\.user\\.id\\)" "installer session-to-download-token mint"
reject_pattern "$PACKS_ROUTE" "claudeMd:\\s*pack\\.merged|agentsMd:\\s*pack\\.merged|settings:\\s*pack\\.merged|promptsMd:\\s*pack\\.merged" "public pack detail payload exposure"
reject_pattern "$PACKS_ROUTE" "\\|\\|\\s*bearer|tokenForInstaller[^\\n]*bearer" "bearer token embedded in installer"

require_pattern "$HEADERS_FILE" "^/packs/\\*/guide\\.html$" "guide-only pack cache header"
reject_pattern "$HEADERS_FILE" "^/packs/\\*$" "broad public pack cache header"

require_pattern "$DEPLOY_WORKFLOW" "upload-protected-packs-to-r2\\.mjs" "R2 upload workflow step"
require_pattern "$DEPLOY_WORKFLOW" "prune-public-pack-downloads\\.mjs" "Pages prune workflow step"
require_pattern "$DEPLOY_WORKFLOW" "needs: \\[sync-data, apply-migrations\\]" "Worker/migration-before-Pages workflow ordering"

echo "checks:     $checked"
echo "violations: ${#violations[@]}"
echo

if [ ${#violations[@]} -eq 0 ]; then
  echo "OK — job-pack payload delivery remains registration-gated; public skill copy is allowed."
  exit 0
fi

echo "FAIL — job-pack auth boundary violations:"
echo
for v in "${violations[@]}"; do
  echo "  • $v"
done
echo
echo "Contract documented in:"
echo "  doc/00_project/initiative_openclaw_foundry/AUTH_SURFACE_INVARIANT.md"
echo
exit 1
