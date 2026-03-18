import { GoogleGenerativeAI } from '@google/generative-ai';
import type { WizardAnswers, Blueprint, CatalogEntry } from './types.js';
import { BlueprintSchema } from './types.js';
import { catalogToPromptText } from './catalog.js';
import { routeCapabilities, CAPABILITY_REGISTRY, type DimensionalContext } from './capability-registry.js';
import { spinner, log, today } from './utils.js';

// ----- System prompt for AI blueprint generation -----

const SYSTEM_PROMPT = `You are OpenClaw Foundry's AI analyzer.
Your job: given a user profile and an available skills catalog,
generate a Blueprint JSON that sets up a fully customized OpenClaw environment.

Rules:
1. Only select skills that EXIST in the provided catalog.  Do not invent names.
2. Select 8-20 skills that best match the user's role + use cases.
3. Create 1-3 agents with clear role separation.
4. Set sensible cron jobs only if the use cases clearly warrant scheduled tasks.
5. Map integrations to MCP servers when a direct match exists.
6. Respond with ONLY valid JSON.  No markdown fences, no explanation.`;

// ----- Main entry: AI analysis → Blueprint -----

export async function analyzeAndGenerateBlueprint(
  answers: WizardAnswers,
  catalog: CatalogEntry[],
): Promise<Blueprint> {
  const spin = spinner('AI analyzing your needs...');
  spin.start();

  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      spin.stop();
      log.warn('No API key found (GOOGLE_API_KEY / GEMINI_API_KEY). Using rule-based fallback.');
      return normalizeBlueprint(ruleBasedBlueprint(answers, catalog), answers, catalog);
    }

    // Support custom base URL for geo-restricted VPS (CF Worker proxy)
    const baseUrl = process.env.GEMINI_BASE_URL;
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.OCF_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel(
      { model: modelName },
      baseUrl ? { baseUrl } : undefined,
    );

    const userPrompt = buildPrompt(answers, catalog);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: SYSTEM_PROMPT,
    });

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');

    const blueprint = normalizeBlueprint(
      BlueprintSchema.parse(JSON.parse(jsonMatch[0])),
      answers,
      catalog,
    );
    spin.succeed('Blueprint generated');
    return blueprint;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    spin.fail('AI analysis failed');
    log.warn(`Falling back to rule-based analysis: ${msg}`);
    return normalizeBlueprint(ruleBasedBlueprint(answers, catalog), answers, catalog);
  }
}

// ----- Prompt construction -----

function buildPrompt(answers: WizardAnswers, catalog: CatalogEntry[]): string {
  // Include capability categories for AI context
  const categoryList = CAPABILITY_REGISTRY
    .map(c => `- ${c.id}: ${c.name} (${c.skills.length} skills)`)
    .join('\n');

  return `## User Profile
- Name: ${answers.userName}
- OS: ${answers.os}
- Role: ${answers.role}
- Industry: ${answers.industry || 'general'}
- Experience: ${answers.level || 'mid'}
- Team Size: ${answers.teamSize || 'small'}
- Use Cases: ${answers.useCases.join(', ')}
- Deliverables: ${(answers.deliverables || []).join(', ') || 'none specified'}
- Languages: ${answers.languages.join(', ')}
- Autonomy: ${answers.autonomy}
- Integrations: ${answers.integrations.join(', ') || 'none'}

## Capability Categories
${categoryList}

## Available Skills Catalog
${catalogToPromptText(catalog)}

## Blueprint JSON Schema
{
  "version": "1.0",
  "meta": { "name": string, "os": "${answers.os}", "created": "${today()}", "profile": string, "description": string },
  "openclaw": { "version": "latest", "installMethod": "npm" },
  "identity": { "role": string, "soulTemplate": string },
  "skills": { "fromAifleet": string[], "fromClawhub": string[], "custom": [] },
  "agents": [{ "name": string, "role": string, "jobs": string[] }],
  "config": { "autonomy": "${answers.autonomy}", "modelRouting": "balanced", "memoryChunks": 72 },
  "cron": [{ "schedule": string, "job": string, "description": string }],
  "mcpServers": string[],
  "extensions": string[]
}

Generate the Blueprint JSON:`;
}

export function normalizeBlueprint(
  blueprint: Blueprint,
  answers: WizardAnswers,
  catalog: CatalogEntry[],
): Blueprint {
  const catalogById = new Map(catalog.map(entry => [entry.id, entry]));
  const combinedSkillIds = [
    ...blueprint.skills.fromAifleet,
    ...blueprint.skills.fromClawhub,
  ];

  const fromAifleet: string[] = [];
  const fromClawhub: string[] = [];
  const seen = new Set<string>();

  for (const id of combinedSkillIds) {
    if (seen.has(id)) continue;
    seen.add(id);

    const entry = catalogById.get(id);
    if (!entry) continue;

    if (entry.source === 'aifleet') fromAifleet.push(id);
    else fromClawhub.push(id);
  }

  return {
    ...blueprint,
    meta: {
      ...blueprint.meta,
      os: answers.os,
      created: today(),
    },
    identity: {
      ...blueprint.identity,
      role: answers.role,
    },
    skills: {
      ...blueprint.skills,
      fromAifleet,
      fromClawhub,
    },
    config: {
      ...blueprint.config,
      autonomy: answers.autonomy as Blueprint['config']['autonomy'],
    },
    llm: buildLlmConfig(answers),
  };
}

