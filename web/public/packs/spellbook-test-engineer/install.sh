#!/bin/bash
# DEPRECATED ALIAS — see deprecated_alias_of in manifest.json
# Non-destructive: this URL still works for backwards-compat with prior installs and direct links.
# New installs should use the canonical pack at:
#   https://agent-foundry.pages.dev/packs/test-engineer/install.sh
#
# spellbook 版本于 2026-05-16 三轮蜂群审计中被 Hara 共识合并入 canonical 入口
set -euo pipefail

LOSER_ID="spellbook-test-engineer"
WINNER_ID="test-engineer"
BASE_URL="${FOUNDRY_BASE_URL:-https://agent-foundry.pages.dev}"

cat <<EOF

  NOTE  This pack ($LOSER_ID) is now a deprecated alias of: $WINNER_ID
  ────────────────────────────────────────────────────────────────────
  spellbook 版本于 2026-05-16 三轮蜂群审计中被 Hara 共识合并入 canonical 入口

  Redirecting install to canonical pack ...
  Source: $BASE_URL/packs/$WINNER_ID/install.sh

EOF

# Execute the canonical installer; passes through env vars and CLI args (INSTALL_DEST, --agent, etc.)
curl -fsSL "$BASE_URL/packs/$WINNER_ID/install.sh" | bash -s -- "$@"
