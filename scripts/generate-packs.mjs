#!/usr/bin/env node
/**
 * generate-packs.mjs — Build-time pack generation script
 *
 * Reads seed-layers.sql + seed-packs-v2.sql, merges layers per pack,
 * outputs 10 x 5 = 50 static files + packs.json to web/public/packs/
 *
 * Usage: node scripts/generate-packs.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WORKER_SRC = join(ROOT, 'worker', 'src');
const PUBLIC_PACKS = join(ROOT, 'web', 'public', 'packs');
const PUBLIC_DATA = join(ROOT, 'web', 'public', 'data');
const SITE_URL = 'https://openclaw-foundry.pages.dev';

// ============================================================
// SQL Parser: extract INSERT values from seed files
// ============================================================

/**
 * Parse pack_layers from seed-layers.sql
 * Each INSERT has: (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md)
 */
function parseLayers(sql) {
  const layers = new Map();

  // Match each INSERT OR REPLACE statement
  const insertRegex = /INSERT OR REPLACE INTO pack_layers[^V]*?VALUES\s*\(\s*'([^']+)',\s*'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*--\s*content_claude_md\s*'([\s\S]*?)',\s*--\s*content_agents_md\s*'([\s\S]*?)',\s*--\s*content_settings[^']*'([\s\S]*?)',\s*--\s*content_prompts_md[^']*'([\s\S]*?)'\s*\)/g;

  // Simpler approach: parse SQL manually by splitting on INSERT statements
  const insertBlocks = sql.split(/INSERT OR REPLACE INTO pack_layers/);

  for (const block of insertBlocks) {
    if (!block.includes('VALUES')) continue;

    // Extract the VALUES portion
    const valuesMatch = block.match(/VALUES\s*\(([\s\S]+)\)\s*;/);
    if (!valuesMatch) continue;

    const valuesStr = valuesMatch[1];

    // Parse SQL string values - handle escaped single quotes
    const values = parseSqlValues(valuesStr);
    if (values.length < 9) continue;

    const [id, type, name, nameZh, sortOrder, claudeMd, agentsMd, settings, promptsMd] = values;

    layers.set(id, {
      id,
      type,
      name,
      name_zh: nameZh,
      sort_order: parseInt(sortOrder) || 0,
      content_claude_md: claudeMd,
      content_agents_md: agentsMd,
      content_settings: settings,
      content_prompts_md: promptsMd,
    });
  }

  return layers;
}

/**
 * Parse config_packs from seed-packs-v2.sql
 * Each INSERT has: (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version)
 */
function parsePacks(sql) {
  const packs = [];

  const insertBlocks = sql.split(/INSERT OR REPLACE INTO config_packs/);

  for (const block of insertBlocks) {
    if (!block.includes('VALUES')) continue;

    const valuesMatch = block.match(/VALUES\s*\(([\s\S]+)\)\s*;/);
    if (!valuesMatch) continue;

    const values = parseSqlValues(valuesMatch[1]);
    if (values.length < 11) continue;

    const [id, name, nameZh, desc, descZh, icon, color, line, lineZh, layerIdsStr, version] = values;

    packs.push({
      id,
      name,
      name_zh: nameZh,
      description: desc,
      description_zh: descZh,
      icon,
      color,
      line,
      line_zh: lineZh,
      layer_ids: JSON.parse(layerIdsStr),
      version,
    });
  }

  return packs;
}

/**
 * Parse SQL VALUES string into array of values.
 * Handles: 'string with ''escaped'' quotes', numbers, JSON strings
 */
function parseSqlValues(str) {
  const values = [];
  let i = 0;
  const s = str.trim();

  while (i < s.length) {
    // Skip whitespace and commas
    while (i < s.length && (s[i] === ' ' || s[i] === '\n' || s[i] === '\r' || s[i] === '\t' || s[i] === ',')) i++;
    if (i >= s.length) break;

    // Skip SQL comments (-- ...)
    if (s[i] === '-' && s[i + 1] === '-') {
      while (i < s.length && s[i] !== '\n') i++;
      continue;
    }

    if (s[i] === "'") {
      // String value
      i++; // skip opening quote
      let val = '';
      while (i < s.length) {
        if (s[i] === "'" && s[i + 1] === "'") {
          val += "'";
          i += 2;
        } else if (s[i] === "'") {
          i++; // skip closing quote
          break;
        } else {
          val += s[i];
          i++;
        }
      }
      values.push(val);
    } else if (s[i] >= '0' && s[i] <= '9') {
      // Number value
      let val = '';
      while (i < s.length && s[i] >= '0' && s[i] <= '9') {
        val += s[i];
        i++;
      }
      values.push(val);
    }
  }

  return values;
}

// ============================================================
// Layer Merger: pure function, no side effects
// ============================================================

/**
 * Merge layers for a pack. Returns the 5 file contents.
 */
function mergeLayers(pack, layers) {
  const orderedLayers = pack.layer_ids.map(id => {
    const layer = layers.get(id);
    if (!layer) throw new Error(`Layer not found: ${id} (pack: ${pack.id})`);
    return layer;
  });

  // CLAUDE.md: string concatenation (L0 + L1 + L2)
  const claudeMd = orderedLayers
    .map(l => l.content_claude_md)
    .filter(Boolean)
    .join('\n\n---\n\n');

  // AGENTS.md: string concatenation
  const agentsMd = orderedLayers
    .map(l => l.content_agents_md)
    .filter(Boolean)
    .join('\n\n---\n\n');

  // settings.json: deep merge (later layers override earlier)
  const mergedSettings = orderedLayers.reduce((acc, l) => {
    try {
      const parsed = JSON.parse(l.content_settings || '{}');
      return deepMerge(acc, parsed);
    } catch {
      return acc;
    }
  }, {});

  // prompts.md: role-specific only (last layer)
  const promptsMd = orderedLayers.at(-1)?.content_prompts_md || '';

  // install.sh: template
  const installSh = generateInstallScript(pack.id);

  return { claudeMd, agentsMd, settings: mergedSettings, promptsMd, installSh };
}

