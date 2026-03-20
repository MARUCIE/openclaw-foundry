// miclaw — 小米手机系统层 Agent (封测)

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { MobileProvider } from './base.js';

export class MiClawProvider extends MobileProvider {
  meta: ProviderMeta = {
    id: 'miclaw',
    name: 'miclaw',
    vendor: '小米 (Xiaomi)',
    type: 'mobile',
    platforms: ['android'],
    status: 'preview',
    consoleUrl: 'https://m.beehive.miui.com/dx8tveug0iy7a9dzetwydq/desktop/home',
    docUrl: 'https://dev.mi.com/docs/miclaw',
    imChannels: [],
    description: '小米 miclaw — 国内首款移动端系统级 AI Agent。MiMo 大模型驱动，50+ 系统工具 + 米家生态。覆盖小米 17 系列 5 款机型（封测中）。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const notReady = this.checkApiReady();
    if (notReady) return notReady;

    const steps = [];

    // 1. Check ADB connection
    const deviceCheck = await this.checkDeviceConnection('adb');
    steps.push(deviceCheck);
    if (deviceCheck.status === 'error') {
      return { success: false, steps };
    }

    // 2. Check miclaw app is installed on device
    this.logProvider('deploy', 'Checking miclaw on device');
    try {
      const { execa } = await import('execa');
      const { stdout } = await execa('adb', ['shell', 'pm', 'list', 'packages', 'com.xiaomi.miclaw'], { timeout: 10_000 });
      if (!stdout.includes('com.xiaomi.miclaw')) {
        steps.push(this.step('miclaw App', 'error', 'miclaw not installed on device — apply for beta at beehive.miui.com'));
        return { success: false, steps };
      }
      steps.push(this.step('miclaw App', 'ok', 'Found on device'));
    } catch (err: unknown) {
      steps.push(this.step('miclaw App', 'error', (err as Error).message));
      return { success: false, steps };
    }

    // 3. Push config to device
    this.logProvider('deploy', 'Pushing blueprint config to device');
    try {
      const { execa } = await import('execa');
      const { writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const tmpDir = process.env.TMPDIR || '/tmp';
      const configPath = join(tmpDir, 'miclaw-blueprint.json');

      const config = {
        identity: blueprint.identity,
        skills: [...blueprint.skills.fromAifleet, ...blueprint.skills.fromClawhub].slice(0, 20), // mobile: limit skills
        agents: blueprint.agents.slice(0, 2), // mobile: limit agents
        config: {
          ...blueprint.config,
          memoryChunks: Math.min(blueprint.config.memoryChunks, 24), // mobile: limit memory
        },
        _foundry: { blueprint: blueprint.meta.name, provider: 'miclaw' },
      };

      await writeFile(configPath, JSON.stringify(config, null, 2));
      await execa('adb', ['push', configPath, '/sdcard/miclaw/config.json'], { timeout: 15_000 });
      steps.push(this.step('Config Push', 'ok', 'Blueprint pushed to /sdcard/miclaw/'));

      // Trigger miclaw to reload config
      await execa('adb', ['shell', 'am', 'broadcast', '-a', 'com.xiaomi.miclaw.RELOAD_CONFIG'], { timeout: 5_000 });
      steps.push(this.step('Reload', 'ok', 'miclaw config reloaded'));
    } catch (err: unknown) {
      steps.push(this.step('Config Push', 'error', (err as Error).message));
    }

    return { success: steps.every(s => s.status !== 'error'), steps };
  }

  async test(): Promise<TestResult> {
    const check = await this.checkDeviceConnection('adb');
    const checks = [check];

    if (check.status === 'ok') {
      try {
        const { execa } = await import('execa');
        const { stdout } = await execa('adb', ['shell', 'cat', '/sdcard/miclaw/config.json'], { timeout: 5_000 });
        if (stdout.includes('_foundry')) {
          checks.push(this.step('Config', 'ok', 'Foundry-managed config present'));
        } else {
          checks.push(this.step('Config', 'warn', 'Config exists but not Foundry-managed'));
        }
      } catch {
        checks.push(this.step('Config', 'error', 'No config on device'));
      }
    }

    return { success: checks.every(c => c.status !== 'error'), checks };
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    try {
      const { execa } = await import('execa');
      await execa('adb', ['shell', 'rm', '-rf', '/sdcard/miclaw/config.json'], { timeout: 5_000 });
      return { success: true, steps: [this.step('Uninstall', 'ok', 'Config removed from device')] };
    } catch {
      return { success: true, steps: [this.step('Uninstall', 'warn', 'Manual deletion needed')] };
    }
  }

  async diagnose(): Promise<DiagnoseResult> {
    const check = await this.checkDeviceConnection('adb');
    return {
      healthy: check.status === 'ok',
      checks: [check],
      suggestions: check.status !== 'ok' ? ['Connect Xiaomi device via USB and enable USB debugging'] : [],
    };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'ADB (Android Debug Bridge)', check: 'adb version', installHint: 'brew install android-platform-tools', required: true },
      { name: 'Xiaomi device with miclaw beta', check: 'adb shell pm list packages com.xiaomi.miclaw', installHint: 'Apply at beehive.miui.com', required: true },
    ];
  }
}
