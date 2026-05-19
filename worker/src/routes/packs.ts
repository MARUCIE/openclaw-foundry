// Job Packs v2: 2-table model (pack_layers + config_packs)
// Query config_packs for listing, JOIN pack_layers for content resolution.

import { Hono, type Context } from 'hono';
import type { Env } from '../index';
import {
  extractBearer,
  randomToken,
  requireAuth,
  resolveSessionUser,
  sha256Hex,
  type AuthedUser,
} from '../lib/auth';

type PackContext = { Bindings: Env; Variables: { user: AuthedUser } };

export const packs = new Hono<PackContext>();

const DOWNLOAD_TOKEN_TTL_MIN = 15;
const DEFAULT_PACK_FILES = ['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md'];
const SAFE_PATH_RX = /^[A-Za-z0-9._/-]+$/;

// ── Types ──

interface PackRow {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh: string;
  icon: string;
  color: string;
  line: string;
  line_zh: string;
  layer_ids: string;
  version: string;
  download_count: number;
  created_at: string;
  updated_at: string;
}

interface LayerRow {
  id: string;
  type: string;
  name: string;
  name_zh: string;
  content_claude_md: string;
  content_agents_md: string;
  content_settings: string;
  content_prompts_md: string;
  sort_order: number;
}

// ── Mappers ──

function mapPack(row: PackRow) {
  const layerIds: string[] = JSON.parse(row.layer_ids || '[]');
  return {
    id: row.id,
    name: row.name,
    nameZh: row.name_zh,
    description: row.description,
    descriptionZh: row.description_zh,
    icon: row.icon,
    color: row.color,
    line: row.line,
    lineZh: row.line_zh,
    layerIds: layerIds,
    files: ['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md', 'install.sh'],
    version: row.version,
    downloadCount: row.download_count,
  };
}

function mergeLayers(layers: LayerRow[]) {
  const claudeMd = layers
    .map(l => l.content_claude_md)
    .filter(Boolean)
    .join('\n\n---\n\n');

  const agentsMd = layers
    .map(l => l.content_agents_md)
    .filter(Boolean)
    .join('\n\n---\n\n');

  const settings = layers.reduce((acc, l) => {
    try {
      const parsed = JSON.parse(l.content_settings || '{}');
      return deepMerge(acc, parsed);
    } catch {
      return acc;
    }
  }, {} as Record<string, unknown>);

  const promptsMd = layers.at(-1)?.content_prompts_md || '';

  return { claudeMd, agentsMd, settings, promptsMd };
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge((result[key] || {}) as Record<string, unknown>, val as Record<string, unknown>);
    } else {
      result[key] = val;
    }
  }
  return result;
}

function safePackId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,80}$/.test(id);
}

function safePackPath(path: string): boolean {
  return !!path &&
    path.length <= 240 &&
    SAFE_PATH_RX.test(path) &&
    !path.startsWith('/') &&
    !path.includes('..') &&
    !path.includes('\\');
}

