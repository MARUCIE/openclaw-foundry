// Deploy Manager — async deploy job lifecycle (create/poll/cancel)

import type { Blueprint, ProviderId, DeployResult, StepResult } from './types.js';
import { getProvider } from './providers/index.js';

export interface DeployJob {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  provider: ProviderId;
  blueprint: Blueprint;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: DeployResult;
  logs: StepResult[];
}

const jobs = new Map<string, DeployJob>();
const JOB_TTL_MS = 3600_000; // 1 hour

function generateId(): string {
  return `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Create and start an async deploy job */
export function createDeployJob(provider: ProviderId, blueprint: Blueprint): DeployJob {
  const job: DeployJob = {
    id: generateId(),
    status: 'pending',
    provider,
    blueprint,
    createdAt: new Date().toISOString(),
    logs: [],
  };

  jobs.set(job.id, job);

  // Fire and forget — run deploy in background
  runDeploy(job).catch(() => {});

  // Schedule cleanup
  setTimeout(() => jobs.delete(job.id), JOB_TTL_MS);

  return job;
}

/** Get deploy job by ID */
export function getDeployJob(id: string): DeployJob | undefined {
  return jobs.get(id);
}

/** List recent deploy jobs (newest first, max 20) */
export function listDeployJobs(): DeployJob[] {
  return [...jobs.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);
}

/** Cancel a running deploy job */
export function cancelDeployJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job || job.status !== 'running') return false;
  job.status = 'cancelled';
  job.completedAt = new Date().toISOString();
  job.logs.push({ name: 'Cancel', status: 'warn', message: 'Deploy cancelled by user' });
  return true;
}

const DEPLOY_TIMEOUT_MS = 120_000; // 120s max per deploy (IM auto-provision needs time)

async function runDeploy(job: DeployJob): Promise<void> {
  job.status = 'running';
  job.startedAt = new Date().toISOString();
  job.logs.push({ name: 'Start', status: 'ok', message: `Deploying to ${job.provider}` });

  try {
    const provider = getProvider(job.provider);

    // Race between deploy and timeout
    const deployPromise = provider.deploy(job.blueprint);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Deploy timeout after ${DEPLOY_TIMEOUT_MS / 1000}s`)), DEPLOY_TIMEOUT_MS)
    );
    const result = await Promise.race([deployPromise, timeoutPromise]);

    if ((job.status as string) === 'cancelled') return;

    job.result = result;
    job.logs.push(...result.steps);
    job.status = result.success ? 'success' : 'failed';
  } catch (err: any) {
    job.status = 'failed';
    job.logs.push({ name: 'Error', status: 'error', message: err.message || 'Unknown error' });
  } finally {
    if (!job.completedAt) {
      job.completedAt = new Date().toISOString();
    }
  }
}
