#!/bin/bash
# OpenClaw Foundry — Job Pack Installer (v4.1, manifest-driven)
# Pack: scenario-planner
set -euo pipefail
PACK_ID="scenario-planner"
BASE_URL="${FOUNDRY_BASE_URL:-https://agent-foundry.pages.dev}/packs/$PACK_ID"
TARGET_DIR="${INSTALL_DEST:-$HOME/.claude}"

echo "Installing OpenClaw Job Pack: $PACK_ID (manifest-driven)"
echo "  Source: $BASE_URL"
echo "  Target: $TARGET_DIR"
echo ""

# R3.2 (audit F9): warn if Claude Code dir missing — install will succeed
# mechanically but produce no usable agent surface. Soft-fail, do not block.
if [ -z "${INSTALL_DEST:-}" ] && [ ! -d "$HOME/.claude" ]; then
  echo "  WARN: $HOME/.claude does not exist (Claude Code not detected)"
  echo "        Install Claude Code first: https://claude.com/code"
  echo "        Or set INSTALL_DEST=/your/agent/dir and re-run"
  echo ""
fi

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

# Jobs-fix (2026-05-16 audit): if manifest declares first_use_demo, print it as next-step hint.
# Fleet-wide leverage point — eliminates the "installed but unusable" UX gap across all 21 packs.
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
