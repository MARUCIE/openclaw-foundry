#!/bin/bash
# OpenClaw ConfigPack Installer — Frontend Engineer
# Usage: curl -sL openclaw-foundry.pages.dev/packs/frontend-engineer/install.sh | bash

set -e

PACK_URL="https://openclaw-foundry.pages.dev/packs/frontend-engineer"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}OpenClaw ConfigPack: Frontend Engineer${NC}"
echo "======================================="

echo -e "\n${GREEN}[1/4]${NC} Downloading CLAUDE.md..."
curl -sL "$PACK_URL/CLAUDE.md" -o CLAUDE.md
echo "  -> CLAUDE.md saved (accessibility-first, performance-obsessed)"

echo -e "${GREEN}[2/4]${NC} Downloading AGENTS.md..."
curl -sL "$PACK_URL/AGENTS.md" -o AGENTS.md
echo "  -> AGENTS.md saved (UI Engineer + UX Reviewer + Perf Analyst)"

echo -e "${GREEN}[3/4]${NC} Setting up MCP servers..."
mkdir -p .claude
if [ -f .claude/settings.json ]; then
  cp .claude/settings.json .claude/settings.json.bak
  echo "  -> Existing settings backed up"
fi
curl -sL "$PACK_URL/settings.json" -o .claude/settings.json
echo "  -> .claude/settings.json configured (Chrome DevTools MCP)"
echo "  NOTE: Enable Chrome remote debugging at chrome://inspect"

echo -e "${GREEN}[4/4]${NC} Downloading prompts..."
curl -sL "$PACK_URL/prompts.md" -o prompts.md
echo "  -> prompts.md saved (components, performance, animation, testing)"

echo ""
echo -e "${BLUE}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Enable Chrome DevTools remote debugging"
echo "  2. Run 'claude' — your AI knows React 19 + Tailwind v4 + WCAG 2.1"
echo "  3. Try: 'Build an accessible dropdown with keyboard navigation'"
echo ""
echo "Recommended skills:"
echo "  claude install react-best-practices"
echo "  claude install gsap-core"
echo "  claude install gsap-scrolltrigger"
echo "  claude install design-taste-frontend"
echo "  claude install frontend-testing"
echo "  claude install security-best-practices"
