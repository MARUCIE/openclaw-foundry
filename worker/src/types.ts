// D1 row types — mirrors schema.sql v2

export interface SkillRow {
  id: string;
  name: string;
  slug: string;
  author: string;
  description: string;
  category: string;
  icon: string;
  downloads: number;
  downloads_display: string;
  stars: number;
  stars_display: string;
  versions: number;
  platforms: string;
  official: number;
  score: number;
  rating: string;
  url: string;
  source: string;
  source_url: string;
  repository_url: string;
  remote_url: string;
  // v2 curation fields
  permission_manifest: string;
  deploy_success_rate: number;
  deploy_count: number;
  last_updated: string;
  stale: number;
  synced_at: string;
}

export interface ProviderRow {
  id: string;
  name: string;
  vendor: string;
  type: string;
  tier: number;
  platforms: string;
  status: string;
  console_url: string;
  doc_url: string;
  im_channels: string;
  description: string;
  install_cmd: string;
  github: string;
}

export interface DeployFeedbackRow {
  id: number;
  skill_id: string;
  provider_id: string;
  outcome: string;
  fingerprint: string;
  comment: string;
  created_at: string;
}

export interface TenantRow {
  id: string;
  name: string;
  email: string;
  api_key: string;
  tier: string;
  active: number;
  daily_requests: number;
  daily_reset: string;
  created_at: string;
  last_active_at: string;
}

export interface ArenaResultRow {
  id: string;
  provider_ids: string;
  blueprint_hash: string;
  test_prompt: string;
  scoring: string;
  winner: string;
  status: string;
  created_at: string;
  completed_at: string;
}

export interface CountRow {
  cnt: number;
}

export interface SyncRow {
  latest: string;
}

export function safeJsonArray(json: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function safeJsonObject(json: string | null | undefined): Record<string, unknown> {
  try {
    return JSON.parse(json || '{}');
  } catch {
    return {};
  }
}
