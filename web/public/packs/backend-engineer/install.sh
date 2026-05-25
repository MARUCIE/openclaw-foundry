#!/usr/bin/env bash
# OpenClaw Foundry — Job Pack Installer (v5.2, local-first, manifest-driven)
# Pack: backend-engineer
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
# Source selection:
#   1. Default: local files next to this install.sh
#   2. Explicit remote: --remote-base, ROLE_PACKS_BASE_URL, or FOUNDRY_BASE_URL
set -euo pipefail

PACK_ID="backend-engineer"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REMOTE_BASE="${ROLE_PACKS_BASE_URL:-${FOUNDRY_BASE_URL:-}}"
AGENT="${OPENCLAW_AGENT:-}"
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage:
  ./install.sh [--agent=claude|codex|gemini|hermes|openclaw] [--target <dir>] [--remote-base <url>] [--dry-run]

Environment:
  INSTALL_DEST=<dir>          explicit target directory
  OPENCLAW_AGENT=<agent>      default agent selection
  ROLE_PACKS_BASE_URL=<url>   explicit remote base containing /packs/<pack-id>
  FOUNDRY_BASE_URL=<url>      explicit Foundry remote base
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --agent=*) AGENT="${1#--agent=}"; shift ;;
    --agent) AGENT="${2:-}"; shift 2 ;;
    --target=*) INSTALL_DEST="${1#--target=}"; export INSTALL_DEST; shift ;;
    --target|--dest|--destination) INSTALL_DEST="${2:-}"; export INSTALL_DEST; shift 2 ;;
    --remote-base=*) REMOTE_BASE="${1#--remote-base=}"; shift ;;
    --remote-base) REMOTE_BASE="${2:-}"; shift 2 ;;
    --local) REMOTE_BASE=""; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown argument '$1'" >&2; usage >&2; exit 1 ;;
  esac
done

if [ -z "$AGENT" ]; then
  if [ -d "$HOME/.claude" ]; then AGENT="claude"
  elif [ -d "$HOME/.codex" ]; then AGENT="codex"
  elif [ -d "$HOME/.gemini" ]; then AGENT="gemini"
  elif [ -d "$HOME/.hermes" ]; then AGENT="hermes"
  elif [ -d "$HOME/.openclaw" ]; then AGENT="openclaw"
  else AGENT="claude"
  fi
fi

case "$AGENT" in
  claude) DEFAULT_DEST="$HOME/.claude" ;;
  codex) DEFAULT_DEST="$HOME/.codex" ;;
  gemini) DEFAULT_DEST="$HOME/.gemini" ;;
  hermes) DEFAULT_DEST="$HOME/.hermes" ;;
  openclaw) DEFAULT_DEST="$HOME/.openclaw" ;;
  *) echo "ERROR: unknown agent '$AGENT'. Supported: claude | codex | gemini | hermes | openclaw" >&2; exit 1 ;;
esac

TARGET_DIR="${INSTALL_DEST:-$DEFAULT_DEST}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
MANIFEST="$WORK/manifest.json"
TSV="$WORK/items.tsv"

if [ -n "$REMOTE_BASE" ]; then
  SOURCE_MODE="remote"
  BASE_URL="${REMOTE_BASE%/}/packs/$PACK_ID"
else
  SOURCE_MODE="local"
  BASE_URL="$SCRIPT_DIR"
fi

echo "Installing OpenClaw Job Pack: $PACK_ID"
echo "  Agent:  $AGENT"
echo "  Source: $BASE_URL ($SOURCE_MODE)"
echo "  Target: $TARGET_DIR"
echo ""

if [ -z "${INSTALL_DEST:-}" ] && [ ! -d "$TARGET_DIR" ]; then
  echo "  WARN: $TARGET_DIR does not exist ($AGENT CLI not detected)"
  case "$AGENT" in
    claude) echo "        Install Claude Code first: https://claude.com/code" ;;
    codex) echo "        Install Codex CLI first: https://github.com/openai/codex" ;;
    gemini) echo "        Install Gemini CLI first: https://github.com/google/gemini-cli" ;;
    hermes) echo "        Install Hermes agent first; see ~/.hermes/ docs" ;;
    openclaw) echo "        Install OpenClaw first or set INSTALL_DEST=/your/agent/dir" ;;
  esac
  echo ""
fi

if [ "$SOURCE_MODE" = "remote" ]; then
  curl -sfL "$BASE_URL/manifest.json" -o "$MANIFEST"
else
  if [ ! -f "$SCRIPT_DIR/manifest.json" ]; then
    echo "ERROR: local manifest missing: $SCRIPT_DIR/manifest.json" >&2
    echo "       Set ROLE_PACKS_BASE_URL or FOUNDRY_BASE_URL for explicit remote install." >&2
    exit 1
  fi
  cp "$SCRIPT_DIR/manifest.json" "$MANIFEST"
fi

python3 - "$MANIFEST" <<'PYEOF' > "$TSV"
import json
import os
import sys

manifest = json.load(open(sys.argv[1], encoding="utf-8"))
for item in manifest.get("items", []):
    src = item.get("src", "")
    dst = item.get("dst", "")
    typ = item.get("type", "")
    if not src or not dst or not typ:
        raise SystemExit(f"invalid manifest item: {item!r}")
    if os.path.isabs(src) or os.path.isabs(dst) or ".." in src.split("/") or ".." in dst.split("/"):
        raise SystemExit(f"unsafe manifest path: {item!r}")
    print(src, dst, typ, sep="\t")
PYEOF

N="$(wc -l < "$TSV" | tr -d ' ')"
echo "  -> $N artifacts to install"
echo ""

if [ "$DRY_RUN" -eq 0 ]; then
  mkdir -p "$TARGET_DIR"
fi

i=0
while IFS=$'\t' read -r src dst typ; do
  i=$((i+1))
  full_dst="$TARGET_DIR/$dst"
  printf "  [%2d/%d] %-10s %s\n" "$i" "$N" "$typ" "$dst"
  if [ "$DRY_RUN" -eq 1 ]; then
    continue
  fi
  mkdir -p "$(dirname "$full_dst")"
  if [ "$SOURCE_MODE" = "remote" ]; then
    curl -sfL "$BASE_URL/$src" -o "$full_dst"
  else
    full_src="$SCRIPT_DIR/$src"
    if [ ! -f "$full_src" ]; then
      echo "ERROR: missing local artifact: $full_src" >&2
      exit 1
    fi
    cp -p "$full_src" "$full_dst"
  fi
done < "$TSV"

echo ""
echo "  OK Installed $N artifact(s) under $TARGET_DIR"

HINT="$(python3 - "$MANIFEST" <<'PYEOF2'
import json
import sys
try:
    manifest = json.load(open(sys.argv[1], encoding="utf-8"))
    command = (manifest.get("first_use_demo") or {}).get("command", "").strip()
    if command:
        print(command)
except Exception:
    pass
PYEOF2
)"

if [ -n "$HINT" ]; then
  echo ""
  echo "  Now try:"
  echo "    $HINT"
else
  case "$AGENT" in
    claude) echo "  Restart Claude Code to activate." ;;
    codex) echo "  Restart Codex CLI to activate." ;;
    gemini) echo "  Restart Gemini CLI to activate." ;;
    hermes) echo "  Restart Hermes agent to activate (reload ~/.hermes/ config)." ;;
    openclaw) echo "  Restart OpenClaw to activate (reload ~/.openclaw/agents/ + ~/.openclaw/skills/)." ;;
  esac
fi
