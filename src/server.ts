import express from 'express';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { WizardAnswers } from './types.js';
import { analyzeAndGenerateBlueprint } from './analyzer.js';
import { getFullCatalog } from './catalog.js';
import { listProfiles, loadProfile } from './profiles.js';
import { createLlmProxy } from './llm-proxy.js';
import { createCustomer, listCustomers, getCustomer, updateTier, deactivateCustomer, getUsageSummary } from './customers.js';
import { log } from './utils.js';
import { listProviders, getProvider, getProviderStats } from './providers/index.js';
import type { ProviderId } from './types.js';
import { createDeployJob, getDeployJob, listDeployJobs, cancelDeployJob } from './deploy-manager.js';
import { createArenaMatch, getArenaMatch, listArenaMatches } from './arena-engine.js';
import { listModelProviders } from './auto-provision.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.OCF_PORT || '18800');
const API_KEY = process.env.OCF_API_KEY || '';  // optional auth
const PUBLIC_URL = process.env.OCF_PUBLIC_URL || `http://localhost:${PORT}`;

const app = express();
app.use(express.json());

// --- CORS (for future web UI) ---
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  next();
});

// --- Request logging ---
app.use((req, _res, next) => {
  const ts = new Date().toISOString().slice(11, 19);
  if (req.method !== 'OPTIONS') {
    log.note(`[${ts}] ${req.method} ${req.path}`);
  }
  next();
});

// --- Optional API key guard ---
app.use('/api', (req, res, next) => {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }
  next();
});

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.0.0', uptime: process.uptime(), providers: getProviderStats() });
});

// --- Providers: list and query supported platforms ---
app.get('/api/providers', (req, res) => {
  const type = req.query.type as string | undefined;
  const os = req.query.os as string | undefined;
  let providers = listProviders();
  if (type) providers = providers.filter(p => p.type === type);
  if (os) providers = providers.filter(p => p.platforms.includes(os as any));
  res.json({ total: providers.length, providers });
});

app.get('/api/providers/:id', async (req, res) => {
  const provider = getProvider(req.params.id as ProviderId);
  if (!provider || provider.meta.id !== req.params.id) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }
  const available = await provider.isAvailable();
  const reqs = provider.getRequirements();
  res.json({ provider: provider.meta, available, requirements: reqs });
});

app.get('/api/providers/:id/diagnose', async (req, res) => {
  const provider = getProvider(req.params.id as ProviderId);
  if (!provider || provider.meta.id !== req.params.id) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }
  const result = await provider.diagnose();
  res.json(result);
});

// --- Catalog cache (refresh every 5 min) ---
import type { CatalogEntry } from './types.js';
let catalogCache: CatalogEntry[] = [];
let catalogCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getCachedCatalog(): Promise<CatalogEntry[]> {
  if (Date.now() - catalogCacheTime > CACHE_TTL || catalogCache.length === 0) {
    catalogCache = await getFullCatalog();
    catalogCacheTime = Date.now();
    log.ok(`Catalog refreshed: ${catalogCache.length} skills`);
  }
  return catalogCache;
}

