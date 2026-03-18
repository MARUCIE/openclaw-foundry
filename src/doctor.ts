import { access, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { execa } from 'execa';
import type { StepResult, Manifest } from './types.js';
import { log } from './utils.js';
import chalk from 'chalk';

const HOME = process.env.HOME || process.env.USERPROFILE || '~';
const OPENCLAW_HOME = join(HOME, '.openclaw');
const MANIFEST_PATH = join(OPENCLAW_HOME, '.foundry-manifest.json');

export async function runDoctor(): Promise<StepResult[]> {
  const results: StepResult[] = [];

  console.log('');
  console.log(chalk.bold('=== OpenClaw Foundry Doctor ==='));
  console.log('');

  // 1. Node.js
  try {
    const { stdout } = await execa('node', ['--version']);
    results.push({ name: 'Node.js', status: 'ok', message: stdout.trim() });
  } catch {
    results.push({ name: 'Node.js', status: 'error', message: 'Not installed' });
  }

  // 2. OpenClaw
  try {
    const { stdout } = await execa('openclaw', ['--version']);
    results.push({ name: 'OpenClaw', status: 'ok', message: stdout.trim() });
  } catch {
    results.push({ name: 'OpenClaw', status: 'error', message: 'Not installed' });
  }

  // 3. Config dir
  try {
    await access(OPENCLAW_HOME);
    results.push({ name: 'Config dir', status: 'ok', message: OPENCLAW_HOME });
  } catch {
    results.push({ name: 'Config dir', status: 'error', message: 'Missing ~/.openclaw' });
  }

  // 4. Identity files
  for (const f of ['IDENTITY.md', 'SOUL.md']) {
    try {
      await access(join(OPENCLAW_HOME, f));
      results.push({ name: f, status: 'ok', message: 'Present' });
    } catch {
      results.push({ name: f, status: 'warn', message: 'Missing — run "ocf repair" to regenerate' });
    }
  }

  // 5. Skills
  try {
    const entries = await readdir(join(OPENCLAW_HOME, 'skills'));
    results.push({ name: 'Skills', status: 'ok', message: `${entries.length} installed` });
  } catch {
    results.push({ name: 'Skills', status: 'warn', message: 'No skills directory' });
  }

  // 6. Config file
  try {
    const raw = await readFile(join(OPENCLAW_HOME, 'openclaw.json'), 'utf-8');
    const cfg = JSON.parse(raw);
    const foundry = cfg._foundry;
    results.push({
      name: 'Config',
      status: 'ok',
      message: foundry ? `Foundry-managed (${foundry.profile})` : 'Present (manual)',
    });
  } catch {
    results.push({ name: 'Config', status: 'warn', message: 'Missing openclaw.json — run "ocf repair"' });
  }

  // 7. Agents
  try {
    const entries = await readdir(join(OPENCLAW_HOME, 'agents'));
    const jsons = entries.filter(e => e.endsWith('.json'));
    results.push({ name: 'Agents', status: 'ok', message: `${jsons.length} configured` });
  } catch {
    results.push({ name: 'Agents', status: 'warn', message: 'No agents directory' });
  }

  // 8. Manifest
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(raw) as Manifest;
    const totalSkills = manifest.skills.aifleet.length + manifest.skills.clawhub.length;
    results.push({
      name: 'Manifest',
      status: 'ok',
      message: `v${manifest.version} (${totalSkills} skills, ${manifest.agents.length} agents, updated ${manifest.updated})`,
    });
  } catch {
    results.push({ name: 'Manifest', status: 'warn', message: 'No manifest — uninstall/repair unavailable' });
  }

  // 9. Audit log
  const auditPath = join(OPENCLAW_HOME, 'audit.jsonl');
  try {
    const raw = await readFile(auditPath, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    results.push({ name: 'Audit log', status: 'ok', message: `${lines.length} entries` });
  } catch {
    results.push({ name: 'Audit log', status: 'ok', message: 'No entries yet' });
  }

  // 10. Foundry server reachability (if VPS)
  const serverUrl = process.env.OCF_SERVER_URL;
  if (serverUrl) {
    try {
      const resp = await fetch(`${serverUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
      const data = await resp.json() as { status: string };
      results.push({ name: 'Foundry Server', status: 'ok', message: `${serverUrl} (${data.status})` });
    } catch {
      results.push({ name: 'Foundry Server', status: 'warn', message: `${serverUrl} unreachable` });
    }
  }

  // Print
  console.log('');
  for (const r of results) {
    const tag = r.status === 'ok' ? chalk.green('OK')
      : r.status === 'warn' ? chalk.yellow('WARN') : chalk.red('ERROR');
    console.log(`  ${tag} ${r.name}: ${r.message}`);
  }

  const errors = results.filter(r => r.status === 'error').length;
  const warns  = results.filter(r => r.status === 'warn').length;
  console.log('');
  if (errors === 0 && warns === 0) {
    log.ok('All checks passed');
  } else if (errors === 0) {
    log.warn(`${warns} warning(s) — run "ocf repair" to auto-fix`);
  } else {
    log.error(`${errors} error(s), ${warns} warning(s)`);
  }

  return results;
}