function contentTypeFor(path: string): string {
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.sh')) return 'text/x-shellscript; charset=utf-8';
  if (path.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (path.endsWith('.csv')) return 'text/csv; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

async function loadMergedPack(db: D1Database, id: string) {
  const row = await db.prepare(
    'SELECT * FROM config_packs WHERE id = ?'
  ).bind(id).first<PackRow>();

  if (!row) return null;

  const layerIds: string[] = JSON.parse(row.layer_ids || '[]');
  let layers: LayerRow[] = [];
  if (layerIds.length > 0) {
    const placeholders = layerIds.map(() => '?').join(',');
    const { results } = await db.prepare(
      `SELECT * FROM pack_layers WHERE id IN (${placeholders}) ORDER BY sort_order`
    ).bind(...layerIds).all<LayerRow>();
    const layerMap = new Map((results || []).map(l => [l.id, l]));
    layers = layerIds.map(lid => layerMap.get(lid)!).filter(Boolean);
  }

  return { row, merged: mergeLayers(layers) };
}

async function packExists(env: Env, id: string): Promise<boolean> {
  const row = await env.DB.prepare('SELECT id FROM config_packs WHERE id = ?').bind(id).first<{ id: string }>();
  if (row) return true;
  const object = await env.STORAGE.head(`packs/${id}/manifest.json`) ||
    await env.STORAGE.head(`packs/${id}/CLAUDE.md`);
  return !!object;
}

async function hasDownloadAccess(c: Context<PackContext>, packId: string): Promise<boolean> {
  const bearer = extractBearer(c.req.header('Authorization'));
  const user = await resolveSessionUser(c.env.DB, bearer);
  if (user) return true;

  const token = c.req.query('token');
  if (!token) return false;
  const tokenHash = await sha256Hex(token);
  const row = await c.env.DB.prepare(
    `SELECT token_hash FROM pack_download_tokens
     WHERE token_hash = ?
       AND pack_id = ?
       AND expires_at > datetime('now')
     LIMIT 1`,
  ).bind(tokenHash, packId).first<{ token_hash: string }>();
  if (!row) return false;
  await c.env.DB.prepare(
    `UPDATE pack_download_tokens SET last_used_at = datetime('now') WHERE token_hash = ?`,
  ).bind(tokenHash).run();
  return true;
}

function makeSyntheticManifest(packId: string) {
  return JSON.stringify({
    pack: packId,
    items: DEFAULT_PACK_FILES.map((file) => ({ src: file, dst: file, type: 'config' })),
  }, null, 2);
}

function generateProtectedInstallScript(packId: string, token: string, apiBase: string) {
  return `#!/bin/bash
# OpenClaw Foundry — Protected Job Pack Installer
# Pack: ${packId}
set -euo pipefail

PACK_ID="${packId}"
FOUNDRY_DOWNLOAD_TOKEN="${token}"
FOUNDRY_API_BASE="\${FOUNDRY_API_BASE:-${apiBase}}"
TARGET_DIR="\${INSTALL_DEST:-\$HOME/.claude}"

urlencode() {
  python3 - "$1" <<'PYEOF'
import sys, urllib.parse
print(urllib.parse.quote(sys.argv[1], safe=''))
PYEOF
}

fetch_pack_file() {
  local src="$1"
  local dst="$2"
  local encoded
  encoded="$(urlencode "$src")"
  curl -sfL "\${FOUNDRY_API_BASE}/api/packs/\${PACK_ID}/file?token=\${FOUNDRY_DOWNLOAD_TOKEN}&path=\${encoded}" -o "$dst"
}

echo "Installing OpenClaw Job Pack: \${PACK_ID}"
echo "  Target: \${TARGET_DIR}"
mkdir -p "\${TARGET_DIR}"

WORK="$(mktemp -d)"
trap 'rm -rf "\${WORK}"' EXIT
MANIFEST="\${WORK}/manifest.json"
TSV="\${WORK}/items.tsv"

if fetch_pack_file "manifest.json" "\${MANIFEST}" && [ -s "\${MANIFEST}" ]; then
  python3 - "\${MANIFEST}" <<'PYEOF' > "\${TSV}"
import json, sys
m = json.load(open(sys.argv[1]))
items = m.get('items') or []
if not items:
    items = [{'src': f, 'dst': f, 'type': 'config'} for f in ['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md']]
for item in items:
    print(item['src'], item.get('dst') or item['src'], item.get('type') or 'file', sep='\\t')
PYEOF
else
  cat > "\${TSV}" <<'EOF'
CLAUDE.md	CLAUDE.md	config
AGENTS.md	AGENTS.md	config
settings.json	settings.json	config
prompts.md	prompts.md	config
EOF
fi

N="$(wc -l < "\${TSV}" | tr -d ' ')"
echo "  -> \${N} artifact(s) to install"
i=0
while IFS=$'\\t' read -r src dst typ; do
  i=$((i+1))
  full_dst="\${TARGET_DIR}/\${dst}"
  mkdir -p "$(dirname "\${full_dst}")"
  printf "  [%2d/%d] %-10s %s\\n" "\${i}" "\${N}" "\${typ}" "\${dst}"
  fetch_pack_file "\${src}" "\${full_dst}"
done < "\${TSV}"

echo ""
echo "OK Installed \${N} artifact(s). Restart Claude Code to activate."
`;
}

async function loadPackFile(env: Env, packId: string, path: string, tokenForInstaller: string, apiBase: string) {
  if (path === 'install.sh') {
    return {
      body: generateProtectedInstallScript(packId, tokenForInstaller, apiBase),
      contentType: contentTypeFor(path),
    };
  }

  const object = await env.STORAGE.get(`packs/${packId}/${path}`);
  if (object) {
    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType || contentTypeFor(path),
    };
  }

  const pack = await loadMergedPack(env.DB, packId);
  if (!pack) return null;
  const files: Record<string, string> = {
    'CLAUDE.md': pack.merged.claudeMd,
    'AGENTS.md': pack.merged.agentsMd,
    'settings.json': JSON.stringify(pack.merged.settings, null, 2),
    'prompts.md': pack.merged.promptsMd,
    'manifest.json': makeSyntheticManifest(packId),
  };
  const body = files[path];
  if (body === undefined) return null;
  return { body, contentType: contentTypeFor(path) };
}

// ── Routes ──

// List all packs (public) — grouped by line
packs.get('/', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM config_packs ORDER BY line, download_count DESC'
  ).all<PackRow>();

  const packList = (results || []).map(mapPack);

  // Group by line
  const lineMap = new Map<string, { id: string; name: string; packs: ReturnType<typeof mapPack>[] }>();
  for (const p of packList) {
    if (!lineMap.has(p.line)) {
      lineMap.set(p.line, { id: p.line, name: p.lineZh, packs: [] });
    }
    lineMap.get(p.line)!.packs.push(p);
  }

  return c.json({
    total: packList.length,
    generated: new Date().toISOString(),
    lines: Array.from(lineMap.values()),
    packs: packList,
  });
});

