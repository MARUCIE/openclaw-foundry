// LobsterAI — 网易有道开源桌面 Agent

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { DesktopProvider } from './base.js';

export class LobsterAIProvider extends DesktopProvider {
  meta: ProviderMeta = {
    id: 'lobsterai',
    name: 'LobsterAI',
    vendor: '网易有道 (NetEase Youdao)',
    type: 'desktop',
    platforms: ['darwin', 'win32', 'linux'],
    status: 'beta',
    consoleUrl: 'https://lobsterai.youdao.com',
    docUrl: 'https://github.com/netease-youdao/lobsterai',
    imChannels: [],
    description: '网易有道 LobsterAI — 国内首个 100% 全开源桌面 AI Agent。跨应用自动化 + 定时任务 + 长上下文记忆。首月访问量 27 万次。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const notReady = this.checkApiReady();
    if (notReady) return notReady;

    const steps = [];

    // 1. Check if LobsterAI is installed
    const installCheck = await this.checkLocalInstall('lobsterai');
    if (installCheck.status === 'error') {
      this.logProvider('deploy', 'Installing LobsterAI via npm');
      try {
        const { execa } = await import('execa');
        await execa('npm', ['install', '-g', 'lobsterai'], { timeout: 120_000 });
        steps.push(this.step('Install', 'ok', 'LobsterAI installed'));
      } catch (err: unknown) {
        steps.push(this.step('Install', 'error', (err as Error).message));
        return { success: false, steps };
      }
    } else {
      steps.push(installCheck);
    }

    // 2. Generate LobsterAI config from blueprint
    this.logProvider('deploy', 'Generating LobsterAI config');
    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const home = process.env.HOME || process.env.USERPROFILE || '~';
      const configDir = join(home, '.lobsterai');
      await mkdir(configDir, { recursive: true });

      const config = {
        identity: blueprint.identity,
        skills: [...blueprint.skills.fromAifleet, ...blueprint.skills.fromClawhub],
        agents: blueprint.agents,
        autonomy: blueprint.config.autonomy,
        modelRouting: blueprint.config.modelRouting,
        _foundry: { blueprint: blueprint.meta.name, provider: 'lobsterai' },
      };
      await writeFile(join(configDir, 'config.json'), JSON.stringify(config, null, 2));
      steps.push(this.step('Config', 'ok', 'LobsterAI config written'));
    } catch (err: unknown) {
      steps.push(this.step('Config', 'error', (err as Error).message));
      return { success: false, steps };
    }

    return { success: true, steps };
  }

  async test(): Promise<TestResult> {
    const check = await this.checkLocalInstall('lobsterai');
    return { success: check.status === 'ok', checks: [check] };
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const result = await this.deploy(blueprint);
    return { success: result.success, steps: result.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    try {
      const { execa } = await import('execa');
      await execa('npm', ['uninstall', '-g', 'lobsterai'], { timeout: 30_000 });
      return { success: true, steps: [this.step('Uninstall', 'ok', 'LobsterAI removed')] };
    } catch {
      return { success: true, steps: [this.step('Uninstall', 'warn', 'Manual removal needed')] };
    }
  }

  async diagnose(): Promise<DiagnoseResult> {
    const check = await this.checkLocalInstall('lobsterai');
    return {
      healthy: check.status === 'ok',
      checks: [check],
      suggestions: check.status !== 'ok' ? ['Install: npm install -g lobsterai'] : [],
    };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'Node.js >= 18', check: 'node --version', installHint: 'https://nodejs.org', required: true },
    ];
  }
}
