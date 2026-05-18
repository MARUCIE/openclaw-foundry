#!/bin/bash
# Agent Foundry - Research Analyst Pack Installer (manifest-driven)
set -euo pipefail
PACK_ID="research-analyst"
BASE_URL="${FOUNDRY_BASE_URL:-https://agent-foundry.pages.dev}/packs/$PACK_ID"
TARGET_DIR="${INSTALL_DEST:-$HOME/.claude}"

echo "Installing Research Analyst Pack: $PACK_ID"
echo "  Source: $BASE_URL"
echo "  Target: $TARGET_DIR"
echo ""

mkdir -p "$TARGET_DIR"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
MANIFEST="$WORK/manifest.json"
TSV="$WORK/items.tsv"

echo "  -> Fetching manifest.json"
curl -sfL "$BASE_URL/manifest.json" -o "$MANIFEST"

python3 - "$MANIFEST" <<'PYEOF' > "$TSV"
import json, sys
m = json.load(open(sys.argv[1]))
for item in m['items']:
    print(item['src'], item['dst'], item['type'], sep='\t')
PYEOF

N=$(wc -l < "$TSV" | tr -d ' ')
echo "  -> $N artifacts to install"
echo ""

i=0
while IFS=$'\t' read -r src dst typ; do
  i=$((i+1))
  full_dst="$TARGET_DIR/$dst"
  mkdir -p "$(dirname "$full_dst")"
  printf "  [%2d/%d] %-10s %s\n" "$i" "$N" "$typ" "$dst"
  curl -sfL "$BASE_URL/$src" -o "$full_dst"
done < "$TSV"

echo ""
echo "  OK Installed $N artifacts under $TARGET_DIR"
# Jobs-fix (2026-05-16 audit): if manifest declares first_use_demo, print as next-step hint.
HINT=$(python3 - "$MANIFEST" <<'PYEOF2'
import json, sys
try:
    m = json.load(open(sys.argv[1]))
    fud = m.get("first_use_demo") or {}
    cmd = fud.get("command", "").strip()
    if cmd:
        print(cmd)
except Exception:
    pass
PYEOF2
)
if [ -n "$HINT" ]; then
  echo ""
  echo "  Now try:"
  echo "    $HINT"
fi

echo ""
echo "Uninstall:"
echo "  rm -rf \$HOME/.claude/skills/research \\"
echo "         \$HOME/.claude/agents/research-analyst.md \\"
echo "         \$HOME/.claude/agents/advisor-orwell.md \\"
echo "         \$HOME/.claude/agents/advisor-drucker.md"
