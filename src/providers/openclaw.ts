// Default provider: Anthropic OpenClaw (local installation)
// This wraps the existing executor logic as a Provider

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { DesktopProvider } from './base.js';
import {
  executeBlueprint as legacyExecute,
  repairFoundry as legacyRepair,
  uninstallFoundry as legacyUninstall,
} from '../executor.js';
import { runDoctor } from '../doctor.js';

export class OpenClawProvider extends DesktopProvider {
  meta: ProviderMeta = {
    id: 'openclaw',
    name: 'OpenClaw',
    vendor: 'Anthropic',
    type: 'desktop',
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://console.anthropic.com',
    docUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview',
    imChannels: ['telegram', 'discord', 'slack'],
    description: 'Anthropic OpenClaw — the original local AI agent platform. Install via npm, configure locally.',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const result = await legacyExecute(blueprint);
    return {
      success: result.success,
      steps: result.steps,
    };
  }

  async test(blueprint: Blueprint): Promise<TestResult> {
    const checks = await runDoctor();
    return {
      success: checks.every(c => c.status !== 'error'),
      checks,
    };
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    return legacyRepair({ component: 'all' });
  }

  async uninstall(options: { keepConfig?: boolean; keepMemory?: boolean; dryRun?: boolean }): Promise<ExecutionResult> {
    return legacyUninstall(options);
  }

  async diagnose(): Promise<DiagnoseResult> {
    const checks = await runDoctor();
    const healthy = checks.every(c => c.status !== 'error');
    const suggestions: string[] = [];
    for (const c of checks) {
      if (c.status === 'error') suggestions.push(`Fix ${c.name}: ${c.message}`);
      if (c.status === 'warn') suggestions.push(`Check ${c.name}: ${c.message}`);
    }
    return { healthy, checks, suggestions };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'Node.js >= 18', check: 'node --version', installHint: 'Install from https://nodejs.org', required: true },
      { name: 'npm', check: 'npm --version', installHint: 'Comes with Node.js', required: true },
    ];
  }
}
