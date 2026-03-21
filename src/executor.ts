import { execa } from 'execa';
import { writeFile, mkdir, readFile, access, symlink, unlink, rm, readdir, lstat } from 'fs/promises';
import { join } from 'path';
import type { Blueprint, ExecutionResult, StepResult, Manifest, Snapshot } from './types.js';
import { MAX_SNAPSHOTS } from './types.js';
import { SOUL_TEMPLATES } from './analyzer.js';
import { log, spinner } from './utils.js';
import chalk from 'chalk';
import { provisionIMBot, provisionModelAPIKey } from './auto-provision.js';

const HOME = process.env.HOME || process.env.USERPROFILE || '~';
const OPENCLAW_HOME = join(HOME, '.openclaw');
const AIFLEET_ROOT  = process.env.AIFLEET_ROOT || join(HOME, '00-AI-Fleet');
const AIFLEET_SKILLS = join(AIFLEET_ROOT, '.claude', 'skills');
const MANIFEST_PATH = join(OPENCLAW_HOME, '.foundry-manifest.json');
const SNAPSHOTS_DIR = join(OPENCLAW_HOME, '.snapshots');

// ===== Snapshot helpers =====

async function captureSnapshot(trigger: Snapshot['trigger']): Promise<Snapshot | null> {
  try {
    const now = new Date();
    const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
    const id = `snap-${ts}`;

    const manifest = await loadManifest();
    const configJson = await readFile(join(OPENCLAW_HOME, 'openclaw.json'), 'utf-8').catch(() => '{}');
    const identityMd = await readFile(join(OPENCLAW_HOME, 'IDENTITY.md'), 'utf-8').catch(() => '');
    const soulMd = await readFile(join(OPENCLAW_HOME, 'SOUL.md'), 'utf-8').catch(() => '');

    // Capture agent file contents
    const agents: Record<string, string> = {};
    try {
      const agentsDir = join(OPENCLAW_HOME, 'agents');
      const entries = await readdir(agentsDir);
      for (const f of entries.filter(e => e.endsWith('.json'))) {
        agents[f] = await readFile(join(agentsDir, f), 'utf-8');
      }
    } catch { /* no agents dir */ }

    const snapshot: Snapshot = {
      id,
      created: now.toISOString(),
      trigger,
      manifest,
      configJson,
      identityMd,
      soulMd,
      agents,
    };

    await mkdir(SNAPSHOTS_DIR, { recursive: true });
    await writeFile(join(SNAPSHOTS_DIR, `${id}.json`), JSON.stringify(snapshot, null, 2));

    // Rotate: keep only MAX_SNAPSHOTS
    const files = (await readdir(SNAPSHOTS_DIR)).filter(f => f.startsWith('snap-') && f.endsWith('.json')).sort();
    if (files.length > MAX_SNAPSHOTS) {
      const toDelete = files.slice(0, files.length - MAX_SNAPSHOTS);
      for (const f of toDelete) {
        await rm(join(SNAPSHOTS_DIR, f), { force: true });
      }
    }

    return snapshot;
  } catch {
    return null;
  }
}

export async function listSnapshots(): Promise<{ id: string; created: string; trigger: string }[]> {
  try {
    const files = (await readdir(SNAPSHOTS_DIR)).filter(f => f.startsWith('snap-') && f.endsWith('.json')).sort().reverse();
    const result: { id: string; created: string; trigger: string }[] = [];
    for (const f of files) {
      const raw = await readFile(join(SNAPSHOTS_DIR, f), 'utf-8');
      const snap = JSON.parse(raw) as Snapshot;
      result.push({ id: snap.id, created: snap.created, trigger: snap.trigger });
    }
    return result;
  } catch {
    return [];
  }
}

