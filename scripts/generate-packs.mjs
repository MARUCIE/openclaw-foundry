#!/usr/bin/env node
/**
 * generate-packs.mjs — Build-time pack generation script (v4.0 JSON-driven)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data', 'job-packs');
const PUBLIC_PACKS = join(ROOT, 'web', 'public', 'packs');
const PUBLIC_DATA = join(ROOT, 'web', 'public', 'data');
const SITE_URL = 'https://agent-foundry.pages.dev';

function deepMerge(target, source) {
  if (!source) return target;
  if (typeof source !== 'object' || Array.isArray(source)) return source;
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

function mergeLayers(pack, layersMap) {
  const orderedLayers = pack.layerIds.map(id => {
    const layer = layersMap.get(id);
    if (!layer) throw new Error(`Layer not found: ${id} (pack: ${pack.id})`);
    return layer;
  });

  const claudeMd = orderedLayers.map(l => l.content.claudeMd).filter(Boolean).join('\n\n---\n\n');
  const agentsMd = orderedLayers.map(l => l.content.agentsMd).filter(Boolean).join('\n\n---\n\n');
  const settings = orderedLayers.reduce((acc, l) => deepMerge(acc, l.content.settingsJson || {}), {});
  const promptsMd = orderedLayers.map(l => l.content.promptsMd).filter(Boolean).join('\n\n---\n\n');

  return { claudeMd, agentsMd, settings, promptsMd };
}

function generateInstallScript(packId) {
  // Use escaped dollar signs for literal shell variables
  return `#!/bin/bash
# OpenClaw Foundry — Job Pack Installer (v4.0)
# Pack: ${packId}
set -euo pipefail
PACK_ID="${packId}"
BASE_URL="${SITE_URL}/packs/${packId}"
TARGET_DIR="\${INSTALL_DEST:-\$HOME/.claude}"
# R3.2 (audit F9): warn if Claude Code dir missing — install will succeed
# mechanically but produce no usable agent surface. Soft-fail, do not block.
if [ -z "\${INSTALL_DEST:-}" ] && [ ! -d "\$HOME/.claude" ]; then
  echo "  WARN: \$HOME/.claude does not exist (Claude Code not detected)"
  echo "        Install Claude Code first: https://claude.com/code"
  echo "        Or set INSTALL_DEST=/your/agent/dir and re-run"
  echo ""
fi
echo "Installing OpenClaw Job Pack: \$PACK_ID..."
mkdir -p "\$TARGET_DIR"
for f in CLAUDE.md AGENTS.md settings.json prompts.md; do
  echo "  Downloading \$f..."
  curl -sfL "\$BASE_URL/\$f" -o "\$TARGET_DIR/\$f"
done

# Jobs-fix (2026-05-16 audit): legacy installer also reads first_use_demo if a manifest exists.
# Most native (non-manifest) packs lack a manifest, in which case the legacy "Restart Claude Code"
# line is kept. When a manifest is present (forward-compat), surface the hint.
MAYBE_MANIFEST=\$(mktemp -t pack-manifest-XXXXXX)
if curl -fsSL "\$BASE_URL/manifest.json" -o "\$MAYBE_MANIFEST" 2>/dev/null && [ -s "\$MAYBE_MANIFEST" ]; then
  HINT=\$(python3 - "\$MAYBE_MANIFEST" <<'PYEOF2'
import json, sys
try:
    m = json.load(open(sys.argv[1]))
    fud = m.get('first_use_demo') or {}
    cmd = fud.get('command', '').strip()
    if cmd:
        print(cmd)
except Exception:
    pass
PYEOF2
)
  rm -f "\$MAYBE_MANIFEST"
  if [ -n "\$HINT" ]; then
    echo ""
    echo "  Now try:"
    echo "    \$HINT"
  else
    echo -e "\\nDone! Restart Claude Code to activate."
  fi
else
  rm -f "\$MAYBE_MANIFEST"
  echo -e "\\nDone! Restart Claude Code to activate."
fi
`;
}

function generateManifestDrivenInstallScript(packId) {
  // For packs with artifacts (skills/ + agents/): manifest-driven install
  return `#!/bin/bash
# OpenClaw Foundry — Job Pack Installer (v4.1, manifest-driven)
# Pack: ${packId}
set -euo pipefail
PACK_ID="${packId}"
BASE_URL="\${FOUNDRY_BASE_URL:-${SITE_URL}}/packs/\$PACK_ID"
TARGET_DIR="\${INSTALL_DEST:-\$HOME/.claude}"

echo "Installing OpenClaw Job Pack: \$PACK_ID (manifest-driven)"
echo "  Source: \$BASE_URL"
echo "  Target: \$TARGET_DIR"
echo ""

# R3.2 (audit F9): warn if Claude Code dir missing — install will succeed
# mechanically but produce no usable agent surface. Soft-fail, do not block.
if [ -z "\${INSTALL_DEST:-}" ] && [ ! -d "\$HOME/.claude" ]; then
  echo "  WARN: \$HOME/.claude does not exist (Claude Code not detected)"
  echo "        Install Claude Code first: https://claude.com/code"
  echo "        Or set INSTALL_DEST=/your/agent/dir and re-run"
  echo ""
fi

mkdir -p "\$TARGET_DIR"

WORK=\$(mktemp -d)
trap 'rm -rf "\$WORK"' EXIT
MANIFEST="\$WORK/manifest.json"
TSV="\$WORK/items.tsv"

echo "  -> Fetching manifest.json"
curl -sfL "\$BASE_URL/manifest.json" -o "\$MANIFEST"

python3 - "\$MANIFEST" <<'PYEOF' > "\$TSV"
import json, sys
m = json.load(open(sys.argv[1]))
for item in m['items']:
    print(item['src'], item['dst'], item['type'], sep='\\t')
PYEOF

N=\$(wc -l < "\$TSV" | tr -d ' ')
echo "  -> \$N artifacts to install"
echo ""

i=0
while IFS=\$'\\t' read -r src dst typ; do
  i=\$((i+1))
  full_dst="\$TARGET_DIR/\$dst"
  mkdir -p "\$(dirname "\$full_dst")"
  printf "  [%2d/%d] %-10s %s\\n" "\$i" "\$N" "\$typ" "\$dst"
  curl -sfL "\$BASE_URL/\$src" -o "\$full_dst"
done < "\$TSV"

echo ""
echo "  OK Installed \$N artifacts under \$TARGET_DIR"

# Jobs-fix (2026-05-16 audit): if manifest declares first_use_demo, print it as next-step hint.
# Fleet-wide leverage point — eliminates the "installed but unusable" UX gap across all 21 packs.
HINT=\$(python3 - "\$MANIFEST" <<'PYEOF2'
import json, sys
m = json.load(open(sys.argv[1]))
fud = m.get('first_use_demo') or {}
cmd = fud.get('command', '').strip()
if cmd:
    print(cmd)
PYEOF2
)
if [ -n "\$HINT" ]; then
  echo ""
  echo "  Now try:"
  echo "    \$HINT"
else
  echo "  Restart Claude Code to activate."
fi
`;
}

function main() {
  console.log('OpenClaw Foundry — Pack Generator v4.0');
  console.log('======================================\n');

  const layersMap = new Map();
  const layerFiles = readdirSync(join(DATA_DIR, 'layers')).filter(f => f.endsWith('.json'));
  for (const f of layerFiles) {
    const layer = JSON.parse(readFileSync(join(DATA_DIR, 'layers', f), 'utf-8'));
    layersMap.set(layer.id, layer);
  }

  const packFiles = readdirSync(join(DATA_DIR, 'packs')).filter(f => f.endsWith('.json'));
  const packs = packFiles.map(f => JSON.parse(readFileSync(join(DATA_DIR, 'packs', f), 'utf-8')));

  console.log(`Parsed: ${layersMap.size} layers, ${packs.length} packs\n`);

  let totalFiles = 0;
  const packListing = [];

  for (const pack of packs) {
    console.log(`Generating: ${pack.id} (${pack.nameZh})...`);
    const merged = mergeLayers(pack, layersMap);
    const packDir = join(PUBLIC_PACKS, pack.id);
    mkdirSync(packDir, { recursive: true });

    // Packs with `preserveContent: true` have cohort-curated CLAUDE.md /
    // AGENTS.md / settings.json / prompts.md committed to git and must NOT be
    // overwritten by layer-merge regeneration. install.sh is still regenerated
    // because the install protocol is system-owned, not curator-owned.
    if (pack.preserveContent) {
      console.log(`  preserveContent=true, keeping committed CLAUDE/AGENTS/settings/prompts`);
    } else {
      writeFileSync(join(packDir, 'CLAUDE.md'), merged.claudeMd);
      writeFileSync(join(packDir, 'AGENTS.md'), merged.agentsMd);
      writeFileSync(join(packDir, 'settings.json'), JSON.stringify(merged.settings, null, 2));
      writeFileSync(join(packDir, 'prompts.md'), merged.promptsMd);
    }

    // install.sh ownership: as of 2026-05-19, install.sh is owned exclusively
    // by `scripts/regenerate-install-scripts.mjs` (single source of truth, multi-agent
    // template). The legacy generateInstallScript / generateManifestDrivenInstallScript
    // emitters here are kept for historical reference but no longer write — they were
    // silently overwriting the v5.0 multi-CLI template during prebuild and producing
    // 10 stale install.sh files (commit 604e8ce post-mortem). To regenerate install.sh,
    // run: node scripts/regenerate-install-scripts.mjs
    // (silently no-op the write; regenerate-install-scripts.mjs is now the sole writer)

    totalFiles += 5;
    const defaultFiles = ['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md', 'install.sh'];
    if (pack.artifacts) defaultFiles.push('manifest.json');
    const fileList = pack.files || defaultFiles;
    packListing.push({ ...pack, files: fileList });
  }

  // Preserve native packs (spellbook-*, executive-strategist, research-analyst,
  // design-prototyper, data-analyst, etc.) that are generated by Python sync
  // scripts and committed to git. generate-packs.mjs owns only the layer-based
  // packs from data/job-packs/packs/*.json — non-layer entries in packs.json
  // must survive a regeneration.
  mkdirSync(PUBLIC_DATA, { recursive: true });
  const packsJsonPath = join(PUBLIC_DATA, 'packs.json');
  let preserved = [];
  let priorGenerated = null;
  let priorTierSummary = null;
  let priorTierInjectedAt = null;
  if (existsSync(packsJsonPath)) {
    try {
      const prior = JSON.parse(readFileSync(packsJsonPath, 'utf-8'));
      priorGenerated = prior.generated || null;
      priorTierSummary = prior.tierSummary || null;
      priorTierInjectedAt = prior.tierInjectedAt || null;
      const priorList = (prior && prior.packs) ? prior.packs : (Array.isArray(prior) ? prior : []);
      const layerIds = new Set(packListing.map(p => p.id));
      preserved = priorList.filter(p => p && p.id && !layerIds.has(p.id));
      if (preserved.length > 0) {
        console.log(`\nPreserving ${preserved.length} non-layer (native) pack(s) in packs.json:`);
        preserved.forEach(p => console.log(`  - ${p.id}`));
      }
    } catch (e) {
      console.log(`\nWARN: could not read prior packs.json (${e.message}); writing fresh.`);
    }
  }

  const finalList = [...packListing, ...preserved];
  const grouped = {
    total: finalList.length,
    generated: priorGenerated || new Date().toISOString(),
    packs: finalList
  };
  if (priorTierSummary) grouped.tierSummary = priorTierSummary;
  if (priorTierInjectedAt) grouped.tierInjectedAt = priorTierInjectedAt;

  writeFileSync(packsJsonPath, JSON.stringify(grouped, null, 2));
  console.log(`\nTotal: ${finalList.length} packs (${packs.length} layer + ${preserved.length} native), ${totalFiles} layer files generated.`);
}

main();
