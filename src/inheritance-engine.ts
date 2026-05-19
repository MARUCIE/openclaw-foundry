import { readFile } from 'fs/promises';
import { join } from 'path';

export interface JobPackLayer {
  id: string;
  type: 'universal' | 'line' | 'role' | 'variant';
  name: string;
  nameZh: string;
  sortOrder: number;
  content: {
    claudeMd?: string;
    agentsMd?: string;
    settingsJson?: Record<string, any>;
    promptsMd?: string;
  };
}

export interface JobPack {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  color: string;
  line: string;
  lineZh: string;
  layerIds: string[];
  version: string;
}

export interface MergedPack {
  claudeMd: string;
  agentsMd: string;
  settings: Record<string, any>;
  promptsMd: string;
}

/**
 * Deep merge two objects. Later objects override earlier ones.
 */
export function deepMerge(target: any, source: any): any {
  if (!source) return target;
  if (typeof source !== 'object' || Array.isArray(source)) return source;

  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Merge multiple layers into a single functional pack.
 * L0 (Universal) -> L1 (Line) -> L2 (Role)
 */
export function mergeLayers(layers: JobPackLayer[]): MergedPack {
  // Sort by sortOrder to ensure correct inheritance
  const sorted = [...layers].sort((a, b) => a.sortOrder - b.sortOrder);

  const claudeMd = sorted
    .map(l => l.content.claudeMd)
    .filter(Boolean)
    .join('\n\n---\n\n');

  const agentsMd = sorted
    .map(l => l.content.agentsMd)
    .filter(Boolean)
    .join('\n\n---\n\n');

  const settings = sorted.reduce((acc, l) => {
    return deepMerge(acc, l.content.settingsJson || {});
  }, {});

  // For prompts, usually only the last layer (role) is used, but we can concatenate
  const promptsMd = sorted
    .map(l => l.content.promptsMd)
    .filter(Boolean)
    .join('\n\n---\n\n');

  return { claudeMd, agentsMd, settings, promptsMd };
}

/**
 * Load a pack and all its layers from the filesystem
 */
export async function loadPackFromData(packId: string, dataDir: string): Promise<{ pack: JobPack; merged: MergedPack }> {
  const packPath = join(dataDir, 'packs', `${packId}.json`);
  const packRaw = await readFile(packPath, 'utf-8');
  const pack = JSON.parse(packRaw) as JobPack;

  const layers: JobPackLayer[] = [];
  for (const layerId of pack.layerIds) {
    const layerPath = join(dataDir, 'layers', `${layerId}.json`);
    const layerRaw = await readFile(layerPath, 'utf-8');
    layers.push(JSON.parse(layerRaw) as JobPackLayer);
  }

  return { pack, merged: mergeLayers(layers) };
}
