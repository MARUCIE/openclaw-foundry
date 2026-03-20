// WorkBuddy + QClaw — 腾讯 (Tencent) + 企微/QQ + 腾讯云

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { CloudProvider } from './base.js';

export class WorkBuddyProvider extends CloudProvider {
  meta: ProviderMeta = {
    id: 'workbuddy',
    name: 'WorkBuddy / QClaw',
    vendor: '腾讯 (Tencent)',
    type: 'desktop',
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://codebuddy.cn/work',
    docUrl: 'https://claw.guanjia.qq.com/docs',
    imChannels: ['wecom', 'qq'],
    description: '腾讯 WorkBuddy — 本地桌面 AI Agent，20+ 技能包 + MCP 协议。QClaw 一键装进微信/QQ（内测）。腾讯内部 2000+ 非技术员工测试通过。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const notReady = this.checkApiReady();
    if (notReady) return notReady;

    const steps = [];
    steps.push(await this.checkApiAccess(blueprint));
    if (steps[0].status === 'error') return { success: false, steps };

    this.logProvider('deploy', 'Creating WorkBuddy instance on Tencent Cloud');

    try {
      const resp = await fetch('https://claw.guanjia.qq.com/api/v1/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${blueprint.target?.credentials?.token || ''}`,
        },
        body: JSON.stringify({
          name: blueprint.meta.name,
          region: blueprint.target?.region || 'ap-guangzhou',
          blueprint: {
            identity: blueprint.identity,
            skills: blueprint.skills,
            agents: blueprint.agents,
            config: blueprint.config,
          },
          im_channel: blueprint.target?.imChannel || 'wecom',
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!resp.ok) {
        steps.push(this.step('Instance', 'error', `Tencent API: ${resp.status}`));
        return { success: false, steps };
      }

      const data = await resp.json() as { instance_id: string; console_url: string };
      steps.push(this.step('Instance', 'ok', `Created: ${data.instance_id}`));
      steps.push(this.step('IM Channel', 'ok', `${blueprint.target?.imChannel || 'wecom'} configured`));

      return { success: true, steps, instanceUrl: data.console_url };
    } catch (err: unknown) {
      steps.push(this.step('Instance', 'error', (err as Error).message));
      return { success: false, steps };
    }
  }

  async test(blueprint: Blueprint): Promise<TestResult> {
    const check = await this.checkApiHealth('https://claw.guanjia.qq.com/api/health');
    return { success: check.status === 'ok', checks: [check] };
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const result = await this.deploy(blueprint);
    return { success: result.success, steps: result.steps };
  }

  async uninstall(options: { dryRun?: boolean }): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', 'Destroy via codebuddy.cn console')] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    const apiCheck = await this.checkApiHealth('https://claw.guanjia.qq.com/api/health');
    return { healthy: apiCheck.status === 'ok', checks: [apiCheck], suggestions: [] };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'Tencent Cloud SecretId', check: 'echo $TENCENTCLOUD_SECRET_ID', installHint: 'Get from console.cloud.tencent.com', required: true },
    ];
  }
}
