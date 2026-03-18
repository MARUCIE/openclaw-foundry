#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# OpenClaw Foundry — Thin Client Bootstrap (Mac / Linux)
#
# Usage:
#   bash <(curl -sSL http://YOUR_VPS:18800/foundry.sh)              # install
#   bash <(curl -sSL http://YOUR_VPS:18800/foundry.sh) --uninstall  # uninstall
#   bash <(curl -sSL http://YOUR_VPS:18800/foundry.sh) --repair     # repair
#
# This script:
#   1. Collects user info via interactive prompts
#   2. Sends to Foundry Server for AI analysis
#   3. Receives a personalized Blueprint
#   4. Executes the Blueprint locally (installs OpenClaw + skills + config)
# =============================================================================

# --- Config (change these or set env vars) ---
FOUNDRY_SERVER="${OCF_SERVER_URL:-http://100.106.223.39:18800}"
FOUNDRY_API_KEY="${OCF_API_KEY:-}"

# --- Colors ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

ok()   { echo -e "${GREEN}OK${NC} $*"; }
warn() { echo -e "${YELLOW}WARN${NC} $*"; }
err()  { echo -e "${RED}ERROR${NC} $*"; }
note() { echo -e "${CYAN}NOTE${NC} $*"; }

# --- Action routing ---
ACTION="${1:-install}"
OPENCLAW_HOME="$HOME/.openclaw"
MANIFEST_FILE="$OPENCLAW_HOME/.foundry-manifest.json"

