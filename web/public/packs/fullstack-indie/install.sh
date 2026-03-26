#!/bin/bash
# OpenClaw ConfigPack Installer — Full-Stack Indie Developer
# Usage: curl -sL openclaw-foundry.pages.dev/packs/fullstack-indie/install.sh | bash

set -e

PACK_URL="https://openclaw-foundry.pages.dev/packs/fullstack-indie"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}OpenClaw ConfigPack: Full-Stack Indie Developer${NC}"
echo "================================================"

echo -e "\n${GREEN}[1/4]${NC} Downloading CLAUDE.md..."
curl -sL "$PACK_URL/CLAUDE.md" -o CLAUDE.md
echo "  -> CLAUDE.md saved"

echo -e "${GREEN}[2/4]${NC} Downloading AGENTS.md..."
curl -sL "$PACK_URL/AGENTS.md" -o AGENTS.md
echo "  -> AGENTS.md saved"

echo -e "${GREEN}[3/4]${NC} Setting up MCP servers..."
mkdir -p .claude
if [ -f .claude/settings.json ]; then
  cp .claude/settings.json .claude/settings.json.bak
  echo "  -> Existing settings backed up"
fi
curl -sL "$PACK_URL/settings.json" -o .claude/settings.json
echo "  -> .claude/settings.json configured"
echo "  NOTE: Replace YOUR_GITHUB_TOKEN and YOUR_SUPABASE_* keys"

echo -e "${GREEN}[4/4]${NC} Downloading prompts..."
curl -sL "$PACK_URL/prompts.md" -o prompts.md
echo "  -> prompts.md saved"

echo ""
echo -e "${BLUE}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .claude/settings.json — add your API keys"
echo "  2. Run 'claude' — your AI is now a solo dev teammate"
echo "  3. Try: 'Scaffold a SaaS landing page with Stripe checkout'"
echo ""
echo "Recommended skills:"
echo "  claude install react-best-practices"
echo "  claude install fastapi-templates"
echo "  claude install docker-optimizer"
echo "  claude install deploy-preview"
echo "  claude install database-designer"
echo "  claude install security-best-practices"
