#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import chalk from 'chalk';
import { runWizard } from './wizard.js';
import { analyzeAndGenerateBlueprint } from './analyzer.js';
import { executeBlueprint, exportBlueprint, uninstallFoundry, repairFoundry, upgradeFoundry, rollbackFoundry, listSnapshots } from './executor.js';
import { getFullCatalog } from './catalog.js';
import { listProfiles, loadProfile, saveAsProfile } from './profiles.js';
import { runDoctor } from './doctor.js';
import { createCustomer, listCustomers, getCustomer, updateTier, deactivateCustomer, getUsageSummary } from './customers.js';
import { BlueprintSchema } from './types.js';
import type { Customer } from './types.js';
import { log } from './utils.js';

const VERSION = '0.1.0';

const program = new Command()
  .name('ocf')
  .description('OpenClaw Foundry — AI-driven one-click deployment')
  .version(VERSION);

// ===== ocf init =====
program
  .command('init')
  .description('Interactive wizard -> AI analysis -> install customized OpenClaw')
  .option('-p, --profile <id>', 'Start from a preset profile instead of wizard')
  .option('--save-blueprint <path>', 'Save generated blueprint to a JSON file')
  .option('--dry-run', 'Generate blueprint without installing')
  .option('--server <url>', 'Use remote Foundry server for AI analysis')
  .action(async (opts) => {
    console.log(chalk.bold.cyan(`\n  OpenClaw Foundry v${VERSION}\n`));

    let blueprint;

    if (opts.profile) {
      // P2: load from preset
      blueprint = await loadProfile(opts.profile);
      if (!blueprint) return;
      log.ok(`Loaded profile: ${opts.profile}`);
    } else if (opts.server) {
      // Client-Server mode: wizard locally, analysis on VPS
      const answers = await runWizard();
      log.note(`Sending to server: ${opts.server}`);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (process.env.OCF_API_KEY) headers['x-api-key'] = process.env.OCF_API_KEY;

      const resp = await fetch(`${opts.server}/api/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify(answers),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        log.error(`Server error: ${(err as { error: string }).error}`);
        return;
      }
      const data = await resp.json() as { blueprint: unknown };
      blueprint = BlueprintSchema.parse(data.blueprint);
      log.ok('Blueprint received from server');
    } else {
      // Full local mode
      const answers = await runWizard();
      const catalog = await getFullCatalog();
      log.note(`Catalog: ${catalog.length} skills available`);
      blueprint = await analyzeAndGenerateBlueprint(answers, catalog);
    }

    // Summary
    console.log('');
    console.log(chalk.bold('--- Blueprint Summary ---'));
    console.log(`  Name:     ${blueprint.meta.name}`);
    console.log(`  Role:     ${blueprint.identity.role}`);
    console.log(`  Skills:   ${blueprint.skills.fromAifleet.length} (AI-Fleet) + ${blueprint.skills.fromClawhub.length} (ClawHub)`);
    console.log(`  Agents:   ${blueprint.agents.length}`);
    console.log(`  Autonomy: ${blueprint.config.autonomy}`);
    console.log('');

    if (opts.saveBlueprint) {
      await writeFile(opts.saveBlueprint, JSON.stringify(blueprint, null, 2));
      log.ok(`Blueprint saved to ${opts.saveBlueprint}`);
    }

    if (opts.dryRun) {
      log.note('Dry run — no changes made');
      console.log(JSON.stringify(blueprint, null, 2));
      return;
    }

    await executeBlueprint(blueprint);
  });

// ===== ocf cast =====
program
  .command('cast <blueprint-file>')
  .description('Execute an existing blueprint JSON file')
  .action(async (file) => {
    try {
      const raw = await readFile(file, 'utf-8');
      const blueprint = BlueprintSchema.parse(JSON.parse(raw));
      await executeBlueprint(blueprint);
    } catch (e: unknown) {
      log.error(`Invalid blueprint: ${(e as Error).message}`);
    }
  });

// ===== ocf catalog =====
program
  .command('catalog')
  .description('Browse available skills catalog')
  .option('-s, --source <source>', 'Filter: aifleet | clawhub')
  .option('--json', 'JSON output')
  .action(async (opts) => {
    const catalog = await getFullCatalog();
    let filtered = catalog;
    if (opts.source) filtered = catalog.filter(s => s.source === opts.source);

    if (opts.json) { console.log(JSON.stringify(filtered, null, 2)); return; }

    console.log(chalk.bold(`\n  Skills Catalog (${filtered.length})\n`));
    const aifleet = filtered.filter(s => s.source === 'aifleet');
    const clawhub = filtered.filter(s => s.source === 'clawhub');

    if (aifleet.length) {
      console.log(chalk.cyan('  AI-Fleet:'));
      for (const s of aifleet) console.log(`    ${s.id}${s.description ? chalk.dim(' — ' + s.description.slice(0, 60)) : ''}`);
    }
    if (clawhub.length) {
      console.log(chalk.green('\n  ClawHub:'));
      for (const s of clawhub) console.log(`    ${s.id}${s.description ? chalk.dim(' — ' + s.description.slice(0, 60)) : ''}`);
    }
  });

// ===== ocf switch (P2) =====
program
  .command('switch [profile-id]')
  .description('Switch to a preset profile (or list available profiles)')
  .action(async (profileId) => {
    if (!profileId) {
      const profiles = await listProfiles();
      if (!profiles.length) { log.note('No profiles. Run "ocf init" first.'); return; }
      console.log(chalk.bold('\n  Available Profiles\n'));
      for (const p of profiles) {
        console.log(`  ${chalk.cyan(p.id)} — ${p.name}`);
        if (p.description) console.log(`    ${chalk.dim(p.description)}`);
      }
      return;
    }
    const blueprint = await loadProfile(profileId);
    if (!blueprint) return;
    log.note(`Switching to profile: ${profileId}`);
    await executeBlueprint(blueprint);
  });

// ===== ocf export (P3) =====
program
  .command('export <blueprint-file>')
  .description('Export blueprint as standalone installer (.sh or .ps1)')
  .option('-o, --output <path>', 'Output file path')
  .option('--os <os>', 'Target OS: darwin | win32 | linux', 'darwin')
  .action(async (file, opts) => {
    try {
      const raw = await readFile(file, 'utf-8');
      const blueprint = BlueprintSchema.parse(JSON.parse(raw));
      if (opts.os) blueprint.meta.os = opts.os;
      const ext = blueprint.meta.os === 'win32' ? '.ps1' : '.sh';
      const output = opts.output || `openclaw-install${ext}`;
      await exportBlueprint(blueprint, output);
    } catch (e: unknown) {
      log.error(`Export failed: ${(e as Error).message}`);
    }
  });

// ===== ocf save =====
program
  .command('save <blueprint-file> <profile-id>')
  .description('Save a blueprint as a reusable profile')
  .action(async (file, profileId) => {
    try {
      const raw = await readFile(file, 'utf-8');
      const blueprint = BlueprintSchema.parse(JSON.parse(raw));
      await saveAsProfile(blueprint, profileId);
    } catch (e: unknown) {
      log.error(`Save failed: ${(e as Error).message}`);
    }
  });

// ===== ocf uninstall =====
program
  .command('uninstall')
  .description('Remove Foundry-managed OpenClaw files (skills, agents, identity, config)')
  .option('--keep-config', 'Keep openclaw.json for future reinstall')
  .option('--keep-memory', 'Keep memory directory (learned context)')
  .option('--dry-run', 'Show what would be removed without deleting')
  .action(async (opts) => {
    console.log(chalk.bold.cyan(`\n  OpenClaw Foundry v${VERSION}\n`));
    await uninstallFoundry({
      keepConfig: opts.keepConfig,
      keepMemory: opts.keepMemory,
      dryRun: opts.dryRun,
    });
  });

// ===== ocf repair =====
program
  .command('repair')
  .description('Diagnose and auto-fix OpenClaw installation issues')
  .option('-c, --component <type>', 'Repair specific component: skills | agents | config | identity | all', 'all')
  .option('--dry-run', 'Show what would be fixed without changing anything')
  .action(async (opts) => {
    console.log(chalk.bold.cyan(`\n  OpenClaw Foundry v${VERSION}\n`));
    await repairFoundry({
      component: opts.component,
      dryRun: opts.dryRun,
    });
  });

// ===== ocf upgrade =====
program
  .command('upgrade')
  .description('Refresh skills and config to latest versions')
  .option('--skills-only', 'Only upgrade skills (skip config)')
  .option('--config-only', 'Only upgrade config (skip skills)')
  .option('--dry-run', 'Show what would change without applying')
  .action(async (opts) => {
    console.log(chalk.bold.cyan(`\n  OpenClaw Foundry v${VERSION}\n`));
    await upgradeFoundry({
      skillsOnly: opts.skillsOnly,
      configOnly: opts.configOnly,
      dryRun: opts.dryRun,
    });
  });

// ===== ocf rollback =====
program
  .command('rollback [snapshot-id]')
  .description('Restore from a previous snapshot (default: latest)')
  .action(async (snapshotId?: string) => {
    console.log(chalk.bold.cyan(`\n  OpenClaw Foundry v${VERSION}\n`));
    await rollbackFoundry(snapshotId);
  });

// ===== ocf snapshots =====
program
  .command('snapshots')
  .description('List available rollback snapshots')
  .action(async () => {
    console.log(chalk.bold.cyan(`\n  OpenClaw Foundry v${VERSION}\n`));
    const snaps = await listSnapshots();
    if (!snaps.length) {
      log.note('No snapshots yet. Snapshots are created automatically before install/upgrade.');
      return;
    }
    console.log(chalk.bold(`  Snapshots (${snaps.length}, max ${5})\n`));
    for (const s of snaps) {
      console.log(`  ${chalk.cyan(s.id)}  ${s.created}  ${chalk.dim(`(${s.trigger})`)}`);
    }
    console.log('');
    log.note('Rollback: ocf rollback <snapshot-id>');
  });

// ===== ocf doctor =====
program
  .command('doctor')
  .description('Verify OpenClaw installation health')
  .action(async () => { await runDoctor(); });

// ===== ocf customer (server-side admin) =====
const customerCmd = program
  .command('customer')
  .description('Manage LLM proxy customers (server admin)');

customerCmd
  .command('create <name>')
  .description('Create a new customer')
  .option('-t, --tier <tier>', 'Customer tier: basic | pro | enterprise', 'basic')
  .action(async (name: string, opts: { tier: string }) => {
    const customer = await createCustomer(name, opts.tier as Customer['tier']);
    console.log(chalk.bold('\n  Customer Created\n'));
    console.log(`  ID:    ${customer.id}`);
    console.log(`  Name:  ${customer.name}`);
    console.log(`  Tier:  ${customer.tier}`);
    console.log(`  Token: ${chalk.yellow(customer.token)}`);
    console.log('');
    log.note('Save this token — it is the customer\'s LLM proxy credential.');
  });

customerCmd
  .command('list')
  .description('List all customers')
  .action(async () => {
    const customers = await listCustomers();
    if (!customers.length) { log.note('No customers yet.'); return; }
    console.log(chalk.bold(`\n  Customers (${customers.length})\n`));
    for (const c of customers) {
      const status = c.active ? chalk.green('active') : chalk.dim('inactive');
      console.log(`  ${c.id}  ${c.name}  ${chalk.cyan(c.tier)}  ${status}  ${chalk.dim(c.token.slice(0, 12) + '...')}`);
    }
    console.log('');
  });

customerCmd
  .command('usage <id>')
  .description('Show customer usage summary')
  .action(async (id: string) => {
    const customer = await getCustomer(id);
    if (!customer) { log.error(`Customer ${id} not found.`); return; }
    const usage = await getUsageSummary(id);
    console.log(chalk.bold(`\n  Usage: ${customer.name} (${customer.tier})\n`));
    console.log(`  Today:     ${usage.today.requests} req, ${usage.today.inputTokens + usage.today.outputTokens} tokens`);
    console.log(`  Last 7d:   ${usage.last7days.requests} req, ${usage.last7days.inputTokens + usage.last7days.outputTokens} tokens`);
    console.log(`  All time:  ${usage.total.requests} req, ${usage.total.inputTokens + usage.total.outputTokens} tokens`);
    console.log('');
  });

customerCmd
  .command('upgrade <id> <tier>')
  .description('Change customer tier (basic | pro | enterprise)')
  .action(async (id: string, tier: string) => {
    const ok = await updateTier(id, tier as Customer['tier']);
    if (!ok) { log.error(`Customer ${id} not found.`); return; }
    log.ok(`Tier updated to ${tier}`);
  });

customerCmd
  .command('deactivate <id>')
  .description('Deactivate a customer (revokes LLM access)')
  .action(async (id: string) => {
    const ok = await deactivateCustomer(id);
    if (!ok) { log.error(`Customer ${id} not found.`); return; }
    log.ok('Customer deactivated');
  });

program.parse();
