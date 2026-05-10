#!/bin/bash
# Agent Foundry — Spellbook Job Pack Installer
# Pack: spellbook-test-engineer
# Source of truth: AI-Fleet/configs/spellbook-packs.json
set -euo pipefail
PACK_ID="spellbook-test-engineer"
BASE_URL="https://openclaw-foundry.pages.dev/packs/$PACK_ID"
TARGET_DIR="$HOME/.claude"
echo "Installing Spellbook Job Pack: $PACK_ID..."
mkdir -p "$TARGET_DIR"
for f in CLAUDE.md AGENTS.md settings.json prompts.md; do
  echo "  Downloading $f..."
  curl -sfL "$BASE_URL/$f" -o "$TARGET_DIR/$f"
done
echo ""
echo "Workspace config installed to $TARGET_DIR"
echo ""
echo "Optional deeper integration (requires AI-Fleet checkout):"
echo "  cd /path/to/AI-Fleet"
echo "  bash scripts/spellbook-install.sh --pack test-engineer"
echo ""
echo "Done! Restart Claude Code to activate."
