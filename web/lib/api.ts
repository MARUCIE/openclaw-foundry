// OCF Server API client

const BASE = '/api';

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Providers
export const getProviders = (params?: string) =>
  fetchJSON<{ total: number; providers: ProviderMeta[] }>(`/providers${params ? `?${params}` : ''}`);

export const getProvider = (id: string) =>
  fetchJSON<{ provider: ProviderMeta; available: boolean; requirements: any[] }>(`/providers/${id}`);

// Stats
export const getStats = () => fetchJSON<DashboardStats>('/stats');

// Deploy
export const startDeploy = (provider: string, blueprint: any) =>
  fetchJSON<{ jobId: string; status: string }>('/deploy', {
    method: 'POST',
    body: JSON.stringify({ provider, blueprint }),
  });

export const getDeployJob = (jobId: string) => fetchJSON<DeployJob>(`/deploy/${jobId}`);
export const listDeployJobs = () => fetchJSON<{ jobs: DeployJob[] }>('/deploy');

// Arena
export const startArena = (providers: string[], blueprint: any, testPrompt: string) =>
  fetchJSON<{ matchId: string; status: string }>('/arena', {
    method: 'POST',
    body: JSON.stringify({ providers, blueprint, testPrompt }),
  });

export const getArenaMatch = (matchId: string) => fetchJSON<ArenaMatch>(`/arena/${matchId}`);

// Types (mirrors server types for frontend use)
export interface ProviderMeta {
  id: string;
  name: string;
  vendor: string;
  type: 'cloud' | 'desktop' | 'mobile' | 'saas' | 'remote';
  platforms: string[];
  status: 'stable' | 'beta' | 'preview' | 'planned';
  consoleUrl: string;
  docUrl: string;
  imChannels: string[];
  description: string;
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
