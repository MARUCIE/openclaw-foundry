import { z } from 'zod';

// --- Blueprint: the core data contract between client and server ---

export const BlueprintSchema = z.object({
  version: z.string().default('1.0'),
  meta: z.object({
    name: z.string(),
    os: z.enum(['darwin', 'win32', 'linux']),
    created: z.string(),
    profile: z.string().optional(),
    description: z.string().optional(),
  }),
  openclaw: z.object({
    version: z.string().default('latest'),
    installMethod: z.enum(['npm', 'pnpm', 'manual']).default('npm'),
  }),
  identity: z.object({
    role: z.string(),
    soulTemplate: z.string().optional(),
    customSoul: z.string().optional(),
  }),
  skills: z.object({
    fromAifleet: z.array(z.string()).default([]),
    fromClawhub: z.array(z.string()).default([]),
    custom: z.array(z.string()).default([]),
  }),
  agents: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    jobs: z.array(z.string()).default([]),
  })).default([]),
  config: z.object({
    autonomy: z.enum(['L1-guided', 'L2-semi', 'L3-full']).default('L1-guided'),
    modelRouting: z.enum(['premium', 'balanced', 'fast']).default('balanced'),
    memoryChunks: z.number().default(72),
  }),
  cron: z.array(z.object({
    schedule: z.string(),
    job: z.string(),
    description: z.string().optional(),
  })).default([]),
  mcpServers: z.array(z.string()).default([]),
  extensions: z.array(z.string()).default([]),
  llm: z.object({
    mode: z.enum(['byok', 'managed', 'skip']).default('skip'),
    provider: z.string().optional(),   // google | anthropic | openai
    apiKey: z.string().optional(),      // BYOK: user's own key
    proxyUrl: z.string().optional(),    // Managed: proxy endpoint
    proxyToken: z.string().optional(),  // Managed: customer token
    model: z.string().optional(),       // Default model
  }).default({ mode: 'skip' }),
});

export type Blueprint = z.infer<typeof BlueprintSchema>;

// --- Wizard answers: collected from user (client-side or local CLI) ---

export interface WizardAnswers {
  userName: string;
  os: 'darwin' | 'win32' | 'linux';
  role: string;
  industry: string;         // fintech, ecommerce, gaming, saas, education, healthcare, media, general
  level: string;            // junior, mid, senior, lead, executive
  teamSize: string;         // solo, small (2-10), medium (10-50), large (50+)
  useCases: string[];
  deliverables: string[];   // pdf, ppt, word, excel, image, video, poster, diagram, prototype, report, code, article
  languages: string[];
  autonomy: string;
  integrations: string[];
  llmMode: 'byok' | 'managed' | 'skip';
  llmProvider?: string;
  llmApiKey?: string;
}

// --- Customer: managed LLM proxy subscriber ---

export interface Customer {
  id: string;
  name: string;
  token: string;
  tier: 'basic' | 'pro' | 'enterprise';
  created: string;
  active: boolean;
  usage: Record<string, DailyUsage>; // keyed by YYYY-MM-DD
}

export interface DailyUsage {
  requests: number;
  inputTokens: number;
  outputTokens: number;
}

export const TIER_LIMITS: Record<string, { dailyRequests: number; models: string[] }> = {
  basic:      { dailyRequests: 100,  models: ['gemini-2.5-flash'] },
  pro:        { dailyRequests: 1000, models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'claude-sonnet-4-6'] },
  enterprise: { dailyRequests: -1,   models: ['*'] },
};

// --- Catalog entry: a single skill from any source ---

export interface CatalogEntry {
  id: string;
  name: string;
  description: string;
  source: 'aifleet' | 'clawhub';
  category?: string;
  tags?: string[];
}

// --- Install manifest: records everything Foundry writes for uninstall/repair ---

export interface Manifest {
  version: string;
  created: string;
  updated: string;
  blueprint: {
    name: string;
    profile?: string;
    role: string;
  };
  files: string[];           // all files written (absolute paths)
  directories: string[];     // directories created
  skills: {
    aifleet: string[];       // symlinked skill IDs
    clawhub: string[];       // installed from ClawHub
  };
  agents: string[];          // agent file names
  config: {
    autonomy: string;
    modelRouting: string;
    memoryChunks: number;
  };
}

// --- Snapshot: pre-change state capture for rollback ---

export interface Snapshot {
  id: string;                          // e.g. "snap-20260311-083000"
  created: string;                     // ISO timestamp
  trigger: 'install' | 'upgrade' | 'manual';
  manifest: Manifest | null;           // previous manifest (null if first install)
  configJson: string;                  // full openclaw.json content
  identityMd: string;                  // IDENTITY.md content
  soulMd: string;                      // SOUL.md content
  agents: Record<string, string>;      // filename -> JSON content
}

export const MAX_SNAPSHOTS = 5;

// --- Execution result ---

export interface StepResult {
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  steps: StepResult[];
}
