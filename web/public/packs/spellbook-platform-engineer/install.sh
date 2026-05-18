#!/bin/bash
# DEPRECATED ALIAS — see deprecated_alias_of in manifest.json
# Non-destructive: this URL still works for backwards-compat with prior installs and
# direct links. New installs should use the canonical pack at:
#   https://agent-foundry.pages.dev/packs/infra-engineer/install.sh
#
# spellbook 版本于 2026-05-16 三轮蜂群审计中被 Hara 共识合并入 infra-engineer 作为 canonical 入口（platform engineering 在本目录归类为 infrastructure engineering）
set -euo pipefail

LOSER_ID="spellbook-platform-engineer"
WINNER_ID="infra-engineer"
BASE_URL="${{FOUNDRY_BASE_URL:-https://agent-foundry.pages.dev}}"

cat <<EOF

  NOTE  This pack ($LOSER_ID) is now a deprecated alias of: $WINNER_ID
  ────────────────────────────────────────────────────────────────────
  spellbook 版本于 2026-05-16 三轮蜂群审计中被 Hara 共识合并入 infra-engineer 作为 canonical 入口（platform engineering 在本目录归类为 infrastructure engineering）

  Redirecting install to canonical pack ...
  Source: $BASE_URL/packs/$WINNER_ID/install.sh

EOF

# Execute the canonical installer; passes through env vars (INSTALL_DEST, etc.)
exec bash -c "curl -fsSL '$BASE_URL/packs/$WINNER_ID/install.sh' | bash"
