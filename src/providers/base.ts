// Base provider with shared logic for all provider types

import type {
  Provider, ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement, StepResult,
} from '../types.js';
import { log } from '../utils.js';
import { executeBlueprintForProvider } from '../executor.js';

export abstract class BaseProvider implements Provider {
  abstract meta: ProviderMeta;

  // Override to true when real API/CLI integration is verified working
  apiReady = false;

  abstract deploy(blueprint: Blueprint): Promise<DeployResult>;
  abstract test(blueprint: Blueprint): Promise<TestResult>;
  abstract repair(blueprint: Blueprint): Promise<ExecutionResult>;
  abstract uninstall(options: { keepConfig?: boolean; keepMemory?: boolean; dryRun?: boolean }): Promise<ExecutionResult>;
  abstract diagnose(): Promise<DiagnoseResult>;
  abstract getRequirements(): Requirement[];

  /** Guard: if not apiReady, return actionable error with console URL */
  protected checkApiReady(): DeployResult | null {
    if (this.apiReady) return null;
    return {
      success: false,
      steps: [this.step('API', 'error',
        `${this.meta.name} API not yet integrated — use ${this.meta.consoleUrl} manually` +
        (this.meta.installCmd ? ` or install via: ${this.meta.installCmd}` : ''))],
    };
  }

  /** Check if real API credentials are configured for this provider */
  protected hasCredentials(blueprint: Blueprint): boolean {
    const creds = blueprint.target?.credentials;
    return !!(creds?.accessKeyId && creds?.accessKeySecret) || !!(creds?.token);
  }

  /** Real local deploy — writes files to ~/.{providerId}/ using universal executor */
  protected async realLocalDeploy(blueprint: Blueprint): Promise<DeployResult> {
    const result = await executeBlueprintForProvider(blueprint, {
      providerId: this.meta.id,
      providerName: this.meta.name,
      cliCommand: this.getCliCommand(),
      consoleUrl: this.meta.consoleUrl,
      imChannels: this.meta.imChannels,
    });
    return { success: result.success, steps: result.steps };
  }

  /** Real local test — verifies deployed files exist and are valid */
  protected async realLocalTest(_blueprint: Blueprint): Promise<TestResult> {
    const { access } = await import('fs/promises');
    const { join } = await import('path');
    const home = join(process.env.HOME || process.env.USERPROFILE || '~', `.${this.meta.id}`);
    const checks: StepResult[] = [];

    // Check home dir exists
    try {
      await access(home);
      checks.push(this.step('Home Dir', 'ok', home));
    } catch {
      checks.push(this.step('Home Dir', 'error', `${home} not found — run deploy first`));
      return { success: false, checks };
    }

    // Check identity files
    for (const f of ['IDENTITY.md', 'SOUL.md']) {
      try {
        await access(join(home, f));
        checks.push(this.step(f, 'ok', 'Present'));
      } catch {
        checks.push(this.step(f, 'warn', 'Missing'));
      }
    }

    // Check config file
    const configFile = `${this.meta.id}.json`;
    try {
      const { readFile } = await import('fs/promises');
      const raw = await readFile(join(home, configFile), 'utf-8');
      const cfg = JSON.parse(raw);
      checks.push(this.step('Config', 'ok',
        `${configFile} (provider: ${cfg.provider}, routing: ${cfg.model?.routing || 'unknown'})`));
    } catch {
      checks.push(this.step('Config', 'warn', `${configFile} missing or invalid`));
    }

    // Check manifest
    try {
      await access(join(home, '.foundry-manifest.json'));
      checks.push(this.step('Manifest', 'ok', 'Foundry manifest present'));
    } catch {
      checks.push(this.step('Manifest', 'warn', 'No manifest'));
    }

    // Check IM channel configs
    if (this.meta.imChannels.length > 0) {
      const imDir = join(home, 'im');
      try {
        await access(imDir);
        const { readdir, readFile } = await import('fs/promises');
        const files = await readdir(imDir);
        const channelFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_'));
        let pending = 0;
        for (const f of channelFiles) {
          try {
            const raw = await readFile(join(imDir, f), 'utf-8');
            const cfg = JSON.parse(raw);
            if (cfg.status === 'pending_setup') pending++;
          } catch { /* skip */ }
        }
        if (pending > 0) {
          checks.push(this.step('IM Channels', 'warn',
            `${channelFiles.length} configs, ${pending} pending token setup`));
        } else {
          checks.push(this.step('IM Channels', 'ok',
            `${channelFiles.length} channel configs present`));
        }
      } catch {
        checks.push(this.step('IM Channels', 'error', 'IM config directory missing — redeploy'));
      }
    }

    const passed = checks.filter(c => c.status === 'ok').length;
    return { success: passed >= checks.length / 2, checks };
  }