/**
 * Deep merge two objects. Arrays are unioned (for MCP servers).
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Generate install.sh for a pack
 */
function generateInstallScript(packId) {
  return `#!/bin/bash
# OpenClaw Foundry — Job Pack Installer
# Pack: ${packId}
# Usage: curl -sL ${SITE_URL}/packs/${packId}/install.sh | bash

set -euo pipefail

PACK_ID="${packId}"
BASE_URL="${SITE_URL}/packs/\${PACK_ID}"
TARGET_DIR="\${HOME}/.claude"

echo "Installing OpenClaw Job Pack: \${PACK_ID}..."
echo ""

# Create target directory
mkdir -p "\${TARGET_DIR}"

# Download files
echo "  Downloading CLAUDE.md..."
curl -sfL "\${BASE_URL}/CLAUDE.md" -o "\${TARGET_DIR}/CLAUDE.md"

echo "  Downloading AGENTS.md..."
curl -sfL "\${BASE_URL}/AGENTS.md" -o "\${TARGET_DIR}/AGENTS.md"

echo "  Downloading settings.json..."
curl -sfL "\${BASE_URL}/settings.json" -o "\${TARGET_DIR}/settings.json"

echo "  Downloading prompts.md..."
curl -sfL "\${BASE_URL}/prompts.md" -o "\${TARGET_DIR}/prompts.md"

echo ""
echo "Done! Pack '\${PACK_ID}' installed to \${TARGET_DIR}/"
echo ""
echo "Files installed:"
echo "  \${TARGET_DIR}/CLAUDE.md      — AI agent configuration"
echo "  \${TARGET_DIR}/AGENTS.md      — Agent team definitions"
echo "  \${TARGET_DIR}/settings.json  — MCP server settings"
echo "  \${TARGET_DIR}/prompts.md     — Starter prompts"
echo ""
echo "Restart Claude Code to activate the new configuration."
`;
}

// ============================================================
// Main: read SQL, merge, write files
// ============================================================

function main() {
  console.log('OpenClaw Foundry — Pack Generator v2.0');
  console.log('======================================\n');

  // Read SQL files
  const layersSql = readFileSync(join(WORKER_SRC, 'seed-layers.sql'), 'utf-8');
  const packsSql = readFileSync(join(WORKER_SRC, 'seed-packs-v2.sql'), 'utf-8');

  // Parse
  const layers = parseLayers(layersSql);
  const packs = parsePacks(packsSql);

  console.log(`Parsed: ${layers.size} layers, ${packs.length} packs\n`);

  if (layers.size === 0) {
    console.error('ERROR: No layers parsed from seed-layers.sql');
    process.exit(1);
  }
  if (packs.length === 0) {
    console.error('ERROR: No packs parsed from seed-packs-v2.sql');
    process.exit(1);
  }

  // Clean old packs directory
  if (existsSync(PUBLIC_PACKS)) {
    // Don't rm -rf, just overwrite
    console.log('NOTE: Overwriting existing packs directory\n');
  }

  let totalFiles = 0;
  const packListing = [];

  // Generate each pack
  for (const pack of packs) {
    console.log(`Generating: ${pack.id} (${pack.name_zh})...`);

    const merged = mergeLayers(pack, layers);
    const packDir = join(PUBLIC_PACKS, pack.id);
    mkdirSync(packDir, { recursive: true });

    // Write 5 files
    writeFileSync(join(packDir, 'CLAUDE.md'), merged.claudeMd, 'utf-8');
    writeFileSync(join(packDir, 'AGENTS.md'), merged.agentsMd, 'utf-8');
    writeFileSync(join(packDir, 'settings.json'), JSON.stringify(merged.settings, null, 2), 'utf-8');
    writeFileSync(join(packDir, 'prompts.md'), merged.promptsMd, 'utf-8');
    writeFileSync(join(packDir, 'install.sh'), merged.installSh, 'utf-8');

    totalFiles += 5;

    // Add to listing
    packListing.push({
      id: pack.id,
      name: pack.name,
      nameZh: pack.name_zh,
      description: pack.description,
      descriptionZh: pack.description_zh,
      icon: pack.icon,
      color: pack.color,
      line: pack.line,
      lineZh: pack.line_zh,
      layerIds: pack.layer_ids,
      version: pack.version,
      files: ['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md', 'install.sh'],
      downloadCount: 0,
    });

    console.log(`  -> ${packDir}/ (5 files)`);
  }

  // Group by line for packs.json
  const lines = [...new Set(packs.map(p => p.line))];
  const groupedListing = {
    total: packs.length,
    generated: new Date().toISOString(),
    lines: lines.map(lineId => {
      const linePacks = packListing.filter(p => p.line === lineId);
      return {
        id: lineId,
        name: linePacks[0]?.lineZh || lineId,
        packs: linePacks,
      };
    }),
    packs: packListing,
  };

  // Write packs.json
  mkdirSync(PUBLIC_DATA, { recursive: true });
  writeFileSync(join(PUBLIC_DATA, 'packs.json'), JSON.stringify(groupedListing, null, 2), 'utf-8');

  console.log(`\nWrote: ${join(PUBLIC_DATA, 'packs.json')}`);
  console.log(`\nTotal: ${packs.length} packs, ${totalFiles} files generated.`);
  console.log('Done.');
}

main();
