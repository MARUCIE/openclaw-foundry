#!/usr/bin/env node

/**
 * Official MCP Registry Scraper
 *
 * Source: https://registry.modelcontextprotocol.io/v0/servers
 * API: REST v0.1 (frozen, no breaking changes)
 * Pagination: cursor-based, 30 items per page
 *
 * Output: data/mcp-registry-servers.json
 *
 * Usage:
 *   node scripts/scrape-mcp-registry.mjs
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, '..');
const DATA_DIR = join(PROJECT, 'data');
const OUTPUT_FILE = join(DATA_DIR, 'mcp-registry-servers.json');

const BASE_URL = 'https://registry.modelcontextprotocol.io/v0/servers';
const DELAY_MS = 500; // conservative rate limiting

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(cursor) {
  const url = cursor ? `${BASE_URL}?cursor=${encodeURIComponent(cursor)}` : BASE_URL;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'OpenClaw-Foundry/1.0 (skill-registry-sync)',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// Normalize MCP registry server to unified skill format
function normalizeServer(entry) {
  const s = entry.server || {};
  const meta = entry._meta?.['io.modelcontextprotocol.registry/official'] || {};

  const name = s.name || '';
  const slug = name.replace(/[^a-zA-Z0-9-_.\/]/g, '-').toLowerCase();
  const author = name.split('/')[0] || 'unknown';
  const shortName = name.split('/').pop() || name;

  // Detect category from name + description
  const desc = s.description || '';

  // Detect if remote-capable
  const hasRemote = (s.remotes || []).length > 0;
  const platforms = [];
  if (hasRemote) platforms.push('Remote');

  return {
    id: `mcp-registry:${name}`,
    name: shortName,
    slug,
    author,
    description: desc,
    source: 'mcp-registry',
    sourceUrl: `https://registry.modelcontextprotocol.io/servers/${encodeURIComponent(name)}`,
    version: s.version || '',
    repositoryUrl: s.repository?.url || '',
    websiteUrl: s.websiteUrl || '',
    remoteUrl: (s.remotes || [])[0]?.url || '',
    remoteType: (s.remotes || [])[0]?.type || '',
    platforms,
    status: meta.status || 'unknown',
    publishedAt: meta.publishedAt || '',
    updatedAt: meta.updatedAt || '',
    isLatest: meta.isLatest || false,
  };
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  console.log('NOTE: Fetching Official MCP Registry...');

  const allServers = [];
  let cursor = null;
  let page = 0;

  while (true) {
    page++;
    const data = await fetchPage(cursor);
    const servers = data.servers || [];

    if (servers.length === 0) break;

    for (const entry of servers) {
      allServers.push(normalizeServer(entry));
    }

    console.log(`  Page ${page}: ${servers.length} servers (total: ${allServers.length})`);

    cursor = data.metadata?.nextCursor;
    if (!cursor) break;

    await sleep(DELAY_MS);
  }

  console.log(`OK: Fetched ${allServers.length} servers from Official MCP Registry`);

  const output = {
    meta: {
      source: 'https://registry.modelcontextprotocol.io',
      apiVersion: 'v0.1',
      syncedAt: new Date().toISOString(),
      total: allServers.length,
    },
    servers: allServers,
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`OK: Saved to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
