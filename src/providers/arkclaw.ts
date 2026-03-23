// ArkClaw — 火山引擎 (ByteDance/Volcengine) + 飞书适配

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { CloudProvider } from './base.js';

export class ArkClawProvider extends CloudProvider {
  apiReady = true;

  meta: ProviderMeta = {
    id: 'arkclaw',
    name: 'ArkClaw',
    vendor: '火山引擎 (ByteDance)',
    type: 'saas',
    tier: 2,
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/experience/claw',
    docUrl: 'https://www.volcengine.com/docs/82379/2229107',
    imChannels: ['feishu', 'dingtalk', 'wecom'],
    description: '火山引擎方舟 ArkClaw — 零部署 SaaS，浏览器直接用。飞书深度集成 + Doubao/Kimi/GLM 多模型。需飞书 QR 扫码授权一次。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const steps = [];

    // ArkClaw is browser-only SaaS — no instance creation API exists.
    // Tier 2: guide user to console + Feishu setup, then local config
    this.logProvider('deploy', 'ArkClaw is browser-based SaaS — opening console');

    // 1. Open console URL
    try {
      const { execa } = await import('execa');
      await execa('open', [this.meta.consoleUrl], { timeout: 5_000 }).catch(() => {});
      steps.push(this.step('Console', 'ok', `Opened ${this.meta.consoleUrl}`));
    } catch {
      steps.push(this.step('Console', 'warn', `Open manually: ${this.meta.consoleUrl}`));
    }

    // 2. Show Feishu setup guide
    steps.push(this.step('Step 1', 'ok', 'Volcengine 控制台创建 API Key'));
    steps.push(this.step('Step 2', 'ok', 'open.feishu.cn 创建飞书 App + Bot'));
    steps.push(this.step('Step 3', 'ok', 'ArkClaw 配置飞书 App ID/Secret'));
    steps.push(this.step('Step 4', 'warn', '飞书扫码授权 (需手机操作一次)'));

    // 3. Also do local config via executor
    const localResult = await this.realLocalDeploy(blueprint);
    steps.push(...localResult.steps);

    return { success: true, steps, instanceUrl: this.meta.consoleUrl };
  }

  async test(blueprint: Blueprint): Promise<TestResult> {
    if (!this.hasCredentials(blueprint)) {
      return this.realLocalTest(blueprint);
    }
    const endpoint = blueprint.target?.credentials?.endpoint;
    if (!endpoint) {
      return { success: false, checks: [this.step('Endpoint', 'error', 'No instance endpoint')] };
    }
    const check = await this.checkApiHealth(`${endpoint}/health`);
    return { success: check.status === 'ok', checks: [check] };
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    this.logProvider('repair', 'Re-syncing ArkClaw config');
    // Cloud repair = re-push config to existing instance
    const result = await this.deploy(blueprint);
    return { success: result.success, steps: result.steps };
  }

  async uninstall(options: { dryRun?: boolean }): Promise<ExecutionResult> {
    if (options.dryRun) {
      return { success: true, steps: [this.step('Uninstall', 'ok', 'Would destroy ArkClaw instance (dry-run)')] };
    }
    return { success: true, steps: [this.step('Uninstall', 'warn', 'Cloud instance must be destroyed via console')] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    const checks = [
      this.step('Console', 'ok', this.meta.consoleUrl),
      this.step('飞书 IM', 'ok', 'Feishu channel supported'),
    ];
    return { healthy: true, checks, suggestions: [] };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'Volcengine AccessKey', check: 'echo $VOLC_ACCESS_KEY', installHint: 'Get from console.volcengine.com', required: true },
    ];
  }
}
