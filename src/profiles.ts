import { readFile, writeFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Blueprint } from './types.js';
import { BlueprintSchema } from './types.js';
import { log } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = join(__dirname, '..', 'profiles');

export interface ProfileMeta {
  id: string;
  name: string;
  description: string;
}

export async function listProfiles(): Promise<ProfileMeta[]> {
  try {
    const files = await readdir(PROFILES_DIR);
    const profiles: ProfileMeta[] = [];

    for (const f of files.filter(f => f.endsWith('.json'))) {
      try {
        const raw = await readFile(join(PROFILES_DIR, f), 'utf-8');
        const data = JSON.parse(raw);
        profiles.push({
          id: f.replace('.json', ''),
          name: data.meta?.name || f,
          description: data.meta?.description || '',
        });
      } catch { /* skip invalid files */ }
    }
    return profiles;
  } catch {
    return [];
  }
}

export async function loadProfile(profileId: string): Promise<Blueprint | null> {
  try {
    const raw = await readFile(join(PROFILES_DIR, `${profileId}.json`), 'utf-8');
    return BlueprintSchema.parse(JSON.parse(raw));
  } catch {
    log.error(`Profile '${profileId}' not found`);
    return null;
  }
}

export async function saveAsProfile(blueprint: Blueprint, profileId: string): Promise<void> {
  await writeFile(join(PROFILES_DIR, `${profileId}.json`), JSON.stringify(blueprint, null, 2));
  log.ok(`Profile saved as '${profileId}'`);
}