// Get single pack with resolved layers (public)
packs.get('/:id', async (c) => {
  const id = c.req.param('id');
  const pack = await loadMergedPack(c.env.DB, id);
  if (!pack) return c.json({ error: 'Pack not found' }, 404);

  return c.json({
    pack: {
      ...mapPack(pack.row),
      claudeMd: pack.merged.claudeMd,
      agentsMd: pack.merged.agentsMd,
      settings: pack.merged.settings,
      promptsMd: pack.merged.promptsMd,
    },
  });
});

// Mint a short-lived token for shell/browser pack downloads.
packs.post('/:id/download-token', requireAuth(), async (c) => {
  const id = c.req.param('id');
  if (!safePackId(id)) return c.json({ error: 'invalid pack id' }, 400);
  if (!(await packExists(c.env, id))) return c.json({ error: 'Pack not found' }, 404);

  const user = c.var.user;
  const plaintext = randomToken();
  const hash = await sha256Hex(plaintext);
  const expiresAt = new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MIN * 60_000).toISOString();
  await c.env.DB.prepare(
    `INSERT INTO pack_download_tokens (token_hash, pack_id, user_id, expires_at)
     VALUES (?, ?, ?, ?)`,
  ).bind(hash, id, user.id, expiresAt).run();
  await c.env.DB.prepare(
    `UPDATE config_packs SET download_count = download_count + 1, updated_at = datetime('now') WHERE id = ?`,
  ).bind(id).run();
  return c.json({
    token: plaintext,
    pack_id: id,
    expires_at: expiresAt,
    expires_minutes: DOWNLOAD_TOKEN_TTL_MIN,
  });
});

// Protected pack file delivery. Browsing stays public; file payloads require
// either an active Bearer session or a short-lived download token minted above.
packs.get('/:id/file', async (c) => {
  const id = c.req.param('id');
  const path = c.req.query('path') || '';
  if (!safePackId(id)) return c.json({ error: 'invalid pack id' }, 400);
  if (!safePackPath(path)) return c.json({ error: 'invalid file path' }, 400);
  if (!(await hasDownloadAccess(c, id))) {
    return c.json({ error: 'registration required before copy/download' }, 401);
  }

  const bearer = extractBearer(c.req.header('Authorization'));
  const tokenForInstaller = c.req.query('token') || bearer || '';
  const apiBase = new URL(c.req.url).origin;
  const file = await loadPackFile(c.env, id, path, tokenForInstaller, apiBase);
  if (!file) return c.json({ error: 'Pack file not found' }, 404);

  return new Response(file.body, {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'private, max-age=0, no-store',
      'Content-Disposition': `attachment; filename="${path.split('/').pop() || path}"`,
    },
  });
});

// Track download (increment counter)
packs.get('/:id/download', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const row = await db.prepare(
    'SELECT id FROM config_packs WHERE id = ?'
  ).bind(id).first<PackRow>();

  if (!row) return c.json({ error: 'Pack not found' }, 404);

  await db.prepare(
    'UPDATE config_packs SET download_count = download_count + 1, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(id).run();

  return c.json({ ok: true, id });
});
