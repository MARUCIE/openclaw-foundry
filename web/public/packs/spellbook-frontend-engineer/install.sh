#!/bin/bash
# DEPRECATED ALIAS — see deprecated_alias_of in manifest.json
# Local-first redirect: copied Git checkouts and copied pack folders must install
# without relying on the production website. Remote fallback is explicit only.
#
# spellbook 版本于 2026-05-16 三轮蜂群审计中被 Design Simplicity 共识合并入 canonical 入口
set -euo pipefail

LOSER_ID="spellbook-frontend-engineer"
WINNER_ID="frontend-engineer"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_WINNER_INSTALL="$SCRIPT_DIR/../$WINNER_ID/install.sh"

cat <<EOF

  NOTE  This pack ($LOSER_ID) is now a deprecated alias of: $WINNER_ID
  ────────────────────────────────────────────────────────────────────
  spellbook 版本于 2026-05-16 三轮蜂群审计中被 Design Simplicity 共识合并入 canonical 入口

  Redirecting install to canonical local pack ...
  Source: $LOCAL_WINNER_INSTALL

EOF

if [[ -f "$LOCAL_WINNER_INSTALL" ]]; then
  exec bash "$LOCAL_WINNER_INSTALL" "$@"
fi

if [[ -n "${ROLE_PACKS_BASE_URL:-}" ]]; then
  echo "NOTE  Local canonical pack missing; using explicit ROLE_PACKS_BASE_URL override"
  curl -fsSL "$ROLE_PACKS_BASE_URL/packs/$WINNER_ID/install.sh" | bash -s -- "$@"
  exit $?
fi

if [[ -n "${FOUNDRY_BASE_URL:-}" ]]; then
  echo "NOTE  Local canonical pack missing; using explicit FOUNDRY_BASE_URL override"
  curl -fsSL "$FOUNDRY_BASE_URL/packs/$WINNER_ID/install.sh" | bash -s -- "$@"
  exit $?
fi

echo "ERROR  Canonical pack not found next to this alias: $LOCAL_WINNER_INSTALL" >&2
echo "       Clone the full openclaw-role-packs release, or set ROLE_PACKS_BASE_URL explicitly." >&2
exit 1
