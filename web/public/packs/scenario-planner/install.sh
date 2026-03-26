#!/bin/bash
# OpenClaw Foundry — Job Pack Installer
# Pack: scenario-planner
# Usage: curl -sL https://openclaw-foundry.pages.dev/packs/scenario-planner/install.sh | bash

set -euo pipefail

PACK_ID="scenario-planner"
BASE_URL="https://openclaw-foundry.pages.dev/packs/${PACK_ID}"
TARGET_DIR="${HOME}/.claude"

echo "Installing OpenClaw Job Pack: ${PACK_ID}..."
echo ""

# Create target directory
mkdir -p "${TARGET_DIR}"

# Download files
echo "  Downloading CLAUDE.md..."
curl -sfL "${BASE_URL}/CLAUDE.md" -o "${TARGET_DIR}/CLAUDE.md"

echo "  Downloading AGENTS.md..."
curl -sfL "${BASE_URL}/AGENTS.md" -o "${TARGET_DIR}/AGENTS.md"

echo "  Downloading settings.json..."
curl -sfL "${BASE_URL}/settings.json" -o "${TARGET_DIR}/settings.json"

echo "  Downloading prompts.md..."
curl -sfL "${BASE_URL}/prompts.md" -o "${TARGET_DIR}/prompts.md"

echo ""
echo "Done! Pack '${PACK_ID}' installed to ${TARGET_DIR}/"
echo ""
echo "Files installed:"
echo "  ${TARGET_DIR}/CLAUDE.md      — AI agent configuration"
echo "  ${TARGET_DIR}/AGENTS.md      — Agent team definitions"
echo "  ${TARGET_DIR}/settings.json  — MCP server settings"
echo "  ${TARGET_DIR}/prompts.md     — Starter prompts"
echo ""
echo "Restart Claude Code to activate the new configuration."
