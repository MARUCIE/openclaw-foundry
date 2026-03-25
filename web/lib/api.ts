// OCF Server API client — with static fallback for CF Pages

// API base URL: set via env var or fallback to static JSON files only
const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Static file mapping: /api/X?params → /data/X.json (ignoring params, client-side filtering)
const STATIC_MAP: Record<string, string> = {
  '/providers': '/data/providers.json',
  '/stats': '/data/stats.json',
  '/skills': '/data/skills.json',
  '/skills/categories': '/data/skills-categories.json',
  '/collections': '/data/collections.json',
};

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (res.ok) return res.json();
    throw new Error(`HTTP ${res.status}`);
  } catch {
    // Fallback: try static JSON (for CF Pages / static export)
    const basePath = path.split('?')[0];
    const staticPath = STATIC_MAP[basePath];
    if (staticPath) {
      const fallback = await fetch(staticPath);
      if (fallback.ok) return fallback.json();
    }
    return {} as T;
  }
}

// Providers (with tier normalization: backend 1/2/3 → frontend full-auto/semi-auto/guided)
export async function getProviders(params?: string): Promise<{ total: number; providers: ProviderMeta[] }> {
  const raw = await fetchJSON<{ total: number; providers: RawProviderMeta[] }>(`/providers${params ? `?${params}` : ''}`);
  return { total: raw.total, providers: raw.providers.map(normalizeProvider) };
}

export async function getProvider(id: string): Promise<{ provider: ProviderMeta; available: boolean; requirements: { name: string; met: boolean }[] }> {
  const raw = await fetchJSON<{ provider: RawProviderMeta; available: boolean; requirements: { name: string; met: boolean }[] }>(`/providers/${id}`);
  return { ...raw, provider: normalizeProvider(raw.provider) };
}

// Stats
export const getStats = () => fetchJSON<DashboardStats>('/stats');

// Deploy
export const startDeploy = (provider: string, blueprint: Record<string, unknown>) =>
  fetchJSON<{ jobId: string; status: string }>('/deploy', {
    method: 'POST',
    body: JSON.stringify({ provider, blueprint }),
  });

export const getDeployJob = (jobId: string) => fetchJSON<DeployJob>(`/deploy/${jobId}`);
export const listDeployJobs = () => fetchJSON<{ jobs: DeployJob[] }>('/deploy');

// ClawHub Skills (curated)
export interface ClawHubSkill {
  id: string;
  name: string;
  slug: string;
  author: string;
  description: string;
  category: string;
  icon: string;
  downloads: number;
  downloadsDisplay: string;
  stars: number;
  starsDisplay: string;
  versions: number;
  platforms: string[];
  official: boolean;
  score: number;
  rating: 'S' | 'A' | 'B' | 'C' | 'D';
  url: string;
  source?: 'clawhub' | 'mcp-registry';
  sourceUrl?: string;
  repositoryUrl?: string;
  remoteUrl?: string;
  // v3 curation fields
  editorialTagline?: string;
  trendingScore?: number;
  compositeScore?: number;
  reviewUp?: number;
  reviewDown?: number;
  stalePenalty?: number;
}

export interface SkillsResponse {
  meta: {
    source: string;
    syncedAt: string;
    totalRaw: number;
    totalProcessed: number;
    byCategory: Record<string, number>;
    byRating: Record<string, number>;
  };
  total: number;
  offset: number;
  limit: number;
  skills: ClawHubSkill[];
}

export const getSkills = (params?: string) =>
  fetchJSON<SkillsResponse>(`/skills${params ? `?${params}` : ''}`);

export const getSkillCategories = () =>
  fetchJSON<{ categories: Record<string, number> }>('/skills/categories');

// Deploy feedback (R1 flywheel)
export const submitFeedback = (skillId: string, outcome: 'success' | 'fail' | 'not_tried', providerId?: string) =>
  fetchJSON<{ ok: boolean }>('/feedback', {
    method: 'POST',
    body: JSON.stringify({ skill_id: skillId, outcome, provider_id: providerId || '' }),
  });

