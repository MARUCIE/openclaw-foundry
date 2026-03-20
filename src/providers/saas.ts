// SaaS providers: Kimi Claw (月之暗面), MaxClaw (MiniMax)

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { SaaSProvider } from './base.js';

// --- Kimi Claw (月之暗面 Moonshot) ---

export class KimiClawProvider extends SaaSProvider {
  meta: ProviderMeta = {
    id: 'kimiclaw',
    name: 'Kimi Claw',
    vendor: '月之暗面 (Moonshot AI)',
    type: 'saas',
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://kimi.moonshot.cn/claw',
    docUrl: 'https://platform.moonshot.cn/docs/claw',
    imChannels: [],
    description: 'Kimi Claw — 零部署 SaaS，1 分钟创建 7x24 AI Agent。ClawHub 5000+ 插件 + Kimi K2.5 视觉/推理/代码。199 元/月起，上线 20 天营收亿级。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const notReady = this.checkApiReady();
    if (notReady) return notReady;

    const steps = [];
    const token = blueprint.target?.credentials?.token;

    if (!token) {
      steps.push(this.step('Auth', 'error', 'Kimi API token required (set target.credentials.token)'));
      return { success: false, steps };
    }

    this.logProvider('deploy', 'Creating Kimi Claw workspace');
    try {
      const resp = await fetch('https://api.moonshot.cn/v1/claw/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: blueprint.meta.name,
          identity: blueprint.identity,
          skills: [...blueprint.skills.fromAifleet, ...blueprint.skills.fromClawhub],
          agents: blueprint.agents,
          config: blueprint.config,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!resp.ok) {
        steps.push(this.step('Workspace', 'error', `Kimi API: ${resp.status}`));
        return { success: false, steps };
      }

      const data = await resp.json() as { workspace_id: string; url: string };
      steps.push(this.step('Workspace', 'ok', `Created: ${data.workspace_id}`));

      return {
        success: true,
        steps,
        instanceUrl: data.url || `${this.meta.consoleUrl}/${data.workspace_id}`,
      };
    } catch (err: unknown) {
      steps.push(this.step('Workspace', 'error', (err as Error).message));
      return { success: false, steps };
    }
  }

  async test(): Promise<TestResult> {
    const check = await this.checkApiHealth('https://api.moonshot.cn/v1/health');
    return { success: check.status === 'ok', checks: [check] };
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', `Delete workspace at ${this.meta.consoleUrl}`)] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    const check = await this.checkApiHealth('https://api.moonshot.cn/v1/health');
    return { healthy: check.status === 'ok', checks: [check], suggestions: [] };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'Kimi API Token', check: 'echo $MOONSHOT_API_KEY', installHint: 'Get from platform.moonshot.cn', required: true },
    ];
  }
}

// --- MaxClaw (MiniMax 托管+移动端) ---

export class MaxClawProvider extends SaaSProvider {
  meta: ProviderMeta = {
    id: 'maxclaw',
    name: 'MaxClaw',
    vendor: 'MiniMax',
    type: 'saas',
    platforms: ['darwin', 'win32', 'linux', 'android'],
    status: 'stable',
    consoleUrl: 'https://agent.minimaxi.com/max-claw',
    docUrl: 'https://platform.minimaxi.com/docs/max-claw',
    imChannels: [],
    description: 'MaxClaw — 唯一 Web+iOS+Android 三端原生的 OpenClaw SaaS。10 秒上线，10000+ 垂直领域 Agent。飞书/钉钉直连 + 子 Agent 协作架构。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const notReady = this.checkApiReady();
    if (notReady) return notReady;

    const steps = [];
    const token = blueprint.target?.credentials?.token;

    if (!token) {
      steps.push(this.step('Auth', 'error', 'MiniMax API token required'));
      return { success: false, steps };
    }

    this.logProvider('deploy', 'Creating MaxClaw workspace');
    try {
      const resp = await fetch('https://api.minimaxi.com/v1/claw/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: blueprint.meta.name,
          identity: blueprint.identity,
          skills: [...blueprint.skills.fromAifleet, ...blueprint.skills.fromClawhub],
          agents: blueprint.agents,
          config: blueprint.config,
          enable_mobile: blueprint.meta.os === 'android',
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!resp.ok) {
        steps.push(this.step('Workspace', 'error', `MiniMax API: ${resp.status}`));
        return { success: false, steps };
      }

      const data = await resp.json() as { workspace_id: string; url: string };
      steps.push(this.step('Workspace', 'ok', `Created: ${data.workspace_id}`));

      return { success: true, steps, instanceUrl: data.url };
    } catch (err: unknown) {
      steps.push(this.step('Workspace', 'error', (err as Error).message));
      return { success: false, steps };
    }
  }

  async test(): Promise<TestResult> {
    const check = await this.checkApiHealth('https://api.minimaxi.com/v1/health');
    return { success: check.status === 'ok', checks: [check] };
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', `Delete at ${this.meta.consoleUrl}`)] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    const check = await this.checkApiHealth('https://api.minimaxi.com/v1/health');
    return { healthy: check.status === 'ok', checks: [check], suggestions: [] };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'MiniMax API Key', check: 'echo $MINIMAX_API_KEY', installHint: 'Get from platform.minimaxi.com', required: true },
    ];
  }
}
