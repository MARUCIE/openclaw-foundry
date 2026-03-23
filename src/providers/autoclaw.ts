// AutoClaw — 智谱 AI AutoGLM OpenClaw 版 (支持 U 盘全自动安装)

import type {
  ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement,
} from '../types.js';
import { DesktopProvider } from './base.js';

export class AutoClawProvider extends DesktopProvider {
  apiReady = true;

  meta: ProviderMeta = {
    id: 'autoclaw',
    name: 'AutoClaw',
    vendor: '智谱 AI (Zhipu AI)',
    type: 'desktop',
    tier: 1,
    platforms: ['darwin', 'win32', 'linux'],
    status: 'stable',
    consoleUrl: 'https://autoglm.zhipuai.cn/autoclaw',
    docUrl: 'https://open.bigmodel.cn/dev/howuse/autoclaw',
    imChannels: ['feishu'],
    installCmd: 'curl -L https://autoglm.zhipuai.cn/autoclaw/AutoClaw-macos-arm64.dmg -o /tmp/autoclaw.dmg',
    github: 'tsingliuwin/autoclaw',
    description: '智谱 AutoClaw — 国内首个一键安装本地 OpenClaw。CLI-first 设计，支持 --no-interactive 无人值守。50+ 预装 Skills + AutoGLM 浏览器自动化。',
  };

  async deploy(blueprint: Blueprint): Promise<DeployResult> {
    const notReady = this.checkApiReady();
    if (notReady) return notReady;

    const steps = [];
    const deployMode = blueprint.target?.extras?.installMode || 'online';

    if (deployMode === 'usb') {
      return this.deployViaUsb(blueprint);
    }

    // Online install
    const installCheck = await this.checkLocalInstall('autoclaw');
    if (installCheck.status === 'error') {
      this.logProvider('deploy', 'Installing AutoClaw');
      try {
        const { execa } = await import('execa');
        // AutoClaw uses its own installer
        await execa('sh', ['-c', 'curl -fsSL https://autoglm.zhipuai.cn/autoclaw/install.sh | bash'], { timeout: 180_000 });
        steps.push(this.step('Install', 'ok', 'AutoClaw installed'));
      } catch (err: unknown) {
        steps.push(this.step('Install', 'error', (err as Error).message));
        return { success: false, steps };
      }
    } else {
      steps.push(installCheck);
    }

    // Configure with blueprint
    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const home = process.env.HOME || process.env.USERPROFILE || '~';
      const configDir = join(home, '.autoclaw');
      await mkdir(configDir, { recursive: true });

      const config = {
        identity: blueprint.identity,
        skills: [...blueprint.skills.fromAifleet, ...blueprint.skills.fromClawhub],
        agents: blueprint.agents,
        config: blueprint.config,
        llm: { provider: 'zhipu', model: 'glm-4-plus' },
        _foundry: { blueprint: blueprint.meta.name, provider: 'autoclaw' },
      };
      await writeFile(join(configDir, 'config.json'), JSON.stringify(config, null, 2));
      steps.push(this.step('Config', 'ok', 'AutoClaw config written'));
    } catch (err: unknown) {
      steps.push(this.step('Config', 'error', (err as Error).message));
    }

    return { success: steps.every(s => s.status !== 'error'), steps };
  }

  private async deployViaUsb(blueprint: Blueprint): Promise<DeployResult> {
    const steps = [];
    this.logProvider('deploy', 'Generating USB auto-install package');

    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const usbDir = blueprint.target?.extras?.usbPath || '/Volumes/AUTOCLAW';

      await mkdir(join(usbDir, 'autoclaw'), { recursive: true });

      // Write blueprint + installer script to USB
      await writeFile(join(usbDir, 'autoclaw', 'blueprint.json'), JSON.stringify(blueprint, null, 2));

      const installerScript = `#!/usr/bin/env bash
set -euo pipefail
echo "=== AutoClaw USB Auto-Install ==="
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Install AutoClaw
curl -fsSL https://autoglm.zhipuai.cn/autoclaw/install.sh | bash
# Apply blueprint
autoclaw apply "$SCRIPT_DIR/blueprint.json"
echo "=== Done ==="
`;
      await writeFile(join(usbDir, 'autoclaw', 'install.sh'), installerScript, { mode: 0o755 });

      steps.push(this.step('USB Package', 'ok', `Written to ${usbDir}/autoclaw/`));
      steps.push(this.step('Installer', 'ok', 'Auto-install script generated'));
    } catch (err: unknown) {
      steps.push(this.step('USB Package', 'error', (err as Error).message));
    }

    return { success: steps.every(s => s.status !== 'error'), steps };
  }

  async test(): Promise<TestResult> {
    const check = await this.checkLocalInstall('autoclaw');
    return { success: check.status === 'ok', checks: [check] };
  }

  async repair(blueprint: Blueprint): Promise<ExecutionResult> {
    const r = await this.deploy(blueprint);
    return { success: r.success, steps: r.steps };
  }

  async uninstall(): Promise<ExecutionResult> {
    return { success: true, steps: [this.step('Uninstall', 'warn', 'Run: autoclaw uninstall')] };
  }

  async diagnose(): Promise<DiagnoseResult> {
    const check = await this.checkLocalInstall('autoclaw');
    return { healthy: check.status === 'ok', checks: [check], suggestions: [] };
  }

  getRequirements(): Requirement[] {
    return [
      { name: 'curl', check: 'curl --version', installHint: 'Pre-installed on most systems', required: true },
    ];
  }
}
