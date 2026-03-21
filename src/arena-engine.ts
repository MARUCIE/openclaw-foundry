// Arena Engine — multi-provider parallel execution + scoring

import type { Blueprint, ProviderId, DeployResult, TestResult, StepResult } from './types.js';
import { getProvider } from './providers/index.js';

export interface ArenaLane {
  provider: ProviderId;
  status: 'pending' | 'deploying' | 'testing' | 'done' | 'error';
  deployResult?: DeployResult;
  testResult?: TestResult;
  timing: {
    deployMs?: number;
    testMs?: number;
    totalMs?: number;
  };
  score?: number;
  logs: StepResult[];
}

export interface ArenaScoring {
  dimensions: {
    deploySpeed: Record<string, number>;
    testPassRate: Record<string, number>;
    featureSupport: Record<string, number>;
    platformReach: Record<string, number>;
  };
  overall: Record<string, number>;
  weights: { deploySpeed: number; testPassRate: number; featureSupport: number; platformReach: number };
}

export interface ArenaMatch {
  id: string;
  status: 'setup' | 'running' | 'completed' | 'failed';
  task: {
    blueprint: Blueprint;
    testPrompt: string;
  };
  lanes: ArenaLane[];
  createdAt: string;
  completedAt?: string;
  winner?: ProviderId;
  scoring?: ArenaScoring;
}

const matches = new Map<string, ArenaMatch>();
const MATCH_TTL_MS = 3600_000;
const LANE_TIMEOUT_MS = 60_000;
const MAX_CONCURRENT = 3;

let activeCount = 0;

function generateId(): string {
  return `arena-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Create and start an arena match */
export function createArenaMatch(
  providers: ProviderId[],
  blueprint: Blueprint,
  testPrompt: string,
): ArenaMatch | { error: string } {
  if (providers.length < 2 || providers.length > 5) {
    return { error: 'Arena requires 2-5 providers' };
  }
  if (activeCount >= MAX_CONCURRENT) {
    return { error: 'Too many concurrent arena matches (max 3)' };
  }

  const match: ArenaMatch = {
    id: generateId(),
    status: 'setup',
    task: { blueprint, testPrompt },
    lanes: providers.map(p => ({
      provider: p,
      status: 'pending',
      timing: {},
      logs: [],
    })),
    createdAt: new Date().toISOString(),
  };

  matches.set(match.id, match);
  activeCount++;

  // Fire and forget
  runArena(match).catch(() => {}).finally(() => { activeCount--; });

  setTimeout(() => matches.delete(match.id), MATCH_TTL_MS);

  return match;
}

/** Get arena match by ID */
export function getArenaMatch(id: string): ArenaMatch | undefined {
  return matches.get(id);
}

/** List recent matches */
export function listArenaMatches(): ArenaMatch[] {
  return [...matches.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);
}

async function runArena(match: ArenaMatch): Promise<void> {
  match.status = 'running';

  // Run all lanes in parallel with per-lane timeout
  await Promise.allSettled(
    match.lanes.map(lane => runLane(lane, match.task.blueprint))
  );

  // Compute scoring
  match.scoring = computeScoring(match.lanes);

  // Determine winner
  const overall = match.scoring.overall;
  let maxScore = -1;
  let winner: ProviderId | undefined;
  for (const [pid, score] of Object.entries(overall)) {
    if (score > maxScore) {
      maxScore = score;
      winner = pid as ProviderId;
    }
  }
  match.winner = winner;

  match.status = match.lanes.every(l => l.status === 'done') ? 'completed' : 'failed';
  match.completedAt = new Date().toISOString();
}

async function runLane(lane: ArenaLane, blueprint: Blueprint): Promise<void> {
  const provider = getProvider(lane.provider);

  // Deploy phase
  lane.status = 'deploying';
  const deployStart = Date.now();
  try {
    const deployPromise = provider.deploy(blueprint);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Deploy timeout')), LANE_TIMEOUT_MS)
    );
    lane.deployResult = await Promise.race([deployPromise, timeoutPromise]);
    lane.timing.deployMs = Date.now() - deployStart;
    lane.logs.push(...(lane.deployResult?.steps || []));
  } catch (err: any) {
    lane.status = 'error';
    lane.timing.deployMs = Date.now() - deployStart;
    lane.logs.push({ name: 'Deploy', status: 'error', message: err.message });
    lane.timing.totalMs = lane.timing.deployMs;
    return;
  }

  // Test phase
  lane.status = 'testing';
  const testStart = Date.now();
  try {
    const testPromise = provider.test(blueprint);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Test timeout')), LANE_TIMEOUT_MS)
    );
    lane.testResult = await Promise.race([testPromise, timeoutPromise]);
    lane.timing.testMs = Date.now() - testStart;
    lane.logs.push(...(lane.testResult?.checks || []));
  } catch (err: any) {
    lane.status = 'error';
    lane.timing.testMs = Date.now() - testStart;
    lane.logs.push({ name: 'Test', status: 'error', message: err.message });
  }

  lane.timing.totalMs = (lane.timing.deployMs || 0) + (lane.timing.testMs || 0);
  if (lane.status !== 'error') lane.status = 'done';
}

function computeScoring(lanes: ArenaLane[]): ArenaScoring {
  const weights = { deploySpeed: 0.2, testPassRate: 0.4, featureSupport: 0.25, platformReach: 0.15 };
  const dims: ArenaScoring['dimensions'] = {
    deploySpeed: {},
    testPassRate: {},
    featureSupport: {},
    platformReach: {},
  };

  // Deploy speed: fastest gets 100, slowest gets proportional
  const deployTimes = lanes.map(l => l.timing.deployMs || 999999);
  const minDeploy = Math.min(...deployTimes);
  for (let i = 0; i < lanes.length; i++) {
    const ratio = deployTimes[i] > 0 ? minDeploy / deployTimes[i] : 0;
    dims.deploySpeed[lanes[i].provider] = Math.round(ratio * 100);
  }

  // Test pass rate: % of checks that passed
  for (const lane of lanes) {
    const checks = lane.testResult?.checks || [];
    const passed = checks.filter(c => c.status === 'ok').length;
    const total = checks.length || 1;
    dims.testPassRate[lane.provider] = Math.round((passed / total) * 100);
  }

  // Feature support: deploy success = 100, partial = 50, fail = 0
  for (const lane of lanes) {
    if (lane.deployResult?.success) dims.featureSupport[lane.provider] = 100;
    else if (lane.status === 'done') dims.featureSupport[lane.provider] = 50;
    else dims.featureSupport[lane.provider] = 0;
  }

  // Platform reach: based on provider meta (OS count + IM count)
  for (const lane of lanes) {
    const provider = getProvider(lane.provider);
    const osCount = provider.meta.platforms.length;
    const imCount = provider.meta.imChannels.length;
    dims.platformReach[lane.provider] = Math.min(100, (osCount + imCount) * 15);
  }

  // Weighted overall
  const overall: Record<string, number> = {};
  for (const lane of lanes) {
    const pid = lane.provider;
    overall[pid] = Math.round(
      (dims.deploySpeed[pid] || 0) * weights.deploySpeed +
      (dims.testPassRate[pid] || 0) * weights.testPassRate +
      (dims.featureSupport[pid] || 0) * weights.featureSupport +
      (dims.platformReach[pid] || 0) * weights.platformReach
    );
    lane.score = overall[pid];
  }

  return { dimensions: dims, overall, weights };
}
