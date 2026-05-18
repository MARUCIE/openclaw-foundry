#!/bin/bash
# OpenClaw Foundry — Job Pack Installer (v4.1, manifest-driven)
# Pack: ab-test-analyst
set -euo pipefail
PACK_ID="ab-test-analyst"
BASE_URL="${FOUNDRY_BASE_URL:-https://agent-foundry.pages.dev}/packs/$PACK_ID"
TARGET_DIR="${INSTALL_DEST:-$HOME/.claude}"

echo "Installing OpenClaw Job Pack: $PACK_ID (manifest-driven)"
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
for it in m.get("items", []):
    print(f"{it['src']}\t{it['dst']}")
PYEOF

N=0
while IFS=$'\t' read -r SRC DST; do
  TARGET="$TARGET_DIR/$DST"
  mkdir -p "$(dirname "$TARGET")"
  curl -sfL "$BASE_URL/$SRC" -o "$TARGET"
  N=$((N+1))
done < "$TSV"

echo "  OK Installed $N artifacts under $TARGET_DIR"

# Jobs-fix (2026-05-16 audit): if manifest declares first_use_demo, print the
# concrete next-step command so the user knows what to do once Claude restarts.
HINT=$(python3 - "$MANIFEST" <<'PYEOF2'
import json, sys
m = json.load(open(sys.argv[1]))
fud = m.get('first_use_demo') or {}
cmd = fud.get('command', '').strip()
if cmd:
    print(cmd)
PYEOF2
)
if [ -n "$HINT" ]; then
  echo ""
  echo "  Now try:"
  echo "    $HINT"
else
  echo "  Restart Claude Code to activate."
fi
