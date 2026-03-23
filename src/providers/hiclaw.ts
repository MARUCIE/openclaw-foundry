// HiClaw — 阿里开源 OpenClaw 团队版 (Higress + Matrix IM)

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { DesktopProvider } from './base.js';

export class HiClawProvider extends DesktopProvider {
  apiReady = true;

  meta: ProviderMeta = {
    id: 'hiclaw',
    name: 'HiClaw',
    vendor: '阿里巴巴 (Alibaba)',
    type: 'desktop',
    tier: 1,
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://www.hiclaw.io/',
    docUrl: 'https://higress.ai/en/docs/hiclaw/',
    imChannels: ['dingtalk', 'feishu', 'discord', 'telegram'],
    description: '阿里开源 HiClaw — 基于 Higress 网关的团队版 OpenClaw。Docker 一键部署，内置 Matrix IM + MinIO 存储。支持钉钉/飞书/Discord/Telegram 四通道。',
    installCmd: 'curl -sSL https://higress.ai/hiclaw/install.sh | bash',
    github: 'alibaba/hiclaw',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const notReady = this.checkApiReady();
    if (notReady) return notReady;

    const steps = [];

    // 1. Check Docker is installed
    const dockerCheck = await this.checkLocalInstall('docker');
    if (dockerCheck.status === 'error') {
      steps.push(this.step('Docker', 'error', 'Docker not found — install from https://docker.com'));
      return { success: false, steps };
    }
    steps.push(dockerCheck);

    // 2. Run install script
    this.logProvider('deploy', 'Installing HiClaw via official script');
    try {
      const { execa } = await import('execa');
      await execa('sh', ['-c', 'curl -sSL https://higress.ai/hiclaw/install.sh | bash'], { timeout: 300_000 });
      steps.push(this.step('Install', 'ok', 'HiClaw installed'));
      steps.push(this.step('Ports', 'ok', '8080 (proxy) / 8001 (management) / 6167 (Matrix) / 9000 (MinIO)'));
    } catch (err: unknown) {
      steps.push(this.step('Install', 'error', (err as Error).message));
      this.logProvider('deploy', 'Install script failed, falling back to realLocalDeploy');
      return this.realLocalDeploy(blueprint);
    }

    return { success: steps.every(s => s.status !== 'error'), steps };
  }

  async test(): Promise<TestResult> {
    try {
      const { execa } = await import('execa');
      const { stdout } = await execa('sh', ['-c', 'docker ps --format "{{.Names}}" | grep hiclaw'], { timeout: 10_000 });
      const containers = stdout.trim().split('\n').filter(Boolean);
      if (containers.length > 0) {
        return { success: true, checks: [this.step('Containers', 'ok', `Running: ${containers.join(', ')}`)] };
      }
      return { success: false, checks: [this.step('Containers', 'error', 'No hiclaw containers running')] };
    } catch {
      return { success: false, checks: [this.step('Containers', 'error', 'Docker check failed or no hiclaw containers')] };
    }
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', 'Run: docker compose -f ~/.hiclaw/docker-compose.yml down -v')] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    const dockerCheck = await this.checkLocalInstall('docker');
    const suggestions: string[] = [];
    if (dockerCheck.status === 'error') {
      suggestions.push('Install Docker: https://docker.com');
    }
    return { healthy: dockerCheck.status === 'ok', checks: [dockerCheck], suggestions };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'Docker', check: 'docker --version', installHint: 'Install from https://docker.com', required: true },
      { name: 'curl', check: 'curl --version', installHint: 'Pre-installed on most systems', required: true },
    ];
  }
}