// --- AI Analysis: the core endpoint ---
// Client sends wizard answers, server returns Blueprint JSON
// If llmMode === 'managed', auto-provisions a customer account and injects proxy credentials
app.post('/api/analyze', async (req, res) => {
  try {
    const answers: WizardAnswers = req.body;

    if (!answers.userName || !answers.role || !answers.os) {
      res.status(400).json({ error: 'Missing required fields: userName, role, os' });
      return;
    }

    const catalog = await getCachedCatalog();
    const blueprint = await analyzeAndGenerateBlueprint(answers, catalog);

    // Auto-provision managed LLM access
    if (blueprint.llm.mode === 'managed') {
      const customer = await createCustomer(answers.userName, 'basic');
      const proxyUrl = `${PUBLIC_URL}/llm/v1`;
      blueprint.llm.proxyUrl = proxyUrl;
      blueprint.llm.proxyToken = customer.token;
      blueprint.llm.model = 'gemini-2.5-flash';
      log.ok(`Managed LLM provisioned for ${customer.name} (${customer.id})`);
    }

    log.ok(`Blueprint generated for ${answers.userName} (${answers.role} / ${answers.os})`);
    res.json({ blueprint });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`/api/analyze failed: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// --- Catalog: browse available skills ---
app.get('/api/catalog', async (req, res) => {
  try {
    const catalog = await getCachedCatalog();
    const source = req.query.source as string | undefined;
    const filtered = source ? catalog.filter(c => c.source === source) : catalog;
    res.json({ total: filtered.length, skills: filtered });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- Profiles: list / get preset profiles ---
app.get('/api/profiles', async (_req, res) => {
  const profiles = await listProfiles();
  res.json({ profiles });
});

app.get('/api/profiles/:id', async (req, res) => {
  const bp = await loadProfile(req.params.id);
  if (!bp) { res.status(404).json({ error: 'Profile not found' }); return; }
  res.json({ blueprint: bp });
});

// --- LLM Proxy (OpenAI-compatible, customer-authenticated) ---
app.use('/llm/v1', createLlmProxy());

// --- Customer management endpoints ---
app.post('/api/customers', async (req, res) => {
  try {
    const { name, tier } = req.body;
    if (!name) { res.status(400).json({ error: 'name is required' }); return; }
    const customer = await createCustomer(name, tier || 'basic');
    res.json({ customer });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/customers', async (_req, res) => {
  const customers = await listCustomers();
  // Strip tokens from list view for security
  const safe = customers.map(c => ({ ...c, token: c.token.slice(0, 8) + '...' }));
  res.json({ total: safe.length, customers: safe });
});

app.get('/api/customers/:id', async (req, res) => {
  const customer = await getCustomer(req.params.id);
  if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }
  const usage = await getUsageSummary(customer.id);
  res.json({ customer, usage });
});

app.patch('/api/customers/:id/tier', async (req, res) => {
  const { tier } = req.body;
  if (!tier) { res.status(400).json({ error: 'tier is required' }); return; }
  const ok = await updateTier(req.params.id, tier);
  if (!ok) { res.status(404).json({ error: 'Customer not found' }); return; }
  res.json({ ok: true });
});

app.delete('/api/customers/:id', async (req, res) => {
  const ok = await deactivateCustomer(req.params.id);
  if (!ok) { res.status(404).json({ error: 'Customer not found' }); return; }
  res.json({ ok: true });
});

// --- Deploy Jobs (v3.0) ---
app.post('/api/deploy', (req, res) => {
  const { provider, blueprint } = req.body;
  if (!provider || !blueprint) {
    res.status(400).json({ error: 'provider and blueprint are required' });
    return;
  }
  const job = createDeployJob(provider as ProviderId, blueprint);
  res.status(202).json({ jobId: job.id, status: job.status });
});

app.get('/api/deploy', (_req, res) => {
  res.json({ jobs: listDeployJobs() });
});

app.get('/api/deploy/:jobId', (req, res) => {
  const job = getDeployJob(req.params.jobId);
  if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
  res.json(job);
});

app.post('/api/deploy/:jobId/cancel', (req, res) => {
  const ok = cancelDeployJob(req.params.jobId);
  if (!ok) { res.status(404).json({ error: 'Job not found or not running' }); return; }
  res.json({ ok: true });
});

// --- Arena (v3.0) ---
app.post('/api/arena', (req, res) => {
  const { providers: providerIds, blueprint, testPrompt } = req.body;
  if (!providerIds || !blueprint || !testPrompt) {
    res.status(400).json({ error: 'providers, blueprint, and testPrompt are required' });
    return;
  }
  const result = createArenaMatch(providerIds, blueprint, testPrompt);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.status(202).json({ matchId: result.id, status: result.status });
});

app.get('/api/arena', (_req, res) => {
  res.json({ matches: listArenaMatches() });
});

app.get('/api/arena/:matchId', (req, res) => {
  const match = getArenaMatch(req.params.matchId);
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  res.json(match);
});

app.get('/api/arena/:matchId/results', (req, res) => {
  const match = getArenaMatch(req.params.matchId);
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  if (match.status !== 'completed' && match.status !== 'failed') {
    res.status(409).json({ error: 'Match not yet completed', status: match.status });
    return;
  }
  res.json({ winner: match.winner, scoring: match.scoring, lanes: match.lanes });
});

// --- Model API providers list (v3.0) ---
app.get('/api/model-providers', (_req, res) => {
  res.json({ providers: listModelProviders() });
});

// --- Stats (v3.0) ---
app.get('/api/stats', (_req, res) => {
  const providerStats = getProviderStats();
  const totalProviders = listProviders().length;
  const recentDeploys = listDeployJobs().slice(0, 5);
  const recentArena = listArenaMatches().slice(0, 3);
  res.json({
    providers: { total: totalProviders, byType: providerStats },
    deploys: { recent: recentDeploys.length, jobs: recentDeploys },
    arena: { recent: recentArena.length, matches: recentArena },
    uptime: process.uptime(),
  });
});

// --- Static files (Web UI) ---
app.use(express.static(join(__dirname, '..', 'client')));

// --- Serve bootstrap scripts with dynamic URL injection ---
app.get('/foundry.sh', async (req, res) => {
  try {
    let script = await readFile(join(__dirname, '..', 'client', 'foundry.sh'), 'utf-8');
    // Inject actual server URL so clients auto-connect to this server
    const serverUrl = PUBLIC_URL || `${req.protocol}://${req.headers.host}`;
    script = script.replace(
      /FOUNDRY_SERVER="\$\{OCF_SERVER_URL:-[^}]*\}"/,
      `FOUNDRY_SERVER="\${OCF_SERVER_URL:-${serverUrl}}"`,
    );
    res.type('text/plain').send(script);
  } catch {
    res.status(404).send('# foundry.sh not found');
  }
});

