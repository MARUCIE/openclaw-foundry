import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import type { Customer, DailyUsage } from './types.js';
import { TIER_LIMITS } from './types.js';
import { log, today } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.OCF_DATA_DIR || join(__dirname, '..', 'data');
const DB_FILE = join(DATA_DIR, 'customers.json');

// --- In-memory cache ---
let db: Record<string, Customer> = {};
let loaded = false;

async function load(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await readFile(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
  } catch {
    db = {};
  }
  loaded = true;
}

async function save(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

// --- Token generation ---
function genId(): string {
  return 'cust_' + randomBytes(8).toString('hex');
}

function genToken(): string {
  return 'ocf_' + randomBytes(24).toString('hex');
}

// --- CRUD ---

export async function createCustomer(
  name: string,
  tier: Customer['tier'] = 'basic',
): Promise<Customer> {
  await load();

  const customer: Customer = {
    id: genId(),
    name,
    token: genToken(),
    tier,
    created: today(),
    active: true,
    usage: {},
  };

  db[customer.id] = customer;
  await save();
  log.ok(`Customer created: ${customer.id} (${name}, ${tier})`);
  return customer;
}

export async function getCustomerByToken(token: string): Promise<Customer | null> {
  await load();
  return Object.values(db).find(c => c.token === token && c.active) || null;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  await load();
  return db[id] || null;
}

export async function listCustomers(): Promise<Customer[]> {
  await load();
  return Object.values(db);
}

export async function updateTier(id: string, tier: Customer['tier']): Promise<boolean> {
  await load();
  if (!db[id]) return false;
  db[id].tier = tier;
  await save();
  return true;
}

export async function deactivateCustomer(id: string): Promise<boolean> {
  await load();
  if (!db[id]) return false;
  db[id].active = false;
  await save();
  return true;
}

// --- Usage tracking ---

export async function trackUsage(
  customerId: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  await load();
  const customer = db[customerId];
  if (!customer) return;

  const day = today();
  if (!customer.usage[day]) {
    customer.usage[day] = { requests: 0, inputTokens: 0, outputTokens: 0 };
  }
  customer.usage[day].requests++;
  customer.usage[day].inputTokens += inputTokens;
  customer.usage[day].outputTokens += outputTokens;
  await save();
}

export async function getDailyUsage(customerId: string): Promise<DailyUsage> {
  await load();
  const customer = db[customerId];
  if (!customer) return { requests: 0, inputTokens: 0, outputTokens: 0 };
  return customer.usage[today()] || { requests: 0, inputTokens: 0, outputTokens: 0 };
}

// --- Rate limiting ---

export async function checkRateLimit(customer: Customer): Promise<{ allowed: boolean; reason?: string }> {
  const limits = TIER_LIMITS[customer.tier];
  if (!limits) return { allowed: false, reason: 'Unknown tier' };

  // Unlimited
  if (limits.dailyRequests === -1) return { allowed: true };

  const usage = await getDailyUsage(customer.id);
  if (usage.requests >= limits.dailyRequests) {
    return {
      allowed: false,
      reason: `Daily limit reached (${usage.requests}/${limits.dailyRequests}). Upgrade tier or wait until tomorrow.`,
    };
  }
  return { allowed: true };
}

export function isModelAllowed(customer: Customer, model: string): boolean {
  const limits = TIER_LIMITS[customer.tier];
  if (!limits) return false;
  if (limits.models.includes('*')) return true;
  return limits.models.some(m => model.includes(m));
}

// --- Summary ---

export async function getUsageSummary(customerId: string): Promise<{
  total: DailyUsage;
  last7days: DailyUsage;
  today: DailyUsage;
}> {
  await load();
  const customer = db[customerId];
  if (!customer) {
    const empty = { requests: 0, inputTokens: 0, outputTokens: 0 };
    return { total: empty, last7days: empty, today: empty };
  }

  const todayStr = today();
  const days = Object.keys(customer.usage).sort();

  const total: DailyUsage = { requests: 0, inputTokens: 0, outputTokens: 0 };
  const last7: DailyUsage = { requests: 0, inputTokens: 0, outputTokens: 0 };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString().split('T')[0];

  for (const day of days) {
    const u = customer.usage[day];
    total.requests += u.requests;
    total.inputTokens += u.inputTokens;
    total.outputTokens += u.outputTokens;
    if (day >= cutoff) {
      last7.requests += u.requests;
      last7.inputTokens += u.inputTokens;
      last7.outputTokens += u.outputTokens;
    }
  }

  return {
    total,
    last7days: last7,
    today: customer.usage[todayStr] || { requests: 0, inputTokens: 0, outputTokens: 0 },
  };
}
