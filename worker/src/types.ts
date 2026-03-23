// D1 row types — mirrors schema.sql column definitions

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
  platforms: string; // JSON string
  official: number; // 0 or 1
  score: number;
  rating: string;
  url: string;
  source: string;
  source_url: string;
  repository_url: string;
  remote_url: string;
  synced_at: string;
}

export interface ProviderRow {
  id: string;
  name: string;
  vendor: string;
  type: string;
  tier: number;
  platforms: string; // JSON string
  status: string;
  console_url: string;
  doc_url: string;
  im_channels: string; // JSON string
  description: string;
  install_cmd: string;
  github: string;
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
