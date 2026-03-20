// Base provider with shared logic for all provider types

import type {
  Provider, ProviderMeta, Blueprint, DeployResult, TestResult,
  ExecutionResult, DiagnoseResult, Requirement, StepResult,
} from '../types.js';
import { log } from '../utils.js';

export abstract class BaseProvider implements Provider {
  abstract meta: ProviderMeta;

  // Override to true when real API integration is implemented
  apiReady = false;

  abstract deploy(blueprint: Blueprint): Promise<DeployResult>;
  abstract test(blueprint: Blueprint): Promise<TestResult>;
  abstract repair(blueprint: Blueprint): Promise<ExecutionResult>;
  abstract uninstall(options: { keepConfig?: boolean; keepMemory?: boolean; dryRun?: boolean }): Promise<ExecutionResult>;
  abstract diagnose(): Promise<DiagnoseResult>;
  abstract getRequirements(): Requirement[];

  /** Guard: call at the top of deploy() for providers without real API integration */
  protected checkApiReady(): DeployResult | null {
    if (!this.apiReady) {
      return {
        success: false,
        steps: [
          this.step('API Integration', 'error',
            `${this.meta.name} provider API not yet integrated. ` +
            `Manual setup: ${this.meta.consoleUrl}`),
          this.step('Workaround', 'warn',
            `Export blueprint with "ocf export" and manually configure at ${this.meta.consoleUrl}`),
        ],
      };
    }
    return null;
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
