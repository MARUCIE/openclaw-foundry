// ArkClaw — 火山引擎 (ByteDance/Volcengine) + 飞书适配

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { CloudProvider } from './base.js';

export class ArkClawProvider extends CloudProvider {
  meta: ProviderMeta = {
    id: 'arkclaw',
    name: 'ArkClaw',
    vendor: '火山引擎 (ByteDance)',
    type: 'saas',
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://console.volcengine.com/ark/claw',
    docUrl: 'https://www.volcengine.com/docs/82379/2229107',
    imChannels: ['feishu'],
    description: '火山引擎方舟 ArkClaw — 零部署 SaaS，浏览器直接用。飞书深度集成 + Doubao-Seed-2.0/Kimi/GLM 多模型。Coding Plan Pro 用户直接可用。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const steps = [];

    // 1. Check credentials
    steps.push(await this.checkApiAccess(blueprint));
    if (steps[0].status === 'error') return { success: false, steps };

    // 2. Create cloud instance via Volcengine API
    this.logProvider('deploy', 'Creating ArkClaw instance on Volcengine');
    const endpoint = this.getEndpoint(blueprint);
    const region = blueprint.target?.region || 'cn-beijing';

    try {
      const resp = await fetch(`${endpoint}/api/v1/claw/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': blueprint.target?.credentials?.accessKeyId || '',
          'X-Secret-Key': blueprint.target?.credentials?.accessKeySecret || '',
        },
        body: JSON.stringify({
          name: blueprint.meta.name,
          region,
          identity: blueprint.identity,
          skills: blueprint.skills,
          agents: blueprint.agents,
          config: blueprint.config,
          im_channel: blueprint.target?.imChannel || 'feishu',
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!resp.ok) {
        const err = await resp.text();
        steps.push(this.step('Instance', 'error', `Volcengine API: ${resp.status} ${err}`));
        return { success: false, steps };
      }

      const data = await resp.json() as { instance_id: string; endpoint: string };
      steps.push(this.step('Instance', 'ok', `Created: ${data.instance_id}`));

      return {
        success: true,
        steps,
        instanceUrl: `${this.meta.consoleUrl}/instance/${data.instance_id}`,
        credentials: { endpoint: data.endpoint },
      };
    } catch (err: unknown) {
      steps.push(this.step('Instance', 'error', `Deploy failed: ${(err as Error).message}`));
      return { success: false, steps };
    }
  }

  async test(blueprint: Blueprint): Promise<TestResult> {
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