app.get('/foundry.ps1', async (req, res) => {
  try {
    let script = await readFile(join(__dirname, '..', 'client', 'foundry.ps1'), 'utf-8');
    const serverUrl = PUBLIC_URL || `${req.protocol}://${req.headers.host}`;
    script = script.replace(
      /\{ "http:\/\/100\.106\.223\.39:18800" \}/,
      `{ "${serverUrl}" }`,
    );
    res.type('text/plain').send(script);
  } catch {
    res.status(404).send('# foundry.ps1 not found');
  }
});

// --- Start ---
app.listen(PORT, '0.0.0.0', () => {
  const stats = getProviderStats();
  const totalProviders = listProviders().length;
  log.ok(`Foundry Server v3.0 running on http://0.0.0.0:${PORT}`);
  log.ok(`${totalProviders} platforms: ${Object.entries(stats).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  log.note(`API key protection: ${API_KEY ? 'enabled' : 'disabled (set OCF_API_KEY to enable)'}`);
  log.note('Endpoints:');
  console.log('  POST /api/analyze           — AI analysis → Blueprint');
  console.log('  GET  /api/catalog           — Browse skills catalog');
  console.log('  GET  /api/providers         — List deployment platforms');
  console.log('  GET  /api/providers/:id     — Platform detail + requirements');
  console.log('  GET  /api/profiles          — List preset profiles');
  console.log('  GET  /api/health            — Health check');
  console.log('  POST /api/customers         — Create customer');
  console.log('  GET  /api/customers         — List customers');
  console.log('  POST /llm/v1/chat/completions — LLM proxy (OpenAI-compatible)');
  console.log('  GET  /foundry.sh            — Mac/Linux bootstrap script');
  console.log('  POST /api/deploy            — Start async deploy job');
  console.log('  GET  /api/deploy/:id        — Poll deploy status');
  console.log('  POST /api/arena             — Start arena match');
  console.log('  GET  /api/arena/:id         — Poll arena status');
  console.log('  GET  /api/stats             — Dashboard stats');
  console.log('  GET  /foundry.ps1           — Windows bootstrap script');
});

export { app };