// ----- Rule-based fallback (no API key needed) -----
// Uses capability-registry.ts for skill/MCP routing

const INTEGRATION_MCP: Record<string, string> = {
  github: 'github', slack: 'slack', notion: 'notion',
  linear: 'linear', google: 'google-workspace',
  supabase: 'supabase', vercel: 'vercel', aws: 'aws',
  stripe: 'stripe', shopify: 'shopify', hubspot: 'hubspot',
  postgres: 'postgres', jira: 'jira', discord: 'discord',
  telegram: 'telegram',
};

const SOUL_TEMPLATES: Record<string, string> = {
  // === 技术开发 ===
  'fullstack-developer': 'You are a meticulous full-stack engineer who values clean code, thorough testing, and pragmatic architecture.',
  'frontend-developer':  'You are a detail-oriented frontend engineer who bridges design and engineering with pixel-perfect UIs and responsive experiences.',
  'java-developer':      'You are a disciplined Java/Spring engineer who values enterprise patterns, type safety, and production-grade architecture.',
  'go-developer':        'You are a Go engineer who writes simple, concurrent, high-performance services with strong observability and minimal dependencies.',
  'python-developer':    'You are a versatile Python developer who writes idiomatic, well-tested code for web services, data pipelines, and automation.',
  'backend-developer':   'You are a Node.js/TypeScript backend engineer who builds scalable APIs with strong typing, async patterns, and clean architecture.',
  'cpp-developer':       'You are a systems programmer who writes performant, memory-safe C/C++ code for low-latency and resource-constrained environments.',
  'mobile-developer':    'You are a mobile-first engineer who crafts responsive, performant apps with great user experience across iOS and Android.',
  'embedded-developer':  'You are an embedded systems engineer who writes reliable firmware and IoT solutions with real-time constraints and hardware awareness.',
  // === 质量与基础设施 ===
  'qa-tester':           'You are a quality-obsessed test engineer who finds edge cases, automates regression suites, and ensures every release is bulletproof.',
  'devops':              'You are a reliability-focused DevOps/SRE engineer who automates infrastructure, CI/CD pipelines, and makes deployments boring.',
  'dba':                 'You are a database specialist who designs schemas, optimizes queries, manages replication, and ensures data integrity at scale.',
  'security-engineer':   'You are a security engineer who identifies vulnerabilities, builds defense-in-depth systems, and ensures compliance with security standards.',
  // === 数据与算法 ===
  'data-analyst':        'You are an analytical thinker who turns raw data into actionable insights with SQL, visualization, and rigorous methodology.',
  'data-engineer':       'You are a data engineer who builds reliable ETL pipelines, data warehouses, and real-time streaming architectures.',
  'algorithm-engineer':  'You are an algorithm engineer who designs and optimizes recommendation, search, NLP, or CV models with measurable business impact.',
  'ml-ai-engineer':      'You are an AI/LLM engineer who builds reproducible ML pipelines, fine-tunes models, and deploys with monitoring and evaluation.',
  // === 产品 ===
  'product-manager':     'You are a data-driven product manager who balances user needs with business goals, writes clear PRDs, and ships iteratively.',
  'ai-product-manager':  'You are an AI product manager who bridges technical ML capabilities with user needs, defining metrics and evaluation frameworks.',
  'project-manager':     'You are a disciplined project manager who tracks milestones, manages risks, coordinates cross-team dependencies, and delivers on time.',
  // === 设计 ===
  'designer-ux':         'You are a user-centered UI/UX designer who combines aesthetic taste with usability principles, design systems, and accessibility standards.',
  'visual-designer':     'You are a visual/brand designer who creates compelling graphics, establishes brand identity, and maintains design consistency.',
  // === 运营 ===
  'user-ops':            'You are a user/community operator who drives retention, engagement, and growth through data-informed strategies and empathetic communication.',
  'content-ops':         'You are a content/new-media operator who creates platform-native content for WeChat, Douyin, Weibo, and Xiaohongshu with strong conversion.',
  'ecommerce-ops':       'You are an e-commerce operator who optimizes listings, manages campaigns, tracks ROI, and drives GMV across Taobao, JD, or Amazon.',
  'data-ops':            'You are a data/strategy operator who uses analytics to inform operational decisions, design A/B tests, and optimize funnels.',
  // === 市场与销售 ===
  'seo-sem':             'You are an SEO/SEM specialist who optimizes search rankings, manages paid campaigns, and maximizes ROI on information-flow advertising.',
  'marketing-growth':    'You are a growth-minded marketer who combines brand building, PR, and data analytics to drive acquisition and market presence.',
  'sales-bizdev':        'You are a consultative sales/BD professional who understands customer pain points and crafts compelling value propositions.',
  'customer-support':    'You are a customer success specialist who resolves issues efficiently, builds knowledge bases, and drives customer satisfaction.',
  // === 职能 ===
  'finance-accounting':  'You are a detail-oriented finance professional who ensures accuracy, compliance, and clear financial reporting.',
  'compliance':          'You are a meticulous legal/compliance specialist who ensures every deliverable meets regulatory standards.',
  'hr-recruiter':        'You are a strategic HR professional who attracts talent, designs org structures, and builds culture with data-driven practices.',
  // === 管理与研究 ===
  'cto-tech-lead':       'You are a strategic technical leader who balances architecture vision with team velocity, making pragmatic trade-offs.',
  'researcher':          'You are a curious and systematic researcher who synthesizes information from diverse sources with academic rigor.',
  'educator':            'You are a patient, structured educator who breaks complex concepts into clear, engaging learning experiences.',
};

