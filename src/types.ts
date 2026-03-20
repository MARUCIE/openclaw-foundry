import { z } from 'zod';

// --- Target: where and how to deploy (v2.0 multi-platform) ---

export const DEPLOY_MODES = ['local', 'cloud', 'saas', 'mobile', 'remote'] as const;
export type DeployMode = typeof DEPLOY_MODES[number];

export const PROVIDER_IDS = [
  'openclaw',       // Anthropic OpenClaw (default, local)
  'arkclaw',        // 火山引擎 ArkClaw + 飞书
  'workbuddy',      // 腾讯 WorkBuddy + QClaw + 企微/QQ
  'jdcloud',        // 京东云 Lighthouse OpenClaw
  'huaweicloud',    // 华为云 OpenClaw
  'aliyun',         // 阿里云 JVS Claw + AgentBay
  'duclaw',         // 百度智能云 DuClaw
  'lobsterai',      // 网易有道 LobsterAI (开源桌面)
  'autoclaw',       // 智谱 AutoClaw (AutoGLM)
  'miclaw',         // 小米 miclaw (手机系统层)
  'kimiclaw',       // 月之暗面 Kimi Claw (SaaS 托管)
  'maxclaw',        // MiniMax MaxClaw (SaaS 托管+移动)
  'lenovo',         // 联想百应远程部署
] as const;
export type ProviderId = typeof PROVIDER_IDS[number];

export const IM_CHANNELS = ['feishu', 'wecom', 'qq', 'dingtalk', 'telegram', 'discord', 'slack'] as const;
export type ImChannel = typeof IM_CHANNELS[number];

export const TargetSchema = z.object({
  provider: z.enum(PROVIDER_IDS).default('openclaw'),
  deployMode: z.enum(DEPLOY_MODES).default('local'),
  region: z.string().optional(),
  instanceType: z.string().optional(),
  credentials: z.object({
    accessKeyId: z.string().optional(),
    accessKeySecret: z.string().optional(),
    token: z.string().optional(),
    endpoint: z.string().optional(),
  }).optional(),
  imChannel: z.enum(IM_CHANNELS).optional(),
  extras: z.record(z.string()).optional(),
});

export type Target = z.infer<typeof TargetSchema>;

// --- Blueprint: the core data contract between client and server ---

export const BlueprintSchema = z.object({
  version: z.string().default('2.0'),
  meta: z.object({
    name: z.string(),
    os: z.enum(['darwin', 'win32', 'linux', 'android', 'harmonyos']).default('darwin'),
    created: z.string(),
    profile: z.string().optional(),
    description: z.string().optional(),
  }),
  target: TargetSchema.default({ provider: 'openclaw', deployMode: 'local' }),
  openclaw: z.object({
    version: z.string().default('latest'),
    installMethod: z.enum(['npm', 'pnpm', 'manual', 'docker', 'cloud']).default('npm'),
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

// --- Provider: multi-platform deployment abstraction (v2.0) ---

export type ProviderType = 'cloud' | 'desktop' | 'mobile' | 'saas' | 'remote';
export type ProviderStatus = 'stable' | 'beta' | 'preview' | 'planned';

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  vendor: string;
  type: ProviderType;
  platforms: ('darwin' | 'win32' | 'linux' | 'android' | 'harmonyos')[];
  status: ProviderStatus;
  consoleUrl: string;
  docUrl: string;
  imChannels: ImChannel[];
  description: string;
}

export interface Requirement {
  name: string;
  check: string;         // shell command to verify
  installHint: string;   // how to fix if missing
  required: boolean;
}

export interface DeployResult {
  success: boolean;
  steps: StepResult[];
  instanceUrl?: string;       // cloud/saas: URL to access the deployed instance
  credentials?: {
    username?: string;
    token?: string;
    endpoint?: string;
  };
}

export interface TestResult {
  success: boolean;
  checks: StepResult[];
  healthUrl?: string;
}

export interface DiagnoseResult {
  healthy: boolean;
  checks: StepResult[];
  suggestions: string[];
}

export interface Provider {
  meta: ProviderMeta;

  // Lifecycle
  deploy(blueprint: Blueprint): Promise<DeployResult>;
  test(blueprint: Blueprint): Promise<TestResult>;
  repair(blueprint: Blueprint): Promise<ExecutionResult>;
  uninstall(options: { keepConfig?: boolean; keepMemory?: boolean; dryRun?: boolean }): Promise<ExecutionResult>;
  diagnose(): Promise<DiagnoseResult>;

  // Info
  getRequirements(): Requirement[];
  isAvailable(): Promise<boolean>;
}

// --- WizardAnswers v2: adds target selection ---

export interface WizardAnswersV2 extends WizardAnswers {
  targetProvider: ProviderId;
  targetDeployMode: DeployMode;
  targetRegion?: string;
  targetImChannel?: ImChannel;
  cloudAccessKeyId?: string;
  cloudAccessKeySecret?: string;
}
