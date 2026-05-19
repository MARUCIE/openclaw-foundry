# Verification Guide - OpenClaw Foundry

This document defines the reproducible commands and checks required to validate the system across different layers.

## Round 1: Automated Verification (Build & Health)

These commands must pass without errors before any release or major feature merge.

### 1. Backend Build & CLI Health
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Compile TypeScript
npm run build

# 3. Run project-local doctor (checks environment, config, manifest)
npm run ocf -- doctor

# 4. Check supported platforms list
npm run ocf -- platforms --check
\`\`\`

### 2. Frontend Build (Web Console)
\`\`\`bash
# 1. Enter web directory
cd web

# 2. Run web build (Next.js)
npm run build
\`\`\`

### 3. Server Smoke Test
\`\`\`bash
# 1. Start the server
npm run server

# 2. In another terminal, check health
curl -s http://localhost:18800/api/health | jq .

# 3. Check model routing list
curl -s http://localhost:18800/api/model-providers | jq .
\`\`\`

## Round 2: Manual / Journey Verification (UX)

Simulate real user behavior against the major surfaces.

| Journey | Surface | Steps | Expected Outcome |
|---------|---------|-------|------------------|
| **Local Install** | CLI | \`ocf init --dry-run\` | Wizard completes, shows summary, emits JSON |
| **Web Wizard** | Browser | Open \`client/index.html\` | Form renders, can navigate steps, links to manual |
| **Portal Catalog** | Web UI | Navigate to \`/explore/platforms\` | Cards render with Tier/Type badges, filters work |
| **Admin Flow** | Web UI | Navigate to \`/admin/customers\` | List of customers visible, Tier dropdown works |
| **LLM Proxy** | API | POST to \`/llm/v1/chat/completions\` | Returns standard OpenAI-compatible response |

## Failure Handling
- **Doctor Fail**: Check \`~/.openclaw\` permissions or Node version.
- **Build Fail**: Fix TypeScript errors in \`src/\` or \`web/\`.
- **API 502**: Ensure upstream keys (Google/Anthropic/OpenAI) are set in environment.