// Skill events (v3)
export const submitEvent = (
  skillId: string,
  eventType: 'deploy_ok' | 'deploy_fail' | 'review_up' | 'review_down' | 'install' | 'view',
  payload?: Record<string, unknown>,
  tenantId?: string,
) =>
  fetchJSON<{ ok: boolean; weight: number }>('/events', {
    method: 'POST',
    body: JSON.stringify({ skill_id: skillId, event_type: eventType, payload, tenant_id: tenantId }),
  });

export const getEventStats = (skillId: string) =>
  fetchJSON<{ skillId: string; stats: Record<string, { count: number; weighted: number }> }>(`/events/stats?skill_id=${encodeURIComponent(skillId)}`);

export const getRecommendations = (skillId: string, limit = 5) =>
  fetchJSON<{ skillId: string; recommendations: { partner_id: string; co_count: number }[] }>(
    `/events/recommendations?skill_id=${encodeURIComponent(skillId)}&limit=${limit}`
  );

// Collections (v3)
export interface Collection {
  id: string;
  name: string;
  tagline: string;
  description: string;
  skillIds: string[];
  curator: string;
  coverType: string;
  featured: boolean;
  installCount: number;
  createdAt: string;
}

export const getCollections = (featured?: boolean) =>
  fetchJSON<{ total: number; collections: Collection[] }>(`/collections${featured ? '?featured=true' : ''}`);

export const getCollection = (id: string) =>
  fetchJSON<{ collection: Collection; skills: ClawHubSkill[] }>(`/collections/${id}`);

export const installCollection = (id: string) =>
  fetchJSON<{ ok: boolean }>(`/collections/${id}/install`, { method: 'POST' });

// Arena
export const startArena = (providers: string[], blueprint: Record<string, unknown>, testPrompt: string) =>
  fetchJSON<{ matchId: string; status: string }>('/arena', {
    method: 'POST',
    body: JSON.stringify({ providers, blueprint, testPrompt }),
  });

export const getArenaMatch = (matchId: string) => fetchJSON<ArenaMatch>(`/arena/${matchId}`);

// Types (mirrors server types for frontend use)
export type ProviderTier = 'full-auto' | 'semi-auto' | 'guided';

// Backend returns tier as number (1/2/3), frontend uses semantic strings
const TIER_MAP: Record<number, ProviderTier> = {
  1: 'full-auto',
  2: 'semi-auto',
  3: 'guided',
};

/** Normalize backend provider data to frontend types */
function normalizeProvider(raw: RawProviderMeta): ProviderMeta {
  return {
    ...raw,
    tier: TIER_MAP[raw.tier as unknown as number] || 'guided',
  };
}

// Raw type from backend (tier is number)
interface RawProviderMeta extends Omit<ProviderMeta, 'tier'> {
  tier: number;
}

export interface ProviderMeta {
  id: string;
  name: string;
  vendor: string;
  type: 'cloud' | 'desktop' | 'mobile' | 'saas' | 'remote';
  tier: ProviderTier;
  platforms: string[];
  status: 'stable' | 'beta' | 'preview' | 'planned';
  consoleUrl: string;
  docUrl: string;
  imChannels: string[];
  description: string;
  installCmd?: string;
  github?: string;
  price?: string;
}

export interface DeployJob {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  provider: string;
  createdAt: string;
  completedAt?: string;
  logs: { name: string; status: string; message: string }[];
}

export interface ArenaLane {
  provider: string;
  status: string;
  timing: { deployMs?: number; testMs?: number; totalMs?: number };
  score?: number;
  logs: { name: string; status: string; message: string }[];
}

export interface ArenaMatch {
  id: string;
  status: string;
  lanes: ArenaLane[];
  winner?: string;
  scoring?: {
    overall: Record<string, number>;
    dimensions: Record<string, Record<string, number>>;
  };
  createdAt: string;
  completedAt?: string;
}

export interface DashboardStats {
  providers: { total: number; byType: Record<string, number> };
  deploys: { recent: number; jobs: DeployJob[] };
  arena: { recent: number; matches: ArenaMatch[] };
  uptime: number;
}
