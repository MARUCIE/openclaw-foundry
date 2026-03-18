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
  res.json({ status: 'ok', version: '0.1.0', uptime: process.uptime() });
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
  log.ok(`Foundry Server running on http://0.0.0.0:${PORT}`);
  log.note(`API key protection: ${API_KEY ? 'enabled' : 'disabled (set OCF_API_KEY to enable)'}`);
  log.note('Endpoints:');
  console.log('  POST /api/analyze        — AI analysis → Blueprint');
  console.log('  GET  /api/catalog        — Browse skills catalog');
  console.log('  GET  /api/profiles       — List preset profiles');
  console.log('  GET  /api/health         — Health check');
  console.log('  POST /api/customers      — Create customer');
  console.log('  GET  /api/customers      — List customers');
  console.log('  GET  /api/customers/:id  — Customer detail + usage');
  console.log('  POST /llm/v1/chat/completions — LLM proxy (OpenAI-compatible)');
  console.log('  GET  /foundry.sh         — Mac/Linux bootstrap script');
  console.log('  GET  /foundry.ps1        — Windows bootstrap script');
});

export { app };