if [ "$ACTION" = "--uninstall" ]; then
  echo ""
  echo -e "${BOLD}${CYAN}  OpenClaw Foundry — Uninstall${NC}"
  echo ""

  KEEP_CONFIG=""
  KEEP_MEMORY=""
  for arg in "$@"; do
    case "$arg" in
      --keep-config) KEEP_CONFIG=1 ;;
      --keep-memory) KEEP_MEMORY=1 ;;
    esac
  done

  # Remove skills
  if [ -d "$OPENCLAW_HOME/skills" ]; then
    SKILL_COUNT=$(find "$OPENCLAW_HOME/skills" -maxdepth 1 -mindepth 1 | wc -l | tr -d ' ')
    rm -rf "$OPENCLAW_HOME/skills"/*
    ok "Skills removed ($SKILL_COUNT)"
  fi

  # Remove agents
  if [ -d "$OPENCLAW_HOME/agents" ]; then
    AGENT_COUNT=$(find "$OPENCLAW_HOME/agents" -name '*.json' | wc -l | tr -d ' ')
    rm -f "$OPENCLAW_HOME/agents"/*.json
    ok "Agents removed ($AGENT_COUNT)"
  fi

  # Remove identity
  rm -f "$OPENCLAW_HOME/IDENTITY.md" "$OPENCLAW_HOME/SOUL.md"
  ok "Identity files removed"

  # Config
  if [ -z "$KEEP_CONFIG" ]; then
    rm -f "$OPENCLAW_HOME/openclaw.json"
    ok "Config removed"
  else
    ok "Config kept (--keep-config)"
  fi

  # Memory
  if [ -z "$KEEP_MEMORY" ]; then
    rm -rf "$OPENCLAW_HOME/memory"
    ok "Memory cleared"
  else
    ok "Memory kept (--keep-memory)"
  fi

  # Manifest + audit
  rm -f "$MANIFEST_FILE"
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"uninstall\"}" >> "$OPENCLAW_HOME/audit.jsonl" 2>/dev/null || true

  echo ""
  echo -e "${BOLD}${GREEN}=== Uninstall Complete ===${NC}"
  exit 0
fi

if [ "$ACTION" = "--repair" ]; then
  echo ""
  echo -e "${BOLD}${CYAN}  OpenClaw Foundry — Repair${NC}"
  echo ""

  if [ ! -f "$MANIFEST_FILE" ]; then
    err "No manifest found. Cannot repair without prior Foundry install."
    note "Run the installer first: bash <(curl -sSL $FOUNDRY_SERVER/foundry.sh)"
    exit 1
  fi

  FIXED=0

  # Check directories
  for DIR in "$OPENCLAW_HOME" "$OPENCLAW_HOME/skills" "$OPENCLAW_HOME/agents" "$OPENCLAW_HOME/memory"; do
    if [ ! -d "$DIR" ]; then
      mkdir -p "$DIR"
      ok "Recreated directory: $DIR"
      FIXED=$((FIXED+1))
    fi
  done

  # Check identity files
  for F in IDENTITY.md SOUL.md; do
    if [ ! -f "$OPENCLAW_HOME/$F" ]; then
      ROLE=$(python3 -c "import json; m=json.load(open('$MANIFEST_FILE')); print(m['blueprint']['role'])" 2>/dev/null || echo "unknown")
      if [ "$F" = "IDENTITY.md" ]; then
        echo -e "# Identity\n\nRole: $ROLE\nSetup: OpenClaw Foundry (repaired)\n" > "$OPENCLAW_HOME/$F"
      else
        echo -e "# Soul\n\nYou are a skilled $ROLE.\n" > "$OPENCLAW_HOME/$F"
      fi
      ok "Regenerated $F"
      FIXED=$((FIXED+1))
    else
      ok "$F present"
    fi
  done

  # Check config
  if [ ! -f "$OPENCLAW_HOME/openclaw.json" ]; then
    AUTONOMY=$(python3 -c "import json; m=json.load(open('$MANIFEST_FILE')); print(m['config']['autonomy'])" 2>/dev/null || echo "L1-guided")
    ROUTING=$(python3 -c "import json; m=json.load(open('$MANIFEST_FILE')); print(m['config']['modelRouting'])" 2>/dev/null || echo "balanced")
    CHUNKS=$(python3 -c "import json; m=json.load(open('$MANIFEST_FILE')); print(m['config']['memoryChunks'])" 2>/dev/null || echo "72")
    echo "{\"autonomy\":{\"level\":\"$AUTONOMY\"},\"model\":{\"routing\":\"$ROUTING\"},\"memory\":{\"chunks\":$CHUNKS}}" > "$OPENCLAW_HOME/openclaw.json"
    ok "Regenerated openclaw.json"
    FIXED=$((FIXED+1))
  else
    ok "Config present"
  fi

  # Check skills count
  EXPECTED_SKILLS=$(python3 -c "import json; m=json.load(open('$MANIFEST_FILE')); print(len(m['skills']['aifleet'])+len(m['skills']['clawhub']))" 2>/dev/null || echo "0")
  ACTUAL_SKILLS=$(find "$OPENCLAW_HOME/skills" -maxdepth 1 -mindepth 1 2>/dev/null | wc -l | tr -d ' ')
  if [ "$ACTUAL_SKILLS" -lt "$EXPECTED_SKILLS" ]; then
    warn "Skills: $ACTUAL_SKILLS/$EXPECTED_SKILLS installed (re-run installer for full repair)"
  else
    ok "Skills: $ACTUAL_SKILLS installed"
  fi

  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"repair\",\"fixed\":$FIXED}" >> "$OPENCLAW_HOME/audit.jsonl" 2>/dev/null || true

  echo ""
  if [ "$FIXED" -gt 0 ]; then
    echo -e "${BOLD}${GREEN}=== Repair Complete: $FIXED issue(s) fixed ===${NC}"
  else
    echo -e "${BOLD}${GREEN}=== All checks passed — nothing to repair ===${NC}"
  fi
  exit 0
fi

# --- Banner ---
echo ""
echo -e "${BOLD}${CYAN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}  ║     OpenClaw Foundry Installer       ║${NC}"
echo -e "${BOLD}${CYAN}  ║   AI-driven one-click deployment     ║${NC}"
echo -e "${BOLD}${CYAN}  ╚══════════════════════════════════════╝${NC}"
echo ""

# --- Check server reachability ---
note "Connecting to Foundry Server: $FOUNDRY_SERVER"
if ! curl -sf "${FOUNDRY_SERVER}/api/health" >/dev/null 2>&1; then
  err "Cannot reach Foundry Server at ${FOUNDRY_SERVER}"
  err "Make sure the server is running (npm run server on VPS)"
  exit 1
fi
ok "Server connected"
echo ""

# --- Check Node.js ---
if ! command -v node &>/dev/null; then
  warn "Node.js not found. Attempting to install via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install --lts
fi

NODE_VER=$(node --version 2>/dev/null || echo "none")
NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ] 2>/dev/null; then
  err "Node.js >= 18 required (found $NODE_VER)"
  exit 1
fi
ok "Node.js $NODE_VER"

# --- Detect OS ---
OS="$(uname -s)"
case "$OS" in
  Darwin*) OS_ID="darwin"; OS_LABEL="macOS" ;;
  Linux*)  OS_ID="linux";  OS_LABEL="Linux" ;;
  *)       OS_ID="linux";  OS_LABEL="$OS" ;;
esac
note "Detected OS: $OS_LABEL"
echo ""

# --- Interactive Wizard ---
echo -e "${BOLD}--- Setup Questions ---${NC}"
echo ""

# Name
read -rp "Your name [$(whoami)]: " USER_NAME
USER_NAME="${USER_NAME:-$(whoami)}"

# Role (Boss直聘 internet company taxonomy)
echo ""
echo "  Your primary role:"
echo "    --- Development ---"
echo "     1) Full-Stack Developer       2) Frontend (React/Vue)"
echo "     3) Java/Spring Backend        4) Go Backend"
echo "     5) Python Backend             6) Node.js/TypeScript Backend"
echo "     7) C/C++ Systems              8) iOS/Android Mobile"
echo "     9) Embedded/IoT"
echo "    --- QA & Infra ---"
echo "    10) QA/Testing                11) DevOps/SRE"
echo "    12) DBA                       13) Security Engineer"
echo "    --- Data & AI ---"
echo "    14) Data Analyst/BI           15) Data Engineer"
echo "    16) Algorithm (Rec/NLP/CV)    17) AI/LLM Engineer"
echo "    --- Product & Design ---"
echo "    18) Product Manager           19) AI Product Manager"
echo "    20) Project Manager           21) UI/UX Designer"
echo "    22) Visual/Brand Designer"
echo "    --- Operations ---"
echo "    23) User/Community Ops        24) Content/New Media Ops"
echo "    25) E-commerce Ops            26) Data/Strategy Ops"
echo "    --- Marketing & Sales ---"
echo "    27) SEO/SEM                   28) Marketing/Brand"
echo "    29) Sales/BD                  30) Pre-sales/CS"
echo "    --- Corporate ---"
echo "    31) Finance/Accounting        32) Legal/Compliance"
echo "    33) HR/Recruiting"
echo "    --- Other ---"
echo "    34) CTO/Tech Lead             35) Researcher"
echo "    36) Educator"
echo ""
read -rp "  Choose [1-36]: " ROLE_NUM
ROLES=("fullstack-developer" "frontend-developer" "java-developer" "go-developer" "python-developer" "backend-developer" "cpp-developer" "mobile-developer" "embedded-developer" "qa-tester" "devops" "dba" "security-engineer" "data-analyst" "data-engineer" "algorithm-engineer" "ml-ai-engineer" "product-manager" "ai-product-manager" "project-manager" "designer-ux" "visual-designer" "user-ops" "content-ops" "ecommerce-ops" "data-ops" "seo-sem" "marketing-growth" "sales-bizdev" "customer-support" "finance-accounting" "compliance" "hr-recruiter" "cto-tech-lead" "researcher" "educator")
ROLE="${ROLES[$((ROLE_NUM - 1))]:-fullstack-developer}"

# Industry
echo ""
echo "  Your industry:"
echo "    1) SaaS / Enterprise      2) FinTech"
echo "    3) E-commerce / Retail    4) Gaming / Entertainment"
echo "    5) Education / EdTech     6) Healthcare"
echo "    7) Content / Media        8) IoT / Hardware"
echo "    9) AI / LLM-native       10) General / Other"
echo ""
read -rp "  Choose [1-10]: " IND_NUM
IND_MAP=("saas" "fintech" "ecommerce" "gaming" "education" "healthcare" "media" "iot" "ai-native" "general")
INDUSTRY="${IND_MAP[$((IND_NUM - 1))]:-general}"

# Experience level
echo ""
echo "  Your experience level:"
echo "    1) Junior (0-2 years)     2) Mid (2-5 years)"
echo "    3) Senior (5-10 years)    4) Lead / Manager"
echo "    5) Director / VP / CTO"
echo ""
read -rp "  Choose [1-5]: " LVL_NUM
LVL_MAP=("junior" "mid" "senior" "lead" "executive")
LEVEL="${LVL_MAP[$((LVL_NUM - 1))]:-mid}"

# Team size
echo ""
echo "  Your team size:"
echo "    1) Solo                   2) Small (2-10)"
echo "    3) Medium (10-50)         4) Large (50+)"
echo ""
read -rp "  Choose [1-4]: " TEAM_NUM
TEAM_MAP=("solo" "small" "medium" "large")
TEAM_SIZE="${TEAM_MAP[$((TEAM_NUM - 1))]:-small}"

# Use cases
echo ""
echo "  Main use cases (enter numbers separated by spaces):"
echo "     1) Coding          2) Code Review     3) Testing/QA"
echo "     4) API Dev         5) Mobile Dev      6) ML/AI"
echo "     7) DevOps/CI-CD    8) Security"
echo "     9) Project Mgmt   10) Marketing/SEO  11) Sales/BD"
echo "    12) Customer Support 13) Finance      14) E-commerce"
echo "    15) Research        16) Tech Writing   17) Content/Social"
echo "    18) Education       19) Data Analysis  20) Design"
echo "    21) Automation      22) Compliance     23) IoT/Embedded"
echo ""
read -rp "  Choose: " UC_NUMS
UC_MAP=("coding" "code-review" "testing-qa" "api-development" "mobile-development" "ml-ai" "devops-cicd" "security" "project-management" "marketing-seo" "sales-bizdev" "customer-support" "finance-accounting" "ecommerce" "research" "writing" "content-social" "education-training" "data-analysis" "design" "automation" "compliance" "iot-embedded")
USE_CASES=""
for n in $UC_NUMS; do
  idx=$((n - 1))
  if [ $idx -ge 0 ] && [ $idx -lt ${#UC_MAP[@]} ]; then
    USE_CASES="${USE_CASES:+$USE_CASES,}\"${UC_MAP[$idx]}\""
  fi
done

# Deliverables
echo ""
echo "  What deliverables do you produce? (enter numbers separated by spaces, or 0 for none):"
echo "     1) PDF           2) PPT/Slides    3) Word/Docs     4) Excel"
echo "     5) Text/Articles 6) Images        7) Video         8) Posters"
echo "     9) Diagrams     10) Prototypes   11) Reports      12) Code"
echo "    13) Articles (WeChat/social)"
echo ""
read -rp "  Choose: " DEL_NUMS
DEL_MAP=("pdf" "ppt" "word" "excel" "text" "image" "video" "poster" "diagram" "prototype" "report" "code" "article")
DELIVERABLES=""
for n in $DEL_NUMS; do
  idx=$((n - 1))
  if [ $idx -ge 0 ] && [ $idx -lt ${#DEL_MAP[@]} ]; then
    DELIVERABLES="${DELIVERABLES:+$DELIVERABLES,}\"${DEL_MAP[$idx]}\""
  fi
done

# Languages
echo ""
echo "  Languages (enter numbers separated by spaces):"
echo "    1) TypeScript/JS  2) Python  3) Go      4) Rust"
echo "    5) Java/Kotlin    6) Swift   7) C/C++   8) SQL   9) Shell"
echo ""
read -rp "  Choose: " LANG_NUMS
LANG_MAP=("typescript" "python" "go" "rust" "java" "swift" "cpp" "sql" "shell")
LANGUAGES=""
for n in $LANG_NUMS; do
  idx=$((n - 1))
  if [ $idx -ge 0 ] && [ $idx -lt ${#LANG_MAP[@]} ]; then
    LANGUAGES="${LANGUAGES:+$LANGUAGES,}\"${LANG_MAP[$idx]}\""
  fi
done

# Autonomy
echo ""
echo "  AI autonomy level:"
echo "    1) L1 Guided  — AI suggests, you approve"
echo "    2) L2 Semi    — AI acts on routine, asks for important"
echo "    3) L3 Full    — AI handles everything"
echo ""
read -rp "  Choose [1-3]: " AUTO_NUM
AUTO_MAP=("L1-guided" "L2-semi" "L3-full")
AUTONOMY="${AUTO_MAP[$((AUTO_NUM - 1))]:-L1-guided}"

# Integrations
echo ""
echo "  Integrations (enter numbers, or 0 for none):"
echo "     1) GitHub      2) Telegram   3) Slack     4) Discord"
echo "     5) Notion      6) Linear     7) Jira      8) Google Workspace"
echo "     9) Supabase   10) Vercel    11) AWS      12) Stripe"
echo "    13) Shopify    14) HubSpot   15) PostgreSQL"
echo ""
read -rp "  Choose: " INT_NUMS
INT_MAP=("github" "telegram" "slack" "discord" "notion" "linear" "jira" "google" "supabase" "vercel" "aws" "stripe" "shopify" "hubspot" "postgres")
INTEGRATIONS=""
for n in $INT_NUMS; do
  idx=$((n - 1))
  if [ $idx -ge 0 ] && [ $idx -lt ${#INT_MAP[@]} ]; then
    INTEGRATIONS="${INTEGRATIONS:+$INTEGRATIONS,}\"${INT_MAP[$idx]}\""
  fi
done

# --- Build JSON payload ---
PAYLOAD=$(cat <<EOJSON
{
  "userName": "$USER_NAME",
  "os": "$OS_ID",
  "role": "$ROLE",
  "industry": "$INDUSTRY",
  "level": "$LEVEL",
  "teamSize": "$TEAM_SIZE",
  "useCases": [$USE_CASES],
  "deliverables": [$DELIVERABLES],
  "languages": [$LANGUAGES],
  "autonomy": "$AUTONOMY",
  "integrations": [$INTEGRATIONS],
  "llmMode": "skip"
}
EOJSON
)

echo ""
note "Sending to Foundry Server for AI analysis..."
echo ""

# --- Call server ---
AUTH_HEADER=""
if [ -n "$FOUNDRY_API_KEY" ]; then
  AUTH_HEADER="-H \"x-api-key: $FOUNDRY_API_KEY\""
fi

RESPONSE=$(curl -sS -X POST "${FOUNDRY_SERVER}/api/analyze" \
  -H "Content-Type: application/json" \
  ${AUTH_HEADER:+-H "x-api-key: $FOUNDRY_API_KEY"} \
  -d "$PAYLOAD")

# Check for error
if echo "$RESPONSE" | grep -q '"error"'; then
  err "Server returned error: $RESPONSE"
  exit 1
fi

# Extract blueprint
BLUEPRINT=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['blueprint'], indent=2))" 2>/dev/null \
  || echo "$RESPONSE" | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>console.log(JSON.stringify(JSON.parse(d.join('')).blueprint,null,2)))")

ok "Blueprint received!"
echo ""

# --- Save blueprint ---
BP_FILE="/tmp/openclaw-blueprint-$(date +%Y%m%d-%H%M%S).json"
echo "$BLUEPRINT" > "$BP_FILE"
note "Blueprint saved to $BP_FILE"

# --- Execute Blueprint ---
echo ""
echo -e "${BOLD}--- Installing OpenClaw ---${NC}"
echo ""

# Install OpenClaw
if ! command -v openclaw &>/dev/null; then
  note "Installing OpenClaw..."
  npm install -g @anthropic/openclaw 2>/dev/null || warn "OpenClaw install failed, continue manually"
fi

# Create directories
mkdir -p ~/.openclaw/skills ~/.openclaw/agents ~/.openclaw/memory

# Identity
ROLE_VALUE=$(echo "$BLUEPRINT" | python3 -c "import sys,json; print(json.load(sys.stdin)['identity']['role'])" 2>/dev/null || echo "$ROLE")
PROFILE_VALUE=$(echo "$BLUEPRINT" | python3 -c "import sys,json; print(json.load(sys.stdin)['meta'].get('profile','custom'))" 2>/dev/null || echo "custom")

cat > ~/.openclaw/IDENTITY.md << EOF
# Identity

Role: $ROLE_VALUE
Setup: OpenClaw Foundry
Profile: $PROFILE_VALUE
EOF
ok "Identity generated"

# Config
CONFIG_JSON=$(echo "$BLUEPRINT" | python3 -c "
import sys, json
bp = json.load(sys.stdin)
cfg = {
  'autonomy': {'level': bp['config']['autonomy']},
  'model': {'routing': bp['config']['modelRouting']},
  'memory': {'chunks': bp['config']['memoryChunks']},
  'mcpServers': bp.get('mcpServers', []),
  'extensions': bp.get('extensions', []),
  '_foundry': {'blueprint': bp['meta']['name'], 'profile': bp['meta'].get('profile','custom'), 'created': bp['meta']['created']}
}
print(json.dumps(cfg, indent=2))
" 2>/dev/null || echo '{}')

echo "$CONFIG_JSON" > ~/.openclaw/openclaw.json
ok "Config applied"

# Skills from ClawHub
CLAWHUB_SKILLS=$(echo "$BLUEPRINT" | python3 -c "
import sys,json
for s in json.load(sys.stdin)['skills'].get('fromClawhub',[]):
  print(s)
" 2>/dev/null || true)

if [ -n "$CLAWHUB_SKILLS" ]; then
  while IFS= read -r skill; do
    openclaw skills install "$skill" 2>/dev/null && ok "Skill: $skill" || warn "Skill failed: $skill"
  done <<< "$CLAWHUB_SKILLS"
fi

# Verify
echo ""
openclaw doctor 2>/dev/null || warn "Run 'openclaw doctor' manually to verify"

echo ""
echo -e "${BOLD}${GREEN}=== Installation Complete ===${NC}"
echo -e "Blueprint: ${BP_FILE}"
echo -e "Run ${CYAN}openclaw${NC} to start your customized environment."
echo ""
