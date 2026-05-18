'use client';

import useSWR from 'swr';
import {
  getProviders,
  getStats,
  getPacks,
  type ProviderMeta,
  type ProviderTier,
  type ClawHubSkill,
  type PacksResponse,
  type DashboardStats,
  type PackLine,
  type ConfigPack,
  type DeployJob,
} from '@/lib/api';

export interface LandingPageViewModel {
  hasProviders: boolean;
  grouped: Record<ProviderTier, ProviderMeta[]>;
  totalProviders: number;
  totalSkills: number;
  totalPacks: number;
  mcpCount: number;
  topSkills: ClawHubSkill[];
  topCategories: Array<[string, number]>;
  ratingMix: ReadonlyArray<readonly [string, number]>;
  categoryMax: number;
  packs: ConfigPack[];
  topPacks: ConfigPack[];
  packLines: PackLine[];
  recentDeploys: number;
  recentArena: number;
  uptime: number;
  uptimeDisplay: string;
  recentOps: number;
  recentJobs: DeployJob[];
}

export function useLandingPageData(): LandingPageViewModel {
  const { data: providerData } = useSWR('providers', () => getProviders());
  const { data: statsData } = useSWR<DashboardStats>('stats', getStats);
  const { data: packsData } = useSWR<PacksResponse>('packs', getPacks);
  const { data: skillsData } = useSWR('landing-skills', async () => {
    const res = await fetch('/data/skills.json');
    return res.ok ? res.json() : null;
  });

  const providers = providerData?.providers || [];
  const hasProviders = providers.length > 0;
  const grouped: Record<ProviderTier, ProviderMeta[]> = {
    'full-auto': providers.filter(p => p.tier === 'full-auto'),
    'semi-auto': providers.filter(p => p.tier === 'semi-auto'),
    'guided': providers.filter(p => p.tier === 'guided'),
  };

  const totalProviders = providers.length || 12;
  const totalSkills = skillsData?.total || 0;
  const mcpCount = (skillsData?.skills || []).filter((s: ClawHubSkill) => s.source === 'mcp-registry').length;
  const topSkills: ClawHubSkill[] = (skillsData?.skills || [])
    .filter((s: ClawHubSkill) => (s.source || 'clawhub') !== 'mcp-registry' && s.downloads > 0)
    .slice(0, 6);
  const topCategories = (Object.entries(skillsData?.meta?.byCategory || {}) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const ratingMix = ['S', 'A', 'B', 'C', 'D']
    .map(rating => [rating, skillsData?.meta?.byRating?.[rating] || 0] as const)
    .filter(([, count]) => count > 0);
  const categoryMax = topCategories[0]?.[1] || 1;

  const packs = packsData?.packs || [];
  const totalPacks = packsData?.total || packs.length || 10;
  const topPacks = [...packs].sort((a, b) => (b.files?.length || 0) - (a.files?.length || 0)).slice(0, 3);
  const packLines = packsData?.lines || [];

  const recentDeploys = statsData?.deploys?.recent ?? 0;
  const recentArena = statsData?.arena?.recent ?? 0;
  const uptime = statsData?.uptime ?? 0;
  const uptimeDisplay = uptime > 0 ? `${uptime.toFixed(1)}%` : '—';
  const recentOps = recentDeploys + recentArena;
  const recentJobs = statsData?.deploys?.jobs?.slice(0, 3) || [];

  return {
    grouped,
    hasProviders,
    totalProviders,
    totalSkills,
    totalPacks,
    mcpCount,
    topSkills,
    topCategories,
    ratingMix,
    categoryMax,
    packs,
    topPacks,
    packLines,
    recentDeploys,
    recentArena,
    uptime,
    uptimeDisplay,
    recentOps,
    recentJobs,
  };
}