async function loadSnapshot(id: string): Promise<Snapshot | null> {
  try {
    const raw = await readFile(join(SNAPSHOTS_DIR, `${id}.json`), 'utf-8');
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

// ===== Manifest helpers =====

async function loadManifest(): Promise<Manifest | null> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}

async function saveManifest(manifest: Manifest): Promise<void> {
  await mkdir(OPENCLAW_HOME, { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function buildManifest(blueprint: Blueprint): Manifest {
  const now = new Date().toISOString().slice(0, 19) + 'Z';
  const files: string[] = [
    join(OPENCLAW_HOME, 'IDENTITY.md'),
    join(OPENCLAW_HOME, 'SOUL.md'),
    join(OPENCLAW_HOME, 'openclaw.json'),
  ];
  for (const agent of blueprint.agents) {
    files.push(join(OPENCLAW_HOME, 'agents', `${agent.name}.json`));
  }
  for (const id of blueprint.skills.fromAifleet) {
    files.push(join(OPENCLAW_HOME, 'skills', id));
  }

  return {
    version: '1.0',
    created: now,
    updated: now,
    blueprint: {
      name: blueprint.meta.name,
      profile: blueprint.meta.profile,
      role: blueprint.identity.role,
    },
    files,
    directories: [
      OPENCLAW_HOME,
      join(OPENCLAW_HOME, 'skills'),
      join(OPENCLAW_HOME, 'agents'),
      join(OPENCLAW_HOME, 'memory'),
    ],
    skills: {
      aifleet: [...blueprint.skills.fromAifleet],
      clawhub: [...blueprint.skills.fromClawhub],
    },
    agents: blueprint.agents.map(a => `${a.name}.json`),
    config: {
      autonomy: blueprint.config.autonomy,
      modelRouting: blueprint.config.modelRouting,
      memoryChunks: blueprint.config.memoryChunks,
    },
  };
}

// ===== P1: Execute a Blueprint (full cold-boot install) =====

export async function executeBlueprint(blueprint: Blueprint): Promise<ExecutionResult> {
  const steps: StepResult[] = [];
  const hasLlm = blueprint.llm.mode !== 'skip';
  const total = hasLlm ? 9 : 8; // +1 for manifest
  let n = 0;

  console.log('');
  console.log(chalk.bold('--- Executing Blueprint ---'));
  console.log(chalk.dim(`Target: ${blueprint.meta.name}`));
  console.log('');

  // 0. Snapshot current state before changes
  const existingManifest = await loadManifest();
  if (existingManifest) {
    const snap = await captureSnapshot('install');
    if (snap) log.note(`Snapshot saved: ${snap.id} (rollback available)`);
  }

  // 1. Prerequisites
  steps.push(await run(++n, total, 'Prerequisites', () => checkPrereqs()));
  if (steps.at(-1)!.status === 'error') return { success: false, steps };

  // 2. OpenClaw
  steps.push(await run(++n, total, 'OpenClaw install', () => installOpenClaw(blueprint)));

  // 3. Identity
  steps.push(await run(++n, total, 'Identity files', () => generateIdentity(blueprint)));

  // 4. Skills
  steps.push(await run(++n, total, 'Skills', () => installSkills(blueprint)));

  // 5. Agents
  steps.push(await run(++n, total, 'Agents', () => configureAgents(blueprint)));

  // 6. Config
  steps.push(await run(++n, total, 'Configuration', () => applyConfig(blueprint)));

  // 7. LLM setup (if configured)
  if (hasLlm) {
    steps.push(await run(++n, total, 'LLM config', () => configureLlm(blueprint)));
  }

  // 8. Manifest
  steps.push(await run(++n, total, 'Manifest', async () => {
    try {
      const manifest = buildManifest(blueprint);
      await saveManifest(manifest);
      return { name: 'Manifest', status: 'ok', message: `Recorded ${manifest.files.length} files` };
    } catch (e: unknown) {
      return { name: 'Manifest', status: 'warn', message: (e as Error).message };
    }
  }));

  // 9. Verify
  steps.push(await run(++n, total, 'Verification', () => verify()));

  const success = steps.every(s => s.status !== 'error');
  console.log('');
  console.log(chalk.bold('--- Summary ---'));
  for (const s of steps) {
    const tag = s.status === 'ok' ? chalk.green('OK')
      : s.status === 'warn' ? chalk.yellow('WARN') : chalk.red('ERROR');
    console.log(`  ${tag} ${s.name}: ${s.message}`);
  }
  console.log('');
  success ? log.ok('Blueprint executed successfully!') : log.error('Completed with errors.');
  return { success, steps };
}

// ===== Uninstall: remove Foundry-managed files =====

export interface UninstallOptions {
  keepConfig?: boolean;
  keepMemory?: boolean;
  dryRun?: boolean;
}

export async function uninstallFoundry(opts: UninstallOptions = {}): Promise<ExecutionResult> {
  const steps: StepResult[] = [];

  console.log('');
  console.log(chalk.bold('--- Uninstalling OpenClaw Foundry ---'));
  console.log('');

  const manifest = await loadManifest();
  if (!manifest) {
    log.warn('No manifest found — falling back to standard paths');
  }

  const removed: string[] = [];
  const skipped: string[] = [];

  // 1. Remove skills (symlinks from AI-Fleet + ClawHub installs)
  const skillsDir = join(OPENCLAW_HOME, 'skills');
  const skillIds = manifest
    ? [...manifest.skills.aifleet, ...manifest.skills.clawhub]
    : [];

  if (skillIds.length > 0) {
    for (const id of skillIds) {
      const p = join(skillsDir, id);
      try {
        if (opts.dryRun) { removed.push(`[dry-run] ${p}`); continue; }
        const stat = await lstat(p);
        if (stat.isSymbolicLink()) {
          await unlink(p);
        } else {
          await rm(p, { recursive: true, force: true });
        }
        removed.push(p);
      } catch { skipped.push(p); }
    }
    steps.push({ name: 'Skills', status: 'ok', message: `${removed.length} removed` });
  } else {
    // No manifest — remove all skills
    try {
      const entries = await readdir(skillsDir);
      for (const e of entries) {
        const p = join(skillsDir, e);
        if (opts.dryRun) { removed.push(`[dry-run] ${p}`); continue; }
        const stat = await lstat(p);
        if (stat.isSymbolicLink()) await unlink(p);
        else await rm(p, { recursive: true, force: true });
        removed.push(p);
      }
      steps.push({ name: 'Skills', status: 'ok', message: `${removed.length} removed (no manifest)` });
    } catch {
      steps.push({ name: 'Skills', status: 'warn', message: 'No skills directory' });
    }
  }

  // 2. Remove agents
  const agentsDir = join(OPENCLAW_HOME, 'agents');
  const agentFiles = manifest
    ? manifest.agents
    : await readdir(agentsDir).catch(() => [] as string[]);
  let agentCount = 0;
  for (const f of agentFiles) {
    const p = join(agentsDir, f);
    try {
      if (opts.dryRun) { removed.push(`[dry-run] ${p}`); agentCount++; continue; }
      await rm(p, { force: true });
      removed.push(p);
      agentCount++;
    } catch { /* skip */ }
  }
  steps.push({ name: 'Agents', status: 'ok', message: `${agentCount} removed` });

  // 3. Remove identity files
  for (const f of ['IDENTITY.md', 'SOUL.md']) {
    const p = join(OPENCLAW_HOME, f);
    try {
      if (opts.dryRun) { removed.push(`[dry-run] ${p}`); continue; }
      await rm(p, { force: true });
      removed.push(p);
    } catch { /* skip */ }
  }
  steps.push({ name: 'Identity', status: 'ok', message: 'IDENTITY.md + SOUL.md removed' });

  // 4. Config (optional keep)
  if (opts.keepConfig) {
    steps.push({ name: 'Config', status: 'ok', message: 'Kept (--keep-config)' });
  } else {
    const cfgPath = join(OPENCLAW_HOME, 'openclaw.json');
    try {
      if (!opts.dryRun) await rm(cfgPath, { force: true });
      removed.push(opts.dryRun ? `[dry-run] ${cfgPath}` : cfgPath);
      steps.push({ name: 'Config', status: 'ok', message: 'openclaw.json removed' });
    } catch {
      steps.push({ name: 'Config', status: 'warn', message: 'openclaw.json not found' });
    }
  }

  // 5. Memory (optional keep)
  if (opts.keepMemory) {
    steps.push({ name: 'Memory', status: 'ok', message: 'Kept (--keep-memory)' });
  } else {
    const memDir = join(OPENCLAW_HOME, 'memory');
    try {
      if (!opts.dryRun) await rm(memDir, { recursive: true, force: true });
      steps.push({ name: 'Memory', status: 'ok', message: 'Memory cleared' });
    } catch {
      steps.push({ name: 'Memory', status: 'warn', message: 'No memory directory' });
    }
  }

  // 6. Remove manifest itself
  if (!opts.dryRun) {
    try { await rm(MANIFEST_PATH, { force: true }); } catch { /* ok */ }
  }

  // 7. Write audit log
  if (!opts.dryRun) {
    await appendAuditLog('uninstall', { removed: removed.length, skipped: skipped.length, keepConfig: opts.keepConfig, keepMemory: opts.keepMemory });
  }

  // Summary
  console.log('');
  console.log(chalk.bold('--- Summary ---'));
  for (const s of steps) {
    const tag = s.status === 'ok' ? chalk.green('OK')
      : s.status === 'warn' ? chalk.yellow('WARN') : chalk.red('ERROR');
    console.log(`  ${tag} ${s.name}: ${s.message}`);
  }
  console.log('');

  if (opts.dryRun) {
    log.note(`Dry run — would remove ${removed.length} items`);
    for (const r of removed) console.log(`  ${chalk.dim(r)}`);
  } else {
    log.ok(`Uninstall complete: ${removed.length} items removed`);
  }

  return { success: true, steps };
}

// ===== Repair: diagnose and auto-fix =====

export interface RepairOptions {
  component?: 'skills' | 'agents' | 'config' | 'identity' | 'all';
  dryRun?: boolean;
}

export async function repairFoundry(opts: RepairOptions = {}): Promise<ExecutionResult> {
  const steps: StepResult[] = [];
  const component = opts.component || 'all';
  let fixed = 0;

  console.log('');
  console.log(chalk.bold('--- Repairing OpenClaw Foundry ---'));
  console.log('');

  const manifest = await loadManifest();
  if (!manifest) {
    log.error('No manifest found. Cannot repair without manifest.');
    log.note('Run "ocf init" to install first, or re-run the original blueprint.');
    return { success: false, steps: [{ name: 'Manifest', status: 'error', message: 'Not found — repair requires prior Foundry install' }] };
  }

  log.note(`Blueprint: ${manifest.blueprint.name} (role: ${manifest.blueprint.role})`);
  console.log('');

  // 1. Directories
  if (component === 'all' || component === 'config') {
    for (const dir of manifest.directories) {
      try {
        await access(dir);
      } catch {
        if (!opts.dryRun) await mkdir(dir, { recursive: true });
        fixed++;
        steps.push({ name: 'Directory', status: 'ok', message: `Recreated ${dir}` });
      }
    }
  }

  // 2. Identity files
  if (component === 'all' || component === 'identity') {
    for (const f of ['IDENTITY.md', 'SOUL.md']) {
      const p = join(OPENCLAW_HOME, f);
      try {
        await access(p);
        steps.push({ name: f, status: 'ok', message: 'Present' });
      } catch {
        if (!opts.dryRun) {
          if (f === 'IDENTITY.md') {
            const content = `# Identity\n\nRole: ${manifest.blueprint.role}\nSetup: OpenClaw Foundry\nProfile: ${manifest.blueprint.profile || 'custom'}\n`;
            await writeFile(p, content);
          } else {
            const template = manifest.blueprint.role || 'fullstack-developer';
            const soulText = SOUL_TEMPLATES[template] || SOUL_TEMPLATES['fullstack-developer'] || 'You are a skilled professional.';
            await writeFile(p, `# Soul\n\n${soulText}\n\n## Core Values\n- Quality over speed\n- Clarity over cleverness\n- Evidence over opinion\n`);
          }
        }
        fixed++;
        steps.push({ name: f, status: 'ok', message: `Regenerated${opts.dryRun ? ' (dry-run)' : ''}` });
      }
    }
  }

  // 3. Skills
  if (component === 'all' || component === 'skills') {
    const skillsDir = join(OPENCLAW_HOME, 'skills');
    await mkdir(skillsDir, { recursive: true });

    let missing = 0;
    let present = 0;

    // Check AI-Fleet symlinks
    for (const id of manifest.skills.aifleet) {
      const dest = join(skillsDir, id);
      try {
        await access(dest);
        present++;
      } catch {
        // Symlink broken or missing — try to re-link
        const src = join(AIFLEET_SKILLS, id);
        try {
          await access(src);
          if (!opts.dryRun) {
            try { await unlink(dest); } catch { /* ok */ }
            await symlink(src, dest, 'dir');
          }
          fixed++;
          missing++;
        } catch {
          steps.push({ name: `Skill: ${id}`, status: 'warn', message: 'Source not found in AI-Fleet' });
        }
      }
    }

    // Check ClawHub installs
    for (const id of manifest.skills.clawhub) {
      const dest = join(skillsDir, id);
      try {
        await access(dest);
        present++;
      } catch {
        if (!opts.dryRun) {
          try {
            await execa('openclaw', ['skills', 'install', id], { timeout: 30_000 });
            fixed++;
            missing++;
          } catch {
            steps.push({ name: `Skill: ${id}`, status: 'warn', message: 'ClawHub reinstall failed' });
          }
        } else {
          missing++;
        }
      }
    }

    const total = manifest.skills.aifleet.length + manifest.skills.clawhub.length;
    steps.push({
      name: 'Skills',
      status: missing > 0 ? 'ok' : 'ok',
      message: missing > 0
        ? `${missing} repaired, ${present} already present (${total} total)`
        : `All ${present} present`,
    });
  }

  // 4. Agents
  if (component === 'all' || component === 'agents') {
    const agentsDir = join(OPENCLAW_HOME, 'agents');
    await mkdir(agentsDir, { recursive: true });

    let agentMissing = 0;
    for (const f of manifest.agents) {
      const p = join(agentsDir, f);
      try {
        await access(p);
      } catch {
        agentMissing++;
        // Cannot fully regenerate agent content without blueprint, but can create stub
        if (!opts.dryRun) {
          const name = f.replace('.json', '');
          await writeFile(p, JSON.stringify({ name, role: 'agent', jobs: [] }, null, 2));
          fixed++;
        }
        steps.push({ name: `Agent: ${f}`, status: 'warn', message: 'Regenerated as stub — re-run blueprint for full config' });
      }
    }
    if (agentMissing === 0) {
      steps.push({ name: 'Agents', status: 'ok', message: `All ${manifest.agents.length} present` });
    }
  }

  // 5. Config
  if (component === 'all' || component === 'config') {
    const cfgPath = join(OPENCLAW_HOME, 'openclaw.json');
    try {
      const raw = await readFile(cfgPath, 'utf-8');
      JSON.parse(raw); // validate JSON
      steps.push({ name: 'Config', status: 'ok', message: 'openclaw.json valid' });
    } catch {
      if (!opts.dryRun) {
        const cfg = {
          autonomy: { level: manifest.config.autonomy },
          model: { routing: manifest.config.modelRouting },
          memory: { chunks: manifest.config.memoryChunks },
          _foundry: {
            blueprint: manifest.blueprint.name,
            profile: manifest.blueprint.profile,
            repaired: new Date().toISOString(),
          },
        };
        await writeFile(cfgPath, JSON.stringify(cfg, null, 2));
        fixed++;
      }
      steps.push({ name: 'Config', status: 'ok', message: `Regenerated${opts.dryRun ? ' (dry-run)' : ''}` });
    }
  }

  // Update manifest timestamp
  if (!opts.dryRun && fixed > 0) {
    manifest.updated = new Date().toISOString().slice(0, 19) + 'Z';
    await saveManifest(manifest);
    await appendAuditLog('repair', { fixed, component });
  }

  // Summary
  console.log('');
  console.log(chalk.bold('--- Summary ---'));
  for (const s of steps) {
    const tag = s.status === 'ok' ? chalk.green('OK')
      : s.status === 'warn' ? chalk.yellow('WARN') : chalk.red('ERROR');
    console.log(`  ${tag} ${s.name}: ${s.message}`);
  }
  console.log('');

  if (fixed > 0) {
    log.ok(`Repair complete: ${fixed} issue(s) fixed${opts.dryRun ? ' (dry-run)' : ''}`);
  } else {
    log.ok('All checks passed — nothing to repair');
  }

  return { success: true, steps };
}

// ===== Rollback: restore from snapshot =====

export async function rollbackFoundry(snapshotId?: string): Promise<ExecutionResult> {
  const steps: StepResult[] = [];

  console.log('');
  console.log(chalk.bold('--- Rolling Back OpenClaw Foundry ---'));
  console.log('');

  // Find snapshot
  let snapshot: Snapshot | null;
  if (snapshotId) {
    snapshot = await loadSnapshot(snapshotId);
    if (!snapshot) {
      log.error(`Snapshot "${snapshotId}" not found`);
      const available = await listSnapshots();
      if (available.length) {
        log.note('Available snapshots:');
        for (const s of available) console.log(`  ${s.id}  ${s.created}  (${s.trigger})`);
      }
      return { success: false, steps: [{ name: 'Snapshot', status: 'error', message: 'Not found' }] };
    }
  } else {
    // Use latest
    const available = await listSnapshots();
    if (!available.length) {
      log.error('No snapshots available. Nothing to roll back to.');
      return { success: false, steps: [{ name: 'Snapshot', status: 'error', message: 'No snapshots' }] };
    }
    snapshot = await loadSnapshot(available[0].id);
    if (!snapshot) {
      return { success: false, steps: [{ name: 'Snapshot', status: 'error', message: 'Failed to load' }] };
    }
  }

  log.note(`Restoring snapshot: ${snapshot.id} (${snapshot.trigger}, ${snapshot.created})`);

  // Take a pre-rollback snapshot for safety
  const preSnap = await captureSnapshot('manual');
  if (preSnap) log.note(`Pre-rollback snapshot: ${preSnap.id}`);

  // 1. Restore config
  try {
    await writeFile(join(OPENCLAW_HOME, 'openclaw.json'), snapshot.configJson);
    steps.push({ name: 'Config', status: 'ok', message: 'Restored' });
  } catch (e: unknown) {
    steps.push({ name: 'Config', status: 'error', message: (e as Error).message });
  }

  // 2. Restore identity
  if (snapshot.identityMd) {
    await writeFile(join(OPENCLAW_HOME, 'IDENTITY.md'), snapshot.identityMd);
    steps.push({ name: 'IDENTITY.md', status: 'ok', message: 'Restored' });
  }
  if (snapshot.soulMd) {
    await writeFile(join(OPENCLAW_HOME, 'SOUL.md'), snapshot.soulMd);
    steps.push({ name: 'SOUL.md', status: 'ok', message: 'Restored' });
  }

  // 3. Restore agents
  const agentsDir = join(OPENCLAW_HOME, 'agents');
  await mkdir(agentsDir, { recursive: true });
  // Clear current agents
  try {
    const current = await readdir(agentsDir);
    for (const f of current.filter(e => e.endsWith('.json'))) {
      await rm(join(agentsDir, f), { force: true });
    }
  } catch { /* ok */ }
  // Write snapshot agents
  let agentCount = 0;
  for (const [filename, content] of Object.entries(snapshot.agents)) {
    await writeFile(join(agentsDir, filename), content);
    agentCount++;
  }
  steps.push({ name: 'Agents', status: 'ok', message: `${agentCount} restored` });

  // 4. Restore skills based on manifest
  if (snapshot.manifest) {
    const skillsDir = join(OPENCLAW_HOME, 'skills');
    // Remove current Foundry-managed skills
    try {
      const currentSkills = await readdir(skillsDir);
      for (const s of currentSkills) {
        const p = join(skillsDir, s);
        const stat = await lstat(p);
        if (stat.isSymbolicLink()) await unlink(p);
        else await rm(p, { recursive: true, force: true });
      }
    } catch { /* ok */ }

    // Re-link AI-Fleet skills from snapshot manifest
    let linked = 0;
    for (const id of snapshot.manifest.skills.aifleet) {
      const src = join(AIFLEET_SKILLS, id);
      const dest = join(skillsDir, id);
      try {
        await access(src);
        await symlink(src, dest, 'dir');
        linked++;
      } catch { /* source missing */ }
    }

    // Re-install ClawHub skills
    let installed = 0;
    for (const id of snapshot.manifest.skills.clawhub) {
      try {
        await execa('openclaw', ['skills', 'install', id], { timeout: 30_000 });
        installed++;
      } catch { /* skip */ }
    }

    steps.push({ name: 'Skills', status: 'ok', message: `${linked} linked + ${installed} installed` });

    // Restore manifest
    await saveManifest(snapshot.manifest);
    steps.push({ name: 'Manifest', status: 'ok', message: 'Restored' });
  } else {
    steps.push({ name: 'Skills', status: 'warn', message: 'No manifest in snapshot — skills unchanged' });
  }

  await appendAuditLog('rollback', { snapshotId: snapshot.id, trigger: snapshot.trigger });

  // Summary
  console.log('');
  console.log(chalk.bold('--- Summary ---'));
  for (const s of steps) {
    const tag = s.status === 'ok' ? chalk.green('OK')
      : s.status === 'warn' ? chalk.yellow('WARN') : chalk.red('ERROR');
    console.log(`  ${tag} ${s.name}: ${s.message}`);
  }
  console.log('');
  log.ok(`Rolled back to ${snapshot.id}`);
  return { success: true, steps };
}

// ===== Upgrade: refresh skills and config =====

export interface UpgradeOptions {
  serverUrl?: string;
  skillsOnly?: boolean;
  configOnly?: boolean;
  dryRun?: boolean;
}

export async function upgradeFoundry(opts: UpgradeOptions = {}): Promise<ExecutionResult> {
  const steps: StepResult[] = [];

  console.log('');
  console.log(chalk.bold('--- Upgrading OpenClaw Foundry ---'));
  console.log('');

  const manifest = await loadManifest();
  if (!manifest) {
    log.error('No manifest found. Run "ocf init" first.');
    return { success: false, steps: [{ name: 'Manifest', status: 'error', message: 'Not found' }] };
  }

  log.note(`Current: ${manifest.blueprint.name} (role: ${manifest.blueprint.role})`);

  // Take snapshot before upgrade
  const snap = await captureSnapshot('upgrade');
  if (snap) {
    log.note(`Snapshot saved: ${snap.id}`);
    steps.push({ name: 'Snapshot', status: 'ok', message: snap.id });
  }

  const skillsDir = join(OPENCLAW_HOME, 'skills');

  // --- Skills upgrade ---
  if (!opts.configOnly) {
    // Scan current skills
    let currentSkillIds: string[] = [];
    try {
      currentSkillIds = await readdir(skillsDir);
    } catch { /* empty */ }

    // Check AI-Fleet skills: verify symlinks still valid
    let repaired = 0;
    let removed = 0;
    for (const id of manifest.skills.aifleet) {
      const dest = join(skillsDir, id);
      try {
        const stat = await lstat(dest);
        if (stat.isSymbolicLink()) {
          // Check if target still exists
          try {
            await access(dest);
          } catch {
            // Broken symlink — try to re-link
            if (!opts.dryRun) {
              await unlink(dest);
              const src = join(AIFLEET_SKILLS, id);
              try {
                await access(src);
                await symlink(src, dest, 'dir');
                repaired++;
              } catch {
                removed++;
              }
            } else {
              repaired++;
            }
          }
        }
      } catch {
        // Missing entirely — re-link
        const src = join(AIFLEET_SKILLS, id);
        try {
          await access(src);
          if (!opts.dryRun) await symlink(src, dest, 'dir');
          repaired++;
        } catch { removed++; }
      }
    }

    // Discover new AI-Fleet skills not in manifest
    let newSkills: string[] = [];
    try {
      const allAifleetSkills = await readdir(AIFLEET_SKILLS);
      const manifestSet = new Set(manifest.skills.aifleet);
      newSkills = allAifleetSkills.filter(s => !manifestSet.has(s) && !currentSkillIds.includes(s));
    } catch { /* skip */ }

    steps.push({
      name: 'Skills',
      status: 'ok',
      message: [
        repaired > 0 ? `${repaired} repaired` : null,
        removed > 0 ? `${removed} removed (source missing)` : null,
        newSkills.length > 0 ? `${newSkills.length} new available` : null,
        repaired === 0 && removed === 0 && newSkills.length === 0 ? 'All up to date' : null,
      ].filter(Boolean).join(', '),
    });

    // List new skills if any
    if (newSkills.length > 0) {
      log.note('New skills available (not yet installed):');
      for (const s of newSkills.slice(0, 10)) {
        console.log(`  ${chalk.cyan('+')} ${s}`);
      }
      if (newSkills.length > 10) console.log(`  ... and ${newSkills.length - 10} more`);
    }
  }

  // --- Config upgrade ---
  if (!opts.skillsOnly) {
    const cfgPath = join(OPENCLAW_HOME, 'openclaw.json');
    try {
      const raw = await readFile(cfgPath, 'utf-8');
      const cfg = JSON.parse(raw);
      let updated = false;

      // Ensure _foundry metadata exists
      if (!cfg._foundry) {
        cfg._foundry = {
          blueprint: manifest.blueprint.name,
          profile: manifest.blueprint.profile,
          created: manifest.created,
          upgraded: new Date().toISOString(),
        };
        updated = true;
      } else {
        cfg._foundry.upgraded = new Date().toISOString();
        updated = true;
      }

      if (updated && !opts.dryRun) {
        await writeFile(cfgPath, JSON.stringify(cfg, null, 2));
      }
      steps.push({ name: 'Config', status: 'ok', message: updated ? 'Updated' : 'No changes' });
    } catch {
      steps.push({ name: 'Config', status: 'warn', message: 'Could not read config' });
    }
  }

  // Update manifest timestamp
  if (!opts.dryRun) {
    manifest.updated = new Date().toISOString().slice(0, 19) + 'Z';
    await saveManifest(manifest);
    await appendAuditLog('upgrade', { skillsOnly: opts.skillsOnly, configOnly: opts.configOnly, dryRun: opts.dryRun });
  }

  // Summary
  console.log('');
  console.log(chalk.bold('--- Summary ---'));
  for (const s of steps) {
    const tag = s.status === 'ok' ? chalk.green('OK')
      : s.status === 'warn' ? chalk.yellow('WARN') : chalk.red('ERROR');
    console.log(`  ${tag} ${s.name}: ${s.message}`);
  }
  console.log('');
  log.ok(opts.dryRun ? 'Upgrade check complete (dry-run)' : 'Upgrade complete');

  return { success: true, steps };
}

// ===== Audit log =====

async function appendAuditLog(action: string, details: Record<string, unknown>): Promise<void> {
  const logPath = join(OPENCLAW_HOME, 'audit.jsonl');
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    ...details,
  });
  try {
    const { appendFile } = await import('fs/promises');
    await appendFile(logPath, entry + '\n');
  } catch { /* best effort */ }
}

// ===== P3: Export as standalone installer =====

export async function exportBlueprint(blueprint: Blueprint, outputPath: string): Promise<void> {
  blueprint.meta.os === 'win32'
    ? await exportPowerShell(blueprint, outputPath)
    : await exportBash(blueprint, outputPath);
}

// ---------- internal steps ----------

async function run(
  n: number, total: number, label: string,
  fn: () => Promise<StepResult>,
): Promise<StepResult> {
  log.step(n, total, label + '...');
  return fn();
}

async function checkPrereqs(): Promise<StepResult> {
  try {
    const { stdout } = await execa('node', ['--version']);
    const major = parseInt(stdout.replace('v', '').split('.')[0]);
    if (major < 18) return { name: 'Prerequisites', status: 'error', message: `Node.js ${stdout} too old (>=18 required)` };
    await execa('npm', ['--version']);
    return { name: 'Prerequisites', status: 'ok', message: `Node.js ${stdout.trim()}` };
  } catch {
    return { name: 'Prerequisites', status: 'error', message: 'Node.js not found. Install from https://nodejs.org' };
  }
}

async function installOpenClaw(bp: Blueprint): Promise<StepResult> {
  try {
    // Check if claude/openclaw CLI is available
    const { stdout } = await execa('claude', ['--version'], { timeout: 5_000 }).catch(() => ({ stdout: '' }));
    if (stdout) return { name: 'OpenClaw', status: 'ok', message: `Claude CLI found (${stdout.trim()})` };

    // Check npm-installed openclaw
    const ocfCheck = await execa('openclaw', ['--version'], { timeout: 5_000 }).catch(() => ({ stdout: '' }));
    if (ocfCheck.stdout) return { name: 'OpenClaw', status: 'ok', message: `OpenClaw found (${ocfCheck.stdout.trim()})` };

    // Not installed — report as warning, don't attempt global install in server mode
    return { name: 'OpenClaw', status: 'warn', message: 'OpenClaw CLI not found. Install manually: npm i -g @anthropic-ai/claude-code' };
  } catch (e: unknown) {
    return { name: 'OpenClaw', status: 'warn', message: `Check failed: ${(e as Error).message}` };
  }
}

async function generateIdentity(bp: Blueprint): Promise<StepResult> {
  try {
    await mkdir(OPENCLAW_HOME, { recursive: true });

    const identity = `# Identity\n\nRole: ${bp.identity.role}\nSetup: OpenClaw Foundry\nProfile: ${bp.meta.profile || 'custom'}\n`;
    await writeFile(join(OPENCLAW_HOME, 'IDENTITY.md'), identity);

    const template = bp.identity.soulTemplate || 'fullstack-developer';
    const soulText = SOUL_TEMPLATES[template] || SOUL_TEMPLATES['fullstack-developer']!;
    const soul = `# Soul\n\n${soulText}\n\n## Core Values\n- Quality over speed\n- Clarity over cleverness\n- Evidence over opinion\n`;
    await writeFile(join(OPENCLAW_HOME, 'SOUL.md'), soul);

    return { name: 'Identity', status: 'ok', message: 'IDENTITY.md + SOUL.md' };
  } catch (e: unknown) {
    return { name: 'Identity', status: 'error', message: (e as Error).message };
  }
}

async function installSkills(bp: Blueprint): Promise<StepResult> {
  const ok: string[] = [];
  const fail: string[] = [];
  const skillsDir = join(OPENCLAW_HOME, 'skills');
  await mkdir(skillsDir, { recursive: true });

  // AI-Fleet: symlink
  for (const id of bp.skills.fromAifleet) {
    try {
      const src = join(AIFLEET_SKILLS, id);
      const dest = join(skillsDir, id);
      await access(src);                       // source must exist
      try { await access(dest); ok.push(id); continue; } catch { /* not yet linked */ }
      await symlink(src, dest, 'dir');
      ok.push(id);
    } catch { fail.push(id); }
  }

  // ClawHub: openclaw CLI install
  for (const id of bp.skills.fromClawhub) {
    try {
      await execa('openclaw', ['skills', 'install', id], { timeout: 30_000 });
      ok.push(id);
    } catch { fail.push(id); }
  }

  const msg = `${ok.length} installed` + (fail.length ? `, ${fail.length} failed: ${fail.join(', ')}` : '');
  return { name: 'Skills', status: fail.length ? 'warn' : 'ok', message: msg };
}

async function configureAgents(bp: Blueprint): Promise<StepResult> {
  try {
    const dir = join(OPENCLAW_HOME, 'agents');
    await mkdir(dir, { recursive: true });
    for (const agent of bp.agents) {
      await writeFile(join(dir, `${agent.name}.json`), JSON.stringify(agent, null, 2));
    }
    return { name: 'Agents', status: 'ok', message: `${bp.agents.length} agent(s)` };
  } catch (e: unknown) {
    return { name: 'Agents', status: 'error', message: (e as Error).message };
  }
}

async function applyConfig(bp: Blueprint): Promise<StepResult> {
  try {
    const cfgPath = join(OPENCLAW_HOME, 'openclaw.json');
    let existing: Record<string, unknown> = {};
    try { existing = JSON.parse(await readFile(cfgPath, 'utf-8')); } catch { /* first run */ }

    const merged = {
      ...existing,
      autonomy: { level: bp.config.autonomy },
      model: { routing: bp.config.modelRouting },
      memory: { chunks: bp.config.memoryChunks },
      mcpServers: bp.mcpServers,
      extensions: bp.extensions,
      _foundry: {
        blueprint: bp.meta.name,
        profile: bp.meta.profile,
        created: bp.meta.created,
      },
    };
    await writeFile(cfgPath, JSON.stringify(merged, null, 2));
    return { name: 'Config', status: 'ok', message: 'openclaw.json updated' };
  } catch (e: unknown) {
    return { name: 'Config', status: 'error', message: (e as Error).message };
  }
}

async function configureLlm(bp: Blueprint): Promise<StepResult> {
  try {
    const cfgPath = join(OPENCLAW_HOME, 'openclaw.json');
    let existing: Record<string, unknown> = {};
    try { existing = JSON.parse(await readFile(cfgPath, 'utf-8')); } catch { /* ok */ }

    const models = (existing.models || {}) as Record<string, unknown>;
    const providers = (models.providers || {}) as Record<string, unknown>;

    if (bp.llm.mode === 'byok' && bp.llm.provider && bp.llm.apiKey) {
      const baseUrls: Record<string, string> = {
        google:    'https://generativelanguage.googleapis.com/v1beta',
        anthropic: 'https://api.anthropic.com',
        openai:    'https://api.openai.com/v1',
      };
      providers[bp.llm.provider] = {
        apiKey: bp.llm.apiKey,
        baseUrl: baseUrls[bp.llm.provider] || '',
      };
      models.providers = providers;
      models.default = bp.llm.model || 'gemini-2.5-flash';
      existing.models = models;
      await writeFile(cfgPath, JSON.stringify(existing, null, 2));
      return { name: 'LLM', status: 'ok', message: `BYOK ${bp.llm.provider} configured` };
    }

    if (bp.llm.mode === 'managed' && bp.llm.proxyUrl && bp.llm.proxyToken) {
      providers['openai'] = {
        apiKey: bp.llm.proxyToken,
        baseUrl: bp.llm.proxyUrl,
      };
      models.providers = providers;
      models.default = bp.llm.model || 'gemini-2.5-flash';
      existing.models = models;
      await writeFile(cfgPath, JSON.stringify(existing, null, 2));
      return { name: 'LLM', status: 'ok', message: `Managed proxy configured (${bp.llm.proxyUrl})` };
    }

    return { name: 'LLM', status: 'warn', message: 'LLM config incomplete — configure manually' };
  } catch (e: unknown) {
    return { name: 'LLM', status: 'error', message: (e as Error).message };
  }
}

async function verify(): Promise<StepResult> {
  try {
    const { stdout } = await execa('openclaw', ['doctor'], { timeout: 30_000 });
    const bad = /error|fail/i.test(stdout);
    return { name: 'Verify', status: bad ? 'warn' : 'ok', message: bad ? 'doctor reported issues' : 'doctor passed' };
  } catch {
    return { name: 'Verify', status: 'warn', message: 'openclaw doctor not available' };
  }
}

// ===== Universal provider deploy (v3.0) =====
// Parameterized version of executeBlueprint — works for ANY provider, not just OpenClaw.
// Each provider gets its own home directory (~/.{provider}/) with the same file structure.

export interface ProviderDeployOptions {
  providerId: string;         // e.g. 'arkclaw', 'workbuddy'
  providerName: string;       // e.g. 'ArkClaw', 'WorkBuddy / QClaw'
  homeDir?: string;           // override, defaults to ~/.{providerId}
  configFileName?: string;    // override, defaults to {providerId}.json
  cliCommand?: string;        // CLI binary name to check, e.g. 'arkclaw', 'workbuddy'
  consoleUrl?: string;        // platform console URL for guidance
  imChannels?: string[];      // supported IM channels from provider meta
}

export async function executeBlueprintForProvider(
  blueprint: Blueprint,
  opts: ProviderDeployOptions,
): Promise<ExecutionResult> {
  const steps: StepResult[] = [];
  const providerHome = opts.homeDir || join(HOME, `.${opts.providerId}`);
  const configFile = opts.configFileName || `${opts.providerId}.json`;

  const step = (name: string, status: 'ok' | 'warn' | 'error', message: string): StepResult =>
    ({ name, status, message });

  // 1. Prerequisites (Node.js)
  try {
    const { stdout } = await execa('node', ['--version']);
    steps.push(step('Prerequisites', 'ok', `Node.js ${stdout.trim()}`));
  } catch {
    steps.push(step('Prerequisites', 'error', 'Node.js not found'));
    return { success: false, steps };
  }

  // 2. Check if provider CLI exists locally
  if (opts.cliCommand) {
    try {
      const { stdout } = await execa(opts.cliCommand, ['--version'], { timeout: 5_000 });
      steps.push(step(`${opts.providerName} CLI`, 'ok', `Found: ${stdout.trim()}`));
    } catch {
      steps.push(step(`${opts.providerName} CLI`, 'warn',
        `${opts.cliCommand} not found locally. Install from ${opts.consoleUrl || 'provider website'}`));
    }
  } else {
    steps.push(step(`${opts.providerName}`, 'ok', `SaaS/Cloud platform — no local CLI required`));
  }

  // 3. Create home directory
  try {
    await mkdir(providerHome, { recursive: true });
    await mkdir(join(providerHome, 'skills'), { recursive: true });
    await mkdir(join(providerHome, 'agents'), { recursive: true });
    steps.push(step('Home Directory', 'ok', providerHome));
  } catch (e: any) {
    steps.push(step('Home Directory', 'error', e.message));
    return { success: false, steps };
  }

  // 4. Write identity files
  try {
    const identity = [
      `# Identity`,
      ``,
      `Role: ${blueprint.identity.role}`,
      `Platform: ${opts.providerName}`,
      `Setup: OpenClaw Foundry v3.0`,
      `Profile: ${blueprint.meta.profile || 'custom'}`,
      `Created: ${blueprint.meta.created}`,
      ``,
    ].join('\n');
    await writeFile(join(providerHome, 'IDENTITY.md'), identity);

    const template = blueprint.identity.soulTemplate || 'fullstack-developer';
    const soulText = SOUL_TEMPLATES[template] || SOUL_TEMPLATES['fullstack-developer']!;
    const soul = `# Soul\n\n${soulText}\n\n## Core Values\n- Quality over speed\n- Clarity over cleverness\n- Evidence over opinion\n`;
    await writeFile(join(providerHome, 'SOUL.md'), soul);

    steps.push(step('Identity', 'ok', 'IDENTITY.md + SOUL.md'));
  } catch (e: any) {
    steps.push(step('Identity', 'error', e.message));
  }

  // 5. Install skills (symlink from AI-Fleet)
  const ok: string[] = [];
  const fail: string[] = [];
  const skillsDir = join(providerHome, 'skills');
  for (const id of blueprint.skills.fromAifleet) {
    try {
      const src = join(AIFLEET_SKILLS, id);
      const dest = join(skillsDir, id);
      await access(src);
      try { await access(dest); ok.push(id); continue; } catch { /* not linked */ }
      await symlink(src, dest, 'dir');
      ok.push(id);
    } catch { fail.push(id); }
  }
  const skillMsg = `${ok.length} installed` + (fail.length ? `, ${fail.length} failed` : '');
  steps.push(step('Skills', fail.length ? 'warn' : 'ok', skillMsg));

  // 6. Configure agents
  try {
    for (const agent of blueprint.agents) {
      await writeFile(join(providerHome, 'agents', `${agent.name}.json`), JSON.stringify(agent, null, 2));
    }
    steps.push(step('Agents', 'ok', `${blueprint.agents.length} agent(s)`));
  } catch (e: any) {
    steps.push(step('Agents', 'error', e.message));
  }

  // 7. Write config
  try {
    const cfgPath = join(providerHome, configFile);
    let existing: Record<string, unknown> = {};
    try { existing = JSON.parse(await readFile(cfgPath, 'utf-8')); } catch { /* first run */ }

    const merged = {
      ...existing,
      provider: opts.providerId,
      providerName: opts.providerName,
      autonomy: { level: blueprint.config.autonomy },
      model: { routing: blueprint.config.modelRouting },
      memory: { chunks: blueprint.config.memoryChunks },
      mcpServers: blueprint.mcpServers,
      extensions: blueprint.extensions,
      target: blueprint.target,
      _foundry: {
        blueprint: blueprint.meta.name,
        profile: blueprint.meta.profile,
        created: blueprint.meta.created,
        deployedAt: new Date().toISOString(),
      },
    };
    await writeFile(cfgPath, JSON.stringify(merged, null, 2));
    steps.push(step('Config', 'ok', `${configFile} written`));
  } catch (e: any) {
    steps.push(step('Config', 'error', e.message));
  }

  // 8. IM channel configuration — auto-provision first, fallback to templates
  const requestedIM = blueprint.target?.imChannel;
  const supportedIM = opts.imChannels || [];
  if (supportedIM.length > 0) {
    try {
      const imDir = join(providerHome, 'im');
      await mkdir(imDir, { recursive: true });

      // Auto-provision: try to register IM bot automatically for the REQUESTED channel
      if (requestedIM && supportedIM.includes(requestedIM)) {
        const provision = await provisionIMBot(requestedIM, blueprint.meta.name, providerHome);
        steps.push(...provision.steps);

        if (provision.success) {
          // Auto-provision succeeded — write real credentials
          const credConfig = {
            channel: requestedIM,
            ...provision.credentials,
            status: 'provisioned',
            provisionedAt: new Date().toISOString(),
            provisionMethod: 'auto',
          };
          await writeFile(join(imDir, `${requestedIM}.json`), JSON.stringify(credConfig, null, 2));
          steps.push(step('IM Auto-Provision', 'ok',
            `${requestedIM} bot auto-registered with real credentials`));
        }
        // If failed, fall through to template writing below
      }

      // Write templates for ALL supported channels (skip already provisioned ones)
      const imConfigs: Record<string, object> = {
        feishu: {
          channel: 'feishu',
          appId: '',
          appSecret: '',
          webhookUrl: '',
          status: requestedIM === 'feishu' ? 'pending_setup' : 'available',
          setupGuide: 'https://open.feishu.cn/document/home/index',
          steps: [
            '1. 打开飞书开放平台 https://open.feishu.cn',
            '2. 创建企业自建应用',
            '3. 添加机器人能力',
            '4. 获取 App ID 和 App Secret 填入此配置',
            '5. 配置事件订阅 webhook URL',
          ],
        },
        wecom: {
          channel: 'wecom',
          corpId: '',
          agentId: '',
          secret: '',
          status: requestedIM === 'wecom' ? 'pending_setup' : 'available',
          setupGuide: 'https://developer.work.weixin.qq.com/document/path/90664',
          steps: [
            '1. 登录企业微信管理后台 https://work.weixin.qq.com',
            '2. 应用管理 → 创建自建应用',
            '3. 获取 CorpID / AgentId / Secret',
            '4. 填入此配置文件',
            '5. 配置接收消息 API',
          ],
        },
        qq: {
          channel: 'qq',
          appId: '',
          appSecret: '',
          status: requestedIM === 'qq' ? 'pending_setup' : 'available',
          setupGuide: 'https://q.qq.com/wiki/develop/miniprogram/frame/',
          steps: [
            '1. 前往 QQ 开放平台 https://q.qq.com',
            '2. 创建 QQ 机器人应用',
            '3. 获取 AppID 和 AppSecret',
            '4. 填入此配置',
          ],
        },
        dingtalk: {
          channel: 'dingtalk',
          appKey: '',
          appSecret: '',
          robotCode: '',
          status: requestedIM === 'dingtalk' ? 'pending_setup' : 'available',
          setupGuide: 'https://open.dingtalk.com/document/orgapp/create-orgapp',
          steps: [
            '1. 登录钉钉开放平台 https://open.dingtalk.com',
            '2. 创建企业内部应用',
            '3. 添加机器人能力',
            '4. 获取 AppKey / AppSecret / RobotCode',
            '5. 填入此配置',
          ],
        },
        telegram: {
          channel: 'telegram',
          botToken: '',
          status: requestedIM === 'telegram' ? 'pending_setup' : 'available',
          setupGuide: 'https://core.telegram.org/bots#how-do-i-create-a-bot',
          steps: [
            '1. 在 Telegram 找到 @BotFather',
            '2. 发送 /newbot 创建机器人',
            '3. 获取 Bot Token 填入此配置',
          ],
        },
        discord: {
          channel: 'discord',
          botToken: '',
          applicationId: '',
          status: requestedIM === 'discord' ? 'pending_setup' : 'available',
          setupGuide: 'https://discord.com/developers/docs/getting-started',
          steps: [
            '1. 前往 Discord Developer Portal https://discord.com/developers',
            '2. 创建 Application → Bot',
            '3. 获取 Bot Token 和 Application ID',
            '4. 填入此配置',
          ],
        },
        slack: {
          channel: 'slack',
          botToken: '',
          signingSecret: '',
          status: requestedIM === 'slack' ? 'pending_setup' : 'available',
          setupGuide: 'https://api.slack.com/start/building',
          steps: [
            '1. 前往 https://api.slack.com/apps 创建 App',
            '2. 添加 Bot User',
            '3. 获取 Bot Token 和 Signing Secret',
            '4. 填入此配置',
          ],
        },
      };

      const configuredChannels: string[] = [];
      const pendingChannels: string[] = [];

      for (const ch of supportedIM) {
        const template = imConfigs[ch];
        if (template) {
          await writeFile(join(imDir, `${ch}.json`), JSON.stringify(template, null, 2));
          if (requestedIM === ch) {
            pendingChannels.push(ch);
          } else {
            configuredChannels.push(ch);
          }
        }
      }

      // Write IM summary
      const imSummary = {
        activeChannel: requestedIM || null,
        supported: supportedIM,
        configured: configuredChannels,
        pendingSetup: pendingChannels,
        configDir: imDir,
      };
      await writeFile(join(imDir, '_summary.json'), JSON.stringify(imSummary, null, 2));

      if (pendingChannels.length > 0) {
        const chName = pendingChannels[0];
        const guide = (imConfigs[chName] as any)?.steps?.[0] || '';
        steps.push(step('IM Channels', 'warn',
          `${chName} config created at ${imDir}/${chName}.json — needs token setup. ${guide}`));
      } else if (configuredChannels.length > 0) {
        steps.push(step('IM Channels', 'ok',
          `${configuredChannels.length} channel configs ready: ${configuredChannels.join(', ')}`));
      } else {
        steps.push(step('IM Channels', 'ok', `${supportedIM.length} channel templates written`));
      }
    } catch (e: any) {
      steps.push(step('IM Channels', 'error', e.message));
    }
  } else {
    steps.push(step('IM Channels', 'warn', `${opts.providerName} has no IM channel support`));
  }

  // 9. Model API key provisioning
  const llmMode = blueprint.llm?.mode;
  if (llmMode === 'byok' && blueprint.llm?.provider && !blueprint.llm?.apiKey) {
    // User wants BYOK but no key provided — try to auto-provision
    const modelResult = await provisionModelAPIKey(blueprint.llm.provider, providerHome);
    steps.push(...modelResult.steps);

    if (modelResult.success && modelResult.apiKey) {
      // Write key into main config
      try {
        const cfgPath = join(providerHome, configFile);
        const raw = await readFile(cfgPath, 'utf-8');
        const cfg = JSON.parse(raw);
        cfg.llm = {
          mode: 'byok',
          provider: blueprint.llm.provider,
          apiKey: modelResult.apiKey,
          provisionedAt: new Date().toISOString(),
        };
        await writeFile(cfgPath, JSON.stringify(cfg, null, 2));
        steps.push(step('Model API', 'ok',
          `${blueprint.llm.provider} API key auto-provisioned and saved`));
      } catch (e: any) {
        steps.push(step('Model API', 'warn', `Key obtained but config write failed: ${e.message}`));
      }
    }
  } else if (llmMode === 'byok' && blueprint.llm?.apiKey) {
    // Key already provided — write it
    try {
      const cfgPath = join(providerHome, configFile);
      const raw = await readFile(cfgPath, 'utf-8');
      const cfg = JSON.parse(raw);
      cfg.llm = {
        mode: 'byok',
        provider: blueprint.llm.provider,
        apiKey: blueprint.llm.apiKey,
      };
      await writeFile(cfgPath, JSON.stringify(cfg, null, 2));
      steps.push(step('Model API', 'ok', `${blueprint.llm.provider} key configured`));
    } catch (e: any) {
      steps.push(step('Model API', 'warn', e.message));
    }
  } else if (llmMode !== 'skip') {
    steps.push(step('Model API', 'ok', `LLM mode: ${llmMode || 'skip'}`));
  }

  // 10. Write manifest
  try {
    const manifest = {
      version: blueprint.version || '2.0',
      provider: opts.providerId,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      home: providerHome,
      blueprint: { name: blueprint.meta.name, role: blueprint.identity.role },
      files: [
        join(providerHome, 'IDENTITY.md'),
        join(providerHome, 'SOUL.md'),
        join(providerHome, configFile),
      ],
      skills: { installed: ok },
      agents: blueprint.agents.map(a => a.name),
    };
    await writeFile(join(providerHome, '.foundry-manifest.json'), JSON.stringify(manifest, null, 2));
    steps.push(step('Manifest', 'ok', `${manifest.files.length} files tracked`));
  } catch (e: any) {
    steps.push(step('Manifest', 'warn', e.message));
  }

  // 9. Verify — check files exist
  try {
    await access(join(providerHome, 'IDENTITY.md'));
    await access(join(providerHome, configFile));
    steps.push(step('Verify', 'ok', `${opts.providerName} deployed to ${providerHome}`));
  } catch {
    steps.push(step('Verify', 'warn', 'Some files missing after deploy'));
  }

  const success = steps.every(s => s.status !== 'error');
  return { success, steps };
}

// ===== Export helpers (P3) =====

async function exportBash(bp: Blueprint, out: string): Promise<void> {
  const script = `#!/usr/bin/env bash
set -euo pipefail
# OpenClaw Foundry — auto-generated installer
# Blueprint: ${bp.meta.name}
# Generated: ${bp.meta.created}

echo "=== OpenClaw Foundry Installer ==="
echo "Blueprint: ${bp.meta.name}"
echo ""

# --- Node.js check ---
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install from https://nodejs.org"; exit 1
fi
NODE_MAJOR=$(node -e "console.log(process.version.split('.')[0].replace('v',''))")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js >= 18 required"; exit 1
fi
echo "OK Node.js $(node --version)"

# --- OpenClaw ---
if ! command -v openclaw &>/dev/null; then
  echo "Installing OpenClaw..."
  npm install -g @anthropic/openclaw
fi
echo "OK OpenClaw installed"

# --- Directories ---
mkdir -p ~/.openclaw/skills ~/.openclaw/agents ~/.openclaw/memory

# --- Identity ---
cat > ~/.openclaw/IDENTITY.md << 'EOF'
# Identity

Role: ${bp.identity.role}
Setup: OpenClaw Foundry
Profile: ${bp.meta.profile || 'custom'}
EOF
echo "OK Identity"

# --- Skills (ClawHub) ---
${bp.skills.fromClawhub.map(s => `openclaw skills install ${s} 2>/dev/null || echo "WARN: ${s} failed"`).join('\n')}
echo "OK Skills"

# --- Config ---
cat > ~/.openclaw/openclaw.json << 'CONFIG_EOF'
${JSON.stringify({ autonomy: { level: bp.config.autonomy }, model: { routing: bp.config.modelRouting }, memory: { chunks: bp.config.memoryChunks }, mcpServers: bp.mcpServers, extensions: bp.extensions }, null, 2)}
CONFIG_EOF
echo "OK Config"

# --- Agents ---
${bp.agents.map(a => `cat > ~/.openclaw/agents/${a.name}.json << 'A_EOF'\n${JSON.stringify(a, null, 2)}\nA_EOF`).join('\n')}
echo "OK Agents (${bp.agents.length})"

# --- Verify ---
openclaw doctor 2>/dev/null || echo "WARN: run 'openclaw doctor' manually"
echo ""
echo "=== Installation Complete ==="
echo "Run 'openclaw' to start."
`;
  await writeFile(out, script, { mode: 0o755 });
  log.ok(`Bash installer exported to ${out}`);
}

async function exportPowerShell(bp: Blueprint, out: string): Promise<void> {
  const script = `# OpenClaw Foundry — auto-generated installer (Windows)
# Blueprint: ${bp.meta.name}
# Generated: ${bp.meta.created}
$ErrorActionPreference = "Stop"

Write-Host "=== OpenClaw Foundry Installer ===" -ForegroundColor Cyan
Write-Host "Blueprint: ${bp.meta.name}"

# Node.js
try {
  $nv = node --version
  $major = [int]($nv -replace 'v(\\d+).*','$1')
  if ($major -lt 18) { Write-Host "ERROR: Node.js >= 18 required" -ForegroundColor Red; exit 1 }
  Write-Host "OK Node.js $nv" -ForegroundColor Green
} catch { Write-Host "ERROR: Node.js not found" -ForegroundColor Red; exit 1 }

# OpenClaw
try { openclaw --version | Out-Null; Write-Host "OK OpenClaw" -ForegroundColor Green }
catch { Write-Host "Installing OpenClaw..."; npm install -g @anthropic/openclaw }

# Directories
$h = Join-Path $env:USERPROFILE ".openclaw"
New-Item -ItemType Directory -Force -Path "$h\\skills","$h\\agents","$h\\memory" | Out-Null

# Identity
@"
# Identity
Role: ${bp.identity.role}
Setup: OpenClaw Foundry
"@ | Set-Content "$h\\IDENTITY.md"

# Skills
${bp.skills.fromClawhub.map(s => `try { openclaw skills install ${s} } catch { Write-Host "WARN: ${s}" -ForegroundColor Yellow }`).join('\n')}

# Config
@'
${JSON.stringify({ autonomy: { level: bp.config.autonomy }, model: { routing: bp.config.modelRouting }, memory: { chunks: bp.config.memoryChunks }, mcpServers: bp.mcpServers, extensions: bp.extensions }, null, 2)}
'@ | Set-Content "$h\\openclaw.json"

# Agents
${bp.agents.map(a => `@'\n${JSON.stringify(a, null, 2)}\n'@ | Set-Content "$h\\agents\\${a.name}.json"`).join('\n')}

# Verify
try { openclaw doctor } catch { Write-Host "WARN: run openclaw doctor" -ForegroundColor Yellow }
Write-Host "=== Done ===" -ForegroundColor Green
`;
  await writeFile(out, script);
  log.ok(`PowerShell installer exported to ${out}`);
}
