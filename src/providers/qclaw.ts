// QClaw — 腾讯 QQ Bot OpenClaw (官方 QQ 开放平台插件)

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { DesktopProvider } from './base.js';

export class QClawProvider extends DesktopProvider {
  apiReady = true;

  meta: ProviderMeta = {
    id: 'qclaw',
    name: 'QClaw',
    vendor: '腾讯 (Tencent)',
    type: 'desktop',
    tier: 2,
    platforms: ['darwin', 'win32', 'linux'],
    status: 'beta',
    consoleUrl: 'https://qclaw.qq.com/',
    docUrl: 'https://github.com/tencent-connect/openclaw-qqbot',
    imChannels: ['qq', 'wecom'],
    description: '腾讯 QClaw — 官方 QQ 开放平台 OpenClaw 插件。QQ Bot 一键接入，支持企业微信。每个 QQ 账号最多 5 个 Bot。',
    github: 'tencent-connect/openclaw-qqbot',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const notReady = this.checkApiReady();
    if (notReady) return notReady;

    const steps = [];
    const token = blueprint.target?.credentials?.token;

    if (token) {
      // Token format: AppID:AppSecret
      const parts = token.split(':');
      if (parts.length !== 2) {
        steps.push(this.step('Credentials', 'error', 'Token must be in AppID:AppSecret format'));
        return { success: false, steps };
      }

      this.logProvider('deploy', 'Configuring QClaw QQ Bot plugin');

      try {
        const { writeFile, mkdir } = await import('fs/promises');
        const { join } = await import('path');
        const home = process.env.HOME || process.env.USERPROFILE || '~';
        const configDir = join(home, '.qclaw');
        await mkdir(configDir, { recursive: true });

        const config = {
          provider: 'qclaw',
          qq: {
            appId: parts[0],
            appSecret: parts[1],
            sandbox: blueprint.target?.extras?.sandbox !== 'false',
          },
          identity: blueprint.identity,
          skills: [...blueprint.skills.fromAifleet, ...blueprint.skills.fromClawhub],
          agents: blueprint.agents,
          config: blueprint.config,
          _foundry: { blueprint: blueprint.meta.name, provider: 'qclaw' },
        };
        await writeFile(join(configDir, 'qclaw.json'), JSON.stringify(config, null, 2));
        steps.push(this.step('Config', 'ok', 'QQ Bot config written'));
        steps.push(this.step('Note', 'warn', 'Max 5 bots per QQ account'));
      } catch (err: unknown) {
        steps.push(this.step('Config', 'error', (err as Error).message));
        return { success: false, steps };
      }
    } else {
      // No credentials — fall back to local deploy + instructions
      this.logProvider('deploy', 'No QQ credentials, falling back to local deploy');
      const localResult = await this.realLocalDeploy(blueprint);
      localResult.steps.push(this.step('QQ Setup', 'warn',
        'Register QQ Bot at https://q.qq.com — get AppID and AppSecret, then redeploy with token=AppID:AppSecret'));
      return localResult;
    }

    return { success: steps.every(s => s.status !== 'error'), steps };
  }

  async test(blueprint: Blueprint): Promise<TestResult> {
    return this.realLocalTest(blueprint);
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', 'Run: rm -rf ~/.qclaw && revoke bot at https://q.qq.com')] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    const nodeCheck = await this.checkLocalInstall('node');
    const suggestions: string[] = [];
    if (nodeCheck.status === 'error') {
      suggestions.push('Install Node.js 18+: https://nodejs.org');
    }
    return { healthy: nodeCheck.status === 'ok', checks: [nodeCheck], suggestions };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'Node.js 18+', check: 'node --version', installHint: 'Install from https://nodejs.org', required: true },
    ];
  }
}