  /** Override in subclass if provider has a CLI tool */
  protected getCliCommand(): string | undefined {
    return undefined;
  }

  async isAvailable(): Promise<boolean> {
    const reqs = this.getRequirements().filter(r => r.required);
    for (const req of reqs) {
      try {
        const { execa } = await import('execa');
        await execa('sh', ['-c', req.check], { timeout: 10_000 });
      } catch {
        return false;
      }
    }
    return true;
  }

  protected step(name: string, status: 'ok' | 'warn' | 'error', message: string): StepResult {
    return { name, status, message };
  }

  protected logProvider(action: string, detail: string): void {
    log.note(`[${this.meta.id}] ${action}: ${detail}`);
  }
}

// Cloud providers share common patterns: API auth, instance provisioning, health polling
export abstract class CloudProvider extends BaseProvider {
  protected async checkApiAccess(blueprint: Blueprint): Promise<StepResult> {
    const creds = blueprint.target?.credentials;
    if (!creds?.accessKeyId || !creds?.accessKeySecret) {
      return this.step('API Auth', 'error', `${this.meta.vendor} credentials not provided`);
    }
    return this.step('API Auth', 'ok', `${this.meta.vendor} credentials present`);
  }

  protected getEndpoint(blueprint: Blueprint): string {
    return blueprint.target?.credentials?.endpoint || this.meta.consoleUrl;
  }

  protected async checkApiHealth(url: string): Promise<StepResult> {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (resp.ok) return this.step('API Health', 'ok', `${url} reachable`);
      return this.step('API Health', 'warn', `${url} returned ${resp.status}`);
    } catch {
      return this.step('API Health', 'error', `${url} unreachable`);
    }
  }
}

// Desktop providers install locally via package manager or binary
export abstract class DesktopProvider extends BaseProvider {
  protected async checkLocalInstall(binary: string): Promise<StepResult> {
    try {
      const { execa } = await import('execa');
      const { stdout } = await execa(binary, ['--version'], { timeout: 5_000 });
      return this.step(binary, 'ok', stdout.trim());
    } catch {
      return this.step(binary, 'error', `${binary} not found`);
    }
  }
}

// SaaS providers interact via hosted API
export abstract class SaaSProvider extends BaseProvider {
  protected async checkApiHealth(url: string): Promise<StepResult> {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (resp.ok) return this.step('API Health', 'ok', `${url} reachable`);
      return this.step('API Health', 'warn', `${url} returned ${resp.status}`);
    } catch {
      return this.step('API Health', 'error', `${url} unreachable`);
    }
  }
}

// Mobile providers push config to device
export abstract class MobileProvider extends BaseProvider {
  protected async checkDeviceConnection(tool: string): Promise<StepResult> {
    try {
      const { execa } = await import('execa');
      await execa(tool, ['devices'], { timeout: 5_000 });
      return this.step('Device', 'ok', `${tool} connected`);
    } catch {
      return this.step('Device', 'error', `No device connected via ${tool}`);
    }
  }
}
