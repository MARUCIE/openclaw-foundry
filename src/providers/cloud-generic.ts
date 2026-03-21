// Generic cloud providers: JD Cloud, Huawei Cloud, Aliyun, Baidu Cloud
// These share a common pattern: API-based instance creation with vendor-specific endpoints

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { CloudProvider } from './base.js';

// --- JD Cloud (京东云) ---

export class JDCloudProvider extends CloudProvider {
  meta: ProviderMeta = {
    id: 'jdcloud',
    name: '京东云 OpenClaw',
    vendor: '京东云 (JD Cloud)',
    type: 'cloud',
    platforms: ['darwin', 'win32', 'linux'],
    status: 'beta',
    consoleUrl: 'https://jdcloud.com/cn/products/lighthouse-openclaw',
    docUrl: 'https://docs.jdcloud.com/cn/openclaw',
    imChannels: [],
    description: '京东云轻量应用服务器一键部署 OpenClaw。预装环境，开箱即用。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    if (!this.hasCredentials(blueprint)) { return this.realLocalDeploy(blueprint); }
    return this.genericCloudDeploy(blueprint, 'https://api.jdcloud-api.com/v1/openclaw/instances', 'cn-north-1');
  }

  async test(blueprint: Blueprint): Promise<TestResult> {
    if (!this.hasCredentials(blueprint)) { return this.realLocalTest(blueprint); }
    return this.genericCloudTest(blueprint);
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', 'Destroy via jdcloud.com console')] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    return { healthy: true, checks: [this.step('Console', 'ok', this.meta.consoleUrl)], suggestions: [] };
  }

  getRequirements(): Requirement[] {
    return [{ name: 'JD Cloud AccessKey', check: 'echo $JDC_ACCESS_KEY', installHint: 'Get from uc.jdcloud.com', required: true }];
  }

  protected async genericCloudDeploy(blueprint: Blueprint, apiUrl: string, defaultRegion: string): Promise<DeployResult> {
    if (!this.hasCredentials(blueprint)) { return this.realLocalDeploy(blueprint); }

    const steps = [];
    steps.push(await this.checkApiAccess(blueprint));
    if (steps[0].status === 'error') return { success: false, steps };

    this.logProvider('deploy', `Creating instance (${this.meta.vendor})`);
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${blueprint.target?.credentials?.token || blueprint.target?.credentials?.accessKeyId || ''}`,
        },
        body: JSON.stringify({
          name: blueprint.meta.name,
          region: blueprint.target?.region || defaultRegion,
          instance_type: blueprint.target?.instanceType || 'standard',
          blueprint: {
            identity: blueprint.identity,
            skills: blueprint.skills,
            agents: blueprint.agents,
            config: blueprint.config,
          },
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!resp.ok) {
        steps.push(this.step('Instance', 'error', `${this.meta.vendor} API: ${resp.status}`));
        return { success: false, steps };
      }

      const data = await resp.json() as { instance_id: string; endpoint: string };
      steps.push(this.step('Instance', 'ok', `Created: ${data.instance_id}`));
      return { success: true, steps, instanceUrl: `${this.meta.consoleUrl}/${data.instance_id}` };
    } catch (err: unknown) {
      steps.push(this.step('Instance', 'error', (err as Error).message));
      return { success: false, steps };
    }
  }

  protected async genericCloudTest(blueprint: Blueprint): Promise<TestResult> {
    const endpoint = blueprint.target?.credentials?.endpoint;
    if (!endpoint) return { success: false, checks: [this.step('Endpoint', 'error', 'No instance endpoint')] };
    const check = await this.checkApiHealth(`${endpoint}/health`);
    return { success: check.status === 'ok', checks: [check] };
  }
}

// --- Huawei Cloud (华为云) ---

export class HuaweiCloudProvider extends JDCloudProvider {
  meta: ProviderMeta = {
    id: 'huaweicloud',
    name: '华为云 OpenClaw',
    vendor: '华为云 (Huawei Cloud)',
    type: 'cloud',
    platforms: ['darwin', 'win32', 'linux'],
    status: 'beta',
    consoleUrl: 'https://activity.huaweicloud.com/openclaw.html',
    docUrl: 'https://support.huaweicloud.com/openclaw-aislt/openclaw_01.html',
    imChannels: ['dingtalk', 'wecom', 'feishu', 'qq'],
    description: '华为云 Flexus L 轻量服务器一键部署。预置 OpenClaw 镜像 + 4 大 IM 支持。DeepSeek-V3.2/GLM-5/Kimi K2。9.9 元/月起。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    return this.genericCloudDeploy(blueprint, 'https://ecs.cn-north-4.myhuaweicloud.com/v1/openclaw/instances', 'cn-north-4');
  }

  getRequirements(): Requirement[] {
    return [{ name: 'Huawei Cloud AK/SK', check: 'echo $HW_ACCESS_KEY', installHint: 'Get from console.huaweicloud.com', required: true }];
  }
}

// --- Aliyun (阿里云 JVS Claw + AgentBay) ---

export class AliyunProvider extends JDCloudProvider {
  meta: ProviderMeta = {
    id: 'aliyun',
    name: '阿里云 AgentBay',
    vendor: '阿里云 (Alibaba Cloud)',
    type: 'cloud',
    platforms: ['darwin', 'win32', 'linux', 'android'],
    status: 'stable',
    consoleUrl: 'https://jvs.wuying.aliyun.com',
    docUrl: 'https://www.aliyun.com/product/agentbay',
    imChannels: ['dingtalk'],
    description: '阿里云无影 AgentBay — 企业级 PaaS，4 种执行环境 (Browser/Computer/Code/Mobile)。Serverless 秒级弹性，千级并发。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    return this.genericCloudDeploy(blueprint, 'https://agentbay.cn-hangzhou.aliyuncs.com/v1/instances', 'cn-hangzhou');
  }

  getRequirements(): Requirement[] {
    return [{ name: 'Aliyun AccessKey', check: 'echo $ALIBABA_CLOUD_ACCESS_KEY_ID', installHint: 'Get from ram.console.aliyun.com', required: true }];
  }
}

// --- Baidu Cloud (百度智能云 DuClaw) ---

export class DuClawProvider extends JDCloudProvider {
  meta: ProviderMeta = {
    id: 'duclaw',
    name: 'DuClaw',
    vendor: '百度智能云 (Baidu Cloud)',
    type: 'saas',
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://cloud.baidu.com/product/duclaw.html',
    docUrl: 'https://cloud.baidu.com/product/BCC/moltbot.html',
    imChannels: [],
    description: '百度 DuClaw — 零部署 SaaS，浏览器直接用。内置百度搜索/百科/学术。DeepSeek/Kimi/GLM/MiniMax 多模型。17.8 元/月起。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    return this.genericCloudDeploy(blueprint, 'https://bcc.bj.baidubce.com/v1/openclaw/instances', 'bj');
  }

  getRequirements(): Requirement[] {
    return [{ name: 'Baidu Cloud AK', check: 'echo $BAIDU_AK', installHint: 'Get from console.bce.baidu.com', required: true }];
  }
}
