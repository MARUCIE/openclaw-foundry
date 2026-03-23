// Provider Registry — discover, list, and resolve providers by ID

import type { Provider, ProviderId, ProviderMeta } from '../types.js';
// Tier 1: 全自动
import { OpenClawProvider } from './openclaw.js';
import { HiClawProvider } from './hiclaw.js';
import { CoPawProvider } from './copaw.js';
import { AutoClawProvider } from './autoclaw.js';
import { JDCloudProvider, HuaweiCloudProvider, AliyunProvider } from './cloud-generic.js';
// Tier 2: 半自动
import { QClawProvider } from './qclaw.js';
import { ArkClawProvider } from './arkclaw.js';
import { MaxClawProvider } from './saas.js';
// Tier 3: 引导式
import { KimiClawProvider } from './saas.js';
import { DuClawProvider } from './cloud-generic.js';

// Singleton instances — lazy initialized
const providers = new Map<ProviderId, Provider>();

function ensureRegistered(): void {
  if (providers.size > 0) return;

  const all: Provider[] = [
    // Tier 1
    new OpenClawProvider(),
    new HiClawProvider(),
    new CoPawProvider(),
    new AutoClawProvider(),
    new HuaweiCloudProvider(),
    new JDCloudProvider(),
    new AliyunProvider(),
    // Tier 2
    new QClawProvider(),
    new ArkClawProvider(),
    new MaxClawProvider(),
    // Tier 3
    new KimiClawProvider(),
    new DuClawProvider(),
  ];

  for (const p of all) {
    providers.set(p.meta.id, p);
  }
}

/** Get a provider by ID. Returns OpenClaw if not found. */
export function getProvider(id: ProviderId): Provider {
  ensureRegistered();
  return providers.get(id) || providers.get('openclaw')!;
}

/** List all registered providers */
export function listProviders(): ProviderMeta[] {
  ensureRegistered();
  return [...providers.values()].map(p => p.meta);
}

/** List providers filtered by type */
export function listProvidersByType(type: string): ProviderMeta[] {
  return listProviders().filter(p => p.type === type);
}

/** List providers that support a given OS */
export function listProvidersByOS(os: string): ProviderMeta[] {
  return listProviders().filter(p => p.platforms.includes(os as any));
}

/** List providers that support a given IM channel */
export function listProvidersByIM(im: string): ProviderMeta[] {
  return listProviders().filter(p => p.imChannels.includes(im as any));
}

/** Check which providers are currently available (have prerequisites met) */
export async function getAvailableProviders(): Promise<ProviderMeta[]> {
  ensureRegistered();
  const results: ProviderMeta[] = [];
  for (const p of providers.values()) {
    if (await p.isAvailable()) {
      results.push(p.meta);
    }
  }
  return results;
}

/** Get provider count by type for display */
export function getProviderStats(): Record<string, number> {
  const metas = listProviders();
  const stats: Record<string, number> = {};
  for (const m of metas) {
    stats[m.type] = (stats[m.type] || 0) + 1;
  }
  return stats;
}
