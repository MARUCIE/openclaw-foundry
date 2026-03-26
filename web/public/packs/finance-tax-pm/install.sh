#!/bin/bash
# OpenClaw ConfigPack Installer — Finance & Tax Compliance PM
# Usage: curl -sL openclaw-foundry.pages.dev/packs/finance-tax-pm/install.sh | bash

set -e

PACK_URL="https://openclaw-foundry.pages.dev/packs/finance-tax-pm"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}OpenClaw ConfigPack: Finance & Tax Compliance PM${NC}"
echo "================================================"

# 1. Download CLAUDE.md
echo -e "\n${GREEN}[1/4]${NC} Downloading CLAUDE.md..."
curl -sL "$PACK_URL/CLAUDE.md" -o CLAUDE.md
echo "  -> CLAUDE.md saved to project root"

# 2. Download AGENTS.md
echo -e "${GREEN}[2/4]${NC} Downloading AGENTS.md..."
curl -sL "$PACK_URL/AGENTS.md" -o AGENTS.md
echo "  -> AGENTS.md saved to project root"

# 3. Setup MCP servers
echo -e "${GREEN}[3/4]${NC} Setting up MCP server config..."
mkdir -p .claude
if [ -f .claude/settings.json ]; then
  echo "  -> .claude/settings.json already exists, saving backup..."
  cp .claude/settings.json .claude/settings.json.bak
fi
curl -sL "$PACK_URL/settings.json" -o .claude/settings.json
echo "  -> .claude/settings.json configured"
echo "  NOTE: Replace YOUR_TAVILY_KEY in .claude/settings.json with your actual API key"

# 4. Download prompts
echo -e "${GREEN}[4/4]${NC} Downloading prompts library..."
curl -sL "$PACK_URL/prompts.md" -o prompts.md
echo "  -> prompts.md saved (starter prompts for finance/tax tasks)"

echo ""
echo -e "${BLUE}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .claude/settings.json — add your TAVILY_API_KEY"
echo "  2. Run 'claude' in this directory — AI is now a finance expert"
echo "  3. Try a prompt from prompts.md"
echo ""
echo "Recommended skills to install:"
echo "  claude install compliance-docs"
echo "  claude install sql-queries"
echo "  claude install excel-analysis"
echo "  claude install data-pipeline"
