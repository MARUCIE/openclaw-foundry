// CoPaw — 阿里开源 OpenClaw 个人版 (AgentScope)

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { DesktopProvider } from './base.js';

export class CoPawProvider extends DesktopProvider {
  apiReady = true;

  meta: ProviderMeta = {
    id: 'copaw',
    name: 'CoPaw',
    vendor: '阿里巴巴 (Alibaba)',
    type: 'desktop',
    tier: 1,
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://copaw.bot/',
    docUrl: 'https://github.com/agentscope-ai/CoPaw',
    imChannels: ['dingtalk', 'feishu', 'qq', 'discord'],
    description: '阿里开源 CoPaw — 基于 AgentScope 的个人版 OpenClaw。pip install 即用，支持钉钉/飞书/QQ/Discord 四通道。DashScope 模型直连。',
    installCmd: 'pip install copaw',
    github: 'agentscope-ai/CoPaw',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const notReady = this.checkApiReady();
    if (notReady) return notReady;

    const steps = [];

    // 1. Check Python3 installed
    const pythonCheck = await this.checkLocalInstall('python3');
    if (pythonCheck.status === 'error') {
      steps.push(this.step('Python3', 'error', 'Python 3.10+ not found'));
      return { success: false, steps };
    }
    steps.push(pythonCheck);

    // 2. pip install copaw
    this.logProvider('deploy', 'Installing CoPaw via pip');
    try {
      const { execa } = await import('execa');
      await execa('pip', ['install', 'copaw'], { timeout: 120_000 });
      steps.push(this.step('Install', 'ok', 'CoPaw installed via pip'));
    } catch (err: unknown) {
      steps.push(this.step('Install', 'error', (err as Error).message));
      this.logProvider('deploy', 'pip install failed, falling back to realLocalDeploy');
      return this.realLocalDeploy(blueprint);
    }

    // 3. Configure via env vars
    const token = blueprint.target?.credentials?.token;
    if (token) {
      try {
        const { writeFile, mkdir } = await import('fs/promises');
        const { join } = await import('path');
        const home = process.env.HOME || process.env.USERPROFILE || '~';
        const configDir = join(home, '.copaw');
        await mkdir(configDir, { recursive: true });

        const envContent = `DASHSCOPE_API_KEY=${token}\n`;
        await writeFile(join(configDir, '.env'), envContent);
        steps.push(this.step('Credentials', 'ok', 'DASHSCOPE_API_KEY configured'));
      } catch (err: unknown) {
        steps.push(this.step('Credentials', 'warn', (err as Error).message));
      }
    } else {
      steps.push(this.step('Credentials', 'warn', 'No token provided — set DASHSCOPE_API_KEY manually'));
    }

    // 4. Run copaw init
    try {
      const { execa } = await import('execa');
      await execa('copaw', ['init', '--defaults'], { timeout: 30_000 });
      steps.push(this.step('Init', 'ok', 'CoPaw initialized with defaults'));
    } catch {
      steps.push(this.step('Init', 'warn', 'copaw init skipped — run manually if needed'));
    }

    return { success: steps.every(s => s.status !== 'error'), steps };
  }

  async test(): Promise<TestResult> {
    // Try copaw --version first, fallback to import check
    const versionCheck = await this.checkLocalInstall('copaw');
    if (versionCheck.status === 'ok') {
      return { success: true, checks: [versionCheck] };
    }

    try {
      const { execa } = await import('execa');
      await execa('python3', ['-c', 'import copaw'], { timeout: 10_000 });
      return { success: true, checks: [this.step('Import', 'ok', 'copaw module importable')] };
    } catch {
      return { success: false, checks: [this.step('Import', 'error', 'copaw not installed — run: pip install copaw')] };
    }
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', 'Run: pip uninstall copaw')] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    const pythonCheck = await this.checkLocalInstall('python3');
    const suggestions: string[] = [];
    if (pythonCheck.status === 'error') {
      suggestions.push('Install Python 3.10+: https://python.org');
    }
    return { healthy: pythonCheck.status === 'ok', checks: [pythonCheck], suggestions };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'Python 3.10+', check: 'python3 --version', installHint: 'Install from https://python.org', required: true },
      { name: 'pip', check: 'pip --version', installHint: 'Usually bundled with Python', required: true },
    ];
  }
}