function ruleBasedBlueprint(answers: WizardAnswers, catalog: CatalogEntry[]): Blueprint {
  const catalogIds = new Set(catalog.map(c => c.id));
  const aifleetIds = new Set(catalog.filter(c => c.source === 'aifleet').map(c => c.id));

  // Route through capability registry (multi-dimensional)
  const roleKey = answers.role.toLowerCase().replace(/\s+/g, '-');
  const dimensions: DimensionalContext = {
    industry: answers.industry,
    level: answers.level,
    teamSize: answers.teamSize,
    deliverables: answers.deliverables,
  };
  const routed = routeCapabilities(roleKey, answers.useCases, undefined, dimensions);

  // Collect candidate skill IDs from registry + baseline
  const selected = new Set<string>(routed.skills);
  for (const s of ['commit-helper', 'search-first', 'grammar-check']) selected.add(s);

  // Partition by source (only keep skills that actually exist in catalog)
  const fromAifleet: string[] = [];
  const fromClawhub: string[] = [];
  for (const id of selected) {
    if (aifleetIds.has(id)) fromAifleet.push(id);
    else if (catalogIds.has(id)) fromClawhub.push(id);
    else fromAifleet.push(id); // optimistic: might exist but not scanned
  }

  // Agents — smart composition based on matched categories
  const agents = [
    { name: 'main', role: `Primary ${answers.role} assistant`, jobs: answers.useCases.slice(0, 5) },
  ];
  if (routed.categories.some(c => ['research', 'data-analytics', 'ml-ai'].includes(c))) {
    agents.push({ name: 'researcher', role: 'Research & analysis specialist', jobs: ['research', 'data-analysis'] });
  }
  if (routed.categories.some(c => ['marketing-growth', 'social-media', 'content-creation'].includes(c))) {
    agents.push({ name: 'content', role: 'Content & marketing specialist', jobs: ['content', 'seo', 'social-media'] });
  }
  if (routed.categories.some(c => ['devops', 'security'].includes(c))) {
    agents.push({ name: 'ops', role: 'DevOps & security specialist', jobs: ['deployment', 'monitoring', 'security'] });
  }

  return {
    version: '1.0',
    meta: {
      name: `${answers.userName}'s ${answers.role} Setup`,
      os: answers.os,
      created: today(),
      profile: roleKey,
      description: `Customized OpenClaw for ${answers.role} — ${answers.useCases.join(', ')}`,
    },
    openclaw: { version: 'latest', installMethod: 'npm' },
    identity: {
      role: answers.role,
      soulTemplate: roleKey,
    },
    skills: { fromAifleet, fromClawhub, custom: [] },
    agents,
    config: {
      autonomy: answers.autonomy as Blueprint['config']['autonomy'],
      modelRouting: 'balanced',
      memoryChunks: 72,
    },
    cron: [],
    mcpServers: [
      ...routed.mcpServers,
      ...answers.integrations.map(i => INTEGRATION_MCP[i]).filter(Boolean),
    ].filter((v, i, a) => a.indexOf(v) === i) as string[],
    extensions: [],
    llm: buildLlmConfig(answers),
  };
}

function buildLlmConfig(answers: WizardAnswers): Blueprint['llm'] {
  if (answers.llmMode === 'byok' && answers.llmProvider && answers.llmApiKey) {
    const modelDefaults: Record<string, string> = {
      google: 'gemini-2.5-flash',
      anthropic: 'claude-sonnet-4-6',
      openai: 'gpt-4.1-mini',
    };
    return {
      mode: 'byok',
      provider: answers.llmProvider,
      apiKey: answers.llmApiKey,
      model: modelDefaults[answers.llmProvider] || 'gemini-2.5-flash',
    };
  }
  if (answers.llmMode === 'managed') {
    return {
      mode: 'managed',
      // proxyUrl and proxyToken are filled by the server during /api/analyze
    };
  }
  return { mode: 'skip' };
}

// Re-export for server use
export { SOUL_TEMPLATES };
