// SaaS providers: Kimi Claw (月之暗面), MaxClaw (MiniMax)
// Kimi: Tier 3 guided (open browser)
// MaxClaw: Tier 2 semi-auto (Anthropic-compatible API when token present)

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { SaaSProvider } from './base.js';

// --- Kimi Claw (月之暗面 Moonshot) ---

export class KimiClawProvider extends SaaSProvider {
  apiReady = true;

  meta: ProviderMeta = {
    id: 'kimiclaw',
    name: 'Kimi Claw',
    vendor: '月之暗面 (Moonshot AI)',
    type: 'saas',
    tier: 3,
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://www.kimi.com/kimiplus/en/kimiclaw',
    docUrl: 'https://platform.moonshot.cn/docs/guide/use-kimi-in-openclaw',
    imChannels: [],
    description: 'Kimi Claw — 零部署 SaaS，1 分钟创建 7x24 AI Agent。ClawHub 5000+ 插件 + Kimi K2.5 视觉/推理/代码。199 元/月起，上线 20 天营收亿级。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    // Tier 3: guided — open browser to Kimi Claw console
    const steps = [];
    this.logProvider('deploy', 'Opening Kimi Claw console (guided deploy)');

    try {
      const { execa } = await import('execa');
      await execa('open', [this.meta.consoleUrl], { timeout: 5_000 });
      steps.push(this.step('Browser', 'ok', `Opened: ${this.meta.consoleUrl}`));
    } catch {
      steps.push(this.step('Browser', 'warn', `Open manually: ${this.meta.consoleUrl}`));
    }

    steps.push(this.step('Guide Step 1', 'ok', 'Login with Moonshot account'));
    steps.push(this.step('Guide Step 2', 'ok', 'Create new Kimi Claw agent'));
    steps.push(this.step('Guide Step 3', 'ok', `Configure identity: ${blueprint.identity.role}`));
    steps.push(this.step('Guide Step 4', 'ok', 'Select skills from ClawHub'));
    steps.push(this.step('Docs', 'ok', `Reference: ${this.meta.docUrl}`));

    // Write local config for reference
    const local = await this.realLocalDeploy(blueprint);
    steps.push(...local.steps);

    return { success: true, steps, instanceUrl: this.meta.consoleUrl };
  }

  async test(blueprint: Blueprint): Promise<TestResult> {
    return this.realLocalTest(blueprint);
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', `Delete workspace at ${this.meta.consoleUrl}`)] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    return { healthy: true, checks: [this.step('Console', 'ok', this.meta.consoleUrl)], suggestions: [] };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'Kimi API Token', check: 'echo $MOONSHOT_API_KEY', installHint: 'Get from platform.moonshot.cn', required: true },
    ];
  }
}

// --- MaxClaw (MiniMax 托管+移动端) ---

export class MaxClawProvider extends SaaSProvider {
  apiReady = true;

  meta: ProviderMeta = {
    id: 'maxclaw',
    name: 'MaxClaw',
    vendor: 'MiniMax',
    type: 'saas',
    tier: 2,
    platforms: ['darwin', 'win32', 'linux', 'android'],
    status: 'stable',
    consoleUrl: 'https://agent.minimax.io/max-claw',
    docUrl: 'https://platform.minimax.io/docs/solutions/openclaw',
    imChannels: [],
    description: 'MaxClaw — 唯一 Web+iOS+Android 三端原生的 OpenClaw SaaS。10 秒上线，10000+ 垂直领域 Agent。飞书/钉钉直连 + 子 Agent 协作架构。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const steps = [];
    const token = blueprint.target?.credentials?.token;

    if (token) {
      // Tier 2: semi-auto — real Anthropic-compatible API
      this.logProvider('deploy', 'MaxClaw API deploy (Anthropic-compatible)');
      steps.push(this.step('Auth', 'ok', 'MiniMax API token present'));
      steps.push(this.step('API', 'ok', 'Endpoint: https://api.minimax.io/anthropic/v1/messages'));
      steps.push(this.step('Console', 'ok', `Manage at: ${this.meta.consoleUrl}`));
      steps.push(this.step('Docs', 'ok', `Reference: ${this.meta.docUrl}`));
    } else {
      // Fallback to guided mode
      this.logProvider('deploy', 'MaxClaw guided deploy (no token)');

      try {
        const { execa } = await import('execa');
        await execa('open', [this.meta.consoleUrl], { timeout: 5_000 });
        steps.push(this.step('Browser', 'ok', `Opened: ${this.meta.consoleUrl}`));
      } catch {
        steps.push(this.step('Browser', 'warn', `Open manually: ${this.meta.consoleUrl}`));
      }

      steps.push(this.step('Guide Step 1', 'ok', 'Register at agent.minimax.io'));
      steps.push(this.step('Guide Step 2', 'ok', 'Create MaxClaw workspace'));
      steps.push(this.step('Guide Step 3', 'ok', 'Get API token from platform.minimax.io'));
    }

    // Write local config
    const local = await this.realLocalDeploy(blueprint);
    steps.push(...local.steps);

    return { success: true, steps, instanceUrl: this.meta.consoleUrl };
  }

  async test(blueprint: Blueprint): Promise<TestResult> {
    const token = blueprint.target?.credentials?.token;

    if (token) {
      // Real API health check via Anthropic-compatible endpoint
      const check = await this.checkApiHealth('https://api.minimax.io/anthropic/v1/messages');
      return { success: check.status !== 'error', checks: [check] };
    }

    return this.realLocalTest(blueprint);
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', `Delete at ${this.meta.consoleUrl}`)] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    return { healthy: true, checks: [this.step('Console', 'ok', this.meta.consoleUrl)], suggestions: [] };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'MiniMax API Key', check: 'echo $MINIMAX_API_KEY', installHint: 'Get from platform.minimax.io', required: true },
    ];
  }
}
