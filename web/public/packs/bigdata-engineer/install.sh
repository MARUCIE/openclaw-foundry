#!/bin/bash
# OpenClaw Foundry — Job Pack Installer (v5.1, manifest-driven, multi-agent)
# Pack: bigdata-engineer
#
# Single-source-of-truth template. Regenerated for every pack via:
#   node scripts/regenerate-install-scripts.mjs
#
# Multi-agent install matrix:
#   Claude Code  → ~/.claude/    (default)
#   Codex CLI    → ~/.codex/
#   Gemini CLI   → ~/.gemini/
#   Hermes agent → ~/.hermes/
#   OpenClaw     → ~/.openclaw/
#
# Selection precedence:
#   1. INSTALL_DEST env-var (explicit override)
#   2. --agent=<claude|codex|gemini|hermes|openclaw> flag
#   3. OPENCLAW_AGENT env-var
#   4. Auto-detect (first existing of ~/.claude, ~/.codex, ~/.gemini, ~/.hermes, ~/.openclaw)
#   5. Default: ~/.claude
set -euo pipefail
PACK_ID="bigdata-engineer"
BASE_URL="${FOUNDRY_BASE_URL:-https://agent-foundry.pages.dev}/packs/$PACK_ID"

# ---- parse --agent flag ----
AGENT="${OPENCLAW_AGENT:-}"
while [ $# -gt 0 ]; do
  case "$1" in
    --agent=*) AGENT="${1#--agent=}"; shift ;;
    --agent) AGENT="${2:-}"; shift 2 ;;
    -h|--help)
      echo "Usage: install.sh [--agent=claude|codex|gemini|hermes|openclaw]"
      echo "  Env overrides: INSTALL_DEST=<path>  OPENCLAW_AGENT=<agent>  FOUNDRY_BASE_URL=<url>"
      exit 0 ;;
    *) shift ;;
  esac
done

# ---- auto-detect if not explicitly set ----
if [ -z "$AGENT" ]; then
  if [ -d "$HOME/.claude" ]; then AGENT="claude"
  elif [ -d "$HOME/.codex" ]; then AGENT="codex"
  elif [ -d "$HOME/.gemini" ]; then AGENT="gemini"
  elif [ -d "$HOME/.hermes" ]; then AGENT="hermes"
  elif [ -d "$HOME/.openclaw" ]; then AGENT="openclaw"
  else AGENT="claude"
  fi
fi

# ---- map agent → default destination ----
case "$AGENT" in
  claude)   DEFAULT_DEST="$HOME/.claude" ;;
  codex)    DEFAULT_DEST="$HOME/.codex" ;;
  gemini)   DEFAULT_DEST="$HOME/.gemini" ;;
  hermes)   DEFAULT_DEST="$HOME/.hermes" ;;
  openclaw) DEFAULT_DEST="$HOME/.openclaw" ;;
  *)
    echo "ERROR: unknown agent '$AGENT'. Supported: claude | codex | gemini | hermes | openclaw"
    echo "       Override with INSTALL_DEST=<path> for any other CLI."
    exit 1 ;;
esac

TARGET_DIR="${INSTALL_DEST:-$DEFAULT_DEST}"

echo "Installing OpenClaw Job Pack: $PACK_ID"
echo "  Agent:  $AGENT"
echo "  Source: $BASE_URL"
echo "  Target: $TARGET_DIR"
echo ""

# WARN if agent dir missing — install will succeed mechanically but produce no usable agent surface.
if [ -z "${INSTALL_DEST:-}" ] && [ ! -d "$TARGET_DIR" ]; then
  echo "  WARN: $TARGET_DIR does not exist ($AGENT CLI not detected)"
  case "$AGENT" in
    claude)   echo "        Install Claude Code first: https://claude.com/code" ;;
    codex)    echo "        Install Codex CLI first: https://github.com/openai/codex" ;;
    gemini)   echo "        Install Gemini CLI first: https://github.com/google/gemini-cli" ;;
    hermes)   echo "        Install Hermes agent first (AI-Fleet internal); see ~/.hermes/ docs" ;;
    openclaw) echo "        Install OpenClaw first: https://openclaw.dev (or use OpenClaw foundry pack)" ;;
  esac
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

# first-use-demo hint: surface first_use_demo command as a next-step hint.
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
else
  case "$AGENT" in
    claude)   echo "  Restart Claude Code to activate." ;;
    codex)    echo "  Restart Codex CLI to activate." ;;
    gemini)   echo "  Restart Gemini CLI to activate." ;;
    hermes)   echo "  Restart Hermes agent to activate (reload ~/.hermes/ config)." ;;
    openclaw) echo "  Restart OpenClaw to activate (reload ~/.openclaw/agents/ + ~/.openclaw/skills/)." ;;
  esac
fi
