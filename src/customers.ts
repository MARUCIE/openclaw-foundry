import { readFile, mkdir, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import Database from 'better-sqlite3';
import type { Customer, DailyUsage } from './types.js';
import { TIER_LIMITS } from './types.js';
import { log, today } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.OCF_DATA_DIR || join(__dirname, '..', 'data');
const DB_FILE = join(DATA_DIR, 'foundry.db');
const LEGACY_JSON = join(DATA_DIR, 'customers.json');

let _db: any = null;

function getDb() {
  if (_db) return _db;
  mkdir(DATA_DIR, { recursive: true }).catch(() => {});
  _db = new Database(DB_FILE);
  _db.pragma('journal_mode = WAL');

  // Initialize tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      tier TEXT NOT NULL,
      created TEXT NOT NULL,
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS usage (
      customerId TEXT NOT NULL,
      day TEXT NOT NULL,
      requests INTEGER DEFAULT 0,
      inputTokens INTEGER DEFAULT 0,
      outputTokens INTEGER DEFAULT 0,
      PRIMARY KEY (customerId, day),
      FOREIGN KEY (customerId) REFERENCES customers(id)
    );
  `);
  return _db;
}

// --- Migration ---

export async function migrateFromJson() {
  try {
    const raw = await readFile(LEGACY_JSON, 'utf-8');
    const legacyDb = JSON.parse(raw) as Record<string, any>;
    const db = getDb();

    const insertCust = db.prepare('INSERT OR IGNORE INTO customers (id, name, token, tier, created, active) VALUES (?, ?, ?, ?, ?, ?)');
    const insertUsage = db.prepare('INSERT OR IGNORE INTO usage (customerId, day, requests, inputTokens, outputTokens) VALUES (?, ?, ?, ?, ?)');

    const transaction = db.transaction((data: any) => {
      for (const val of Object.values(data)) {
        const c = val as any;
        insertCust.run(c.id, c.name, c.token, c.tier, c.created, c.active ? 1 : 0);
        for (const [day, u] of Object.entries(c.usage || {})) {
          const usage = u as any;
          insertUsage.run(c.id, day, usage.requests, usage.inputTokens, usage.outputTokens);
        }
      }
    });

    transaction(legacyDb);
    log.ok(`Migrated ${Object.keys(legacyDb).length} customers from JSON to SQLite`);
    await unlink(LEGACY_JSON);
  } catch (err) {
    // No legacy file or migration failed
  }
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
  const db = getDb();
  const customer: Customer = {
    id: genId(),
    name,
    token: genToken(),
    tier,
    created: today(),
    active: true,
    usage: {},
  };

  db.prepare('INSERT INTO customers (id, name, token, tier, created, active) VALUES (?, ?, ?, ?, ?, ?)').run(
    customer.id, customer.name, customer.token, customer.tier, customer.created, 1
  );

  log.ok(`Customer created: ${customer.id} (${name}, ${tier})`);
  return customer;
}

export async function getCustomerByToken(token: string): Promise<Customer | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE token = ? AND active = 1').get(token) as any;
  if (!row) return null;
  return { ...row, active: !!row.active, usage: {} };
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any;
  if (!row) return null;
  return { ...row, active: !!row.active, usage: {} };
}

export async function listCustomers(): Promise<Customer[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM customers').all() as any[];
  return rows.map(r => ({ ...r, active: !!r.active, usage: {} }));
}

export async function updateTier(id: string, tier: Customer['tier']): Promise<boolean> {
  const db = getDb();
  const result = db.prepare('UPDATE customers SET tier = ? WHERE id = ?').run(tier, id);
  return result.changes > 0;
}

export async function deactivateCustomer(id: string): Promise<boolean> {
  const db = getDb();
  const result = db.prepare('UPDATE customers SET active = 0 WHERE id = ?').run(id);
  return result.changes > 0;
}

// --- Usage tracking ---

export async function trackUsage(
  customerId: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  const db = getDb();
  const day = today();

  db.prepare(`
    INSERT INTO usage (customerId, day, requests, inputTokens, outputTokens)
    VALUES (?, ?, 1, ?, ?)
    ON CONFLICT(customerId, day) DO UPDATE SET
      requests = requests + 1,
      inputTokens = inputTokens + excluded.inputTokens,
      outputTokens = outputTokens + excluded.outputTokens
  `).run(customerId, day, inputTokens, outputTokens);
}

export async function getDailyUsage(customerId: string): Promise<DailyUsage> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM usage WHERE customerId = ? AND day = ?').get(customerId, today()) as any;
  return row || { requests: 0, inputTokens: 0, outputTokens: 0 };
}

// --- Rate limiting ---

export async function checkRateLimit(customer: Customer): Promise<{ allowed: boolean; reason?: string }> {
  const limits = TIER_LIMITS[customer.tier];
  if (!limits) return { allowed: false, reason: 'Unknown tier' };

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
  const db = getDb();
  const todayStr = today();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString().split('T')[0];

  const stats = db.prepare(`
    SELECT
      SUM(requests) as totalReq, SUM(inputTokens) as totalIn, SUM(outputTokens) as totalOut,
      SUM(CASE WHEN day >= ? THEN requests ELSE 0 END) as last7Req,
      SUM(CASE WHEN day >= ? THEN inputTokens ELSE 0 END) as last7In,
      SUM(CASE WHEN day >= ? THEN outputTokens ELSE 0 END) as last7Out,
      SUM(CASE WHEN day = ? THEN requests ELSE 0 END) as todayReq,
      SUM(CASE WHEN day = ? THEN inputTokens ELSE 0 END) as todayIn,
      SUM(CASE WHEN day = ? THEN outputTokens ELSE 0 END) as todayOut
    FROM usage
    WHERE customerId = ?
  `).get(cutoff, cutoff, cutoff, todayStr, todayStr, todayStr, customerId) as any;

  const res = {
    total: { requests: stats?.totalReq || 0, inputTokens: stats?.totalIn || 0, outputTokens: stats?.totalOut || 0 },
    last7days: { requests: stats?.last7Req || 0, inputTokens: stats?.last7In || 0, outputTokens: stats?.last7Out || 0 },
    today: { requests: stats?.todayReq || 0, inputTokens: stats?.todayIn || 0, outputTokens: stats?.todayOut || 0 }
  };

  return res;
}