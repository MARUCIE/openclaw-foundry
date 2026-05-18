#!/usr/bin/env python3
"""sync-design-pack.py — augment Agent Foundry's `product-manager` pack with
AI-Fleet's design/prototyping skill bundle.

Bundles (copied as artifacts under product-manager/):
  - 8 design/prototype skills (prototype, stitch, design-system, etc.)
  - 3 advisor agents (advisor-jobs, advisor-hara, advisor-catmull)

Run order (manual):
    node scripts/generate-packs.mjs        # regenerate layer-based pack files
    python3 scripts/sync-design-pack.py    # augment PM pack with skill artifacts

Idempotent. Removes the legacy `design-prototyper` pack directory + its
packs.json entry on first run after the merge refactor (2026-05-13).

Usage:
    python3 scripts/sync-design-pack.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

FOUNDRY_ROOT = Path(__file__).resolve().parent.parent
AI_FLEET_ROOT = Path("/Users/mauricewen/00-AI-Fleet")
TARGET_PACK_ID = "product-manager"
LEGACY_PACK_ID = "design-prototyper"
TARGET_PACK_DIR = FOUNDRY_ROOT / "web" / "public" / "packs" / TARGET_PACK_ID
LEGACY_PACK_DIR = FOUNDRY_ROOT / "web" / "public" / "packs" / LEGACY_PACK_ID
FOUNDRY_PACKS_JSON = FOUNDRY_ROOT / "web" / "public" / "data" / "packs.json"

SKILLS = [
    "prototype",
    "stitch-design-pipeline",
    "frontend-design",
    "design-system",
    "design-taste-frontend",
    "visual-style",
    "impeccable-design",
    "design-review",
]
AGENTS = [
    "advisor-jobs",
    "advisor-hara",
    "advisor-catmull",
]
REFERENCES: dict[str, str] = {}


def render_install_sh() -> str:
    """Manifest-driven install for product-manager pack.

    Downloads the layer-generated config files (CLAUDE.md / AGENTS.md /
    settings.json / prompts.md) plus the design augment artifacts (skills/ +
    agents/) listed in manifest.json.
    """
    return """#!/bin/bash
# OpenClaw Foundry — Product Manager Pack Installer (manifest-driven, design-augmented)
set -euo pipefail
PACK_ID="product-manager"
BASE_URL="${FOUNDRY_BASE_URL:-https://agent-foundry.pages.dev}/packs/$PACK_ID"
TARGET_DIR="${INSTALL_DEST:-$HOME/.claude}"

echo "Installing OpenClaw Job Pack: $PACK_ID (with design augment)"
echo "  Source: $BASE_URL"
echo "  Target: $TARGET_DIR"
echo ""

mkdir -p "$TARGET_DIR"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
MANIFEST="$WORK/manifest.json"
TSV="$WORK/items.tsv"

echo "  -> Fetching manifest.json"
curl -sfL "$BASE_URL/manifest.json" -o "$MANIFEST"

python3 - "$MANIFEST" <<'PYEOF' > "$TSV"
import json, sys
m = json.load(open(sys.argv[1]))
for item in m['items']:
    print(item['src'], item['dst'], item['type'], sep='\\t')
PYEOF

N=$(wc -l < "$TSV" | tr -d ' ')
echo "  -> $N artifacts to install"
echo ""

i=0
while IFS=$'\\t' read -r src dst typ; do
  i=$((i+1))
  full_dst="$TARGET_DIR/$dst"
  mkdir -p "$(dirname "$full_dst")"
  printf "  [%2d/%d] %-10s %s\\n" "$i" "$N" "$typ" "$dst"
  curl -sfL "$BASE_URL/$src" -o "$full_dst"
done < "$TSV"

echo ""
echo "  OK Installed $N artifacts under $TARGET_DIR"
echo ""
echo "Restart Claude Code to activate."
"""


def build_manifest() -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    # Layer-generated config files (already in pack dir from generate-packs.mjs)
    for fname in ("CLAUDE.md", "AGENTS.md", "settings.json", "prompts.md"):
        items.append({"src": fname, "dst": fname, "type": "config"})
    # Design augment skills (copied below by copy_artifacts)
    for s in SKILLS:
        items.append({
            "src": f"skills/{s}/SKILL.md",
            "dst": f"skills/design/{s}/SKILL.md",
            "type": "skill",
        })
    # Design augment advisor agents
    for a in AGENTS:
        items.append({
            "src": f"agents/{a}.md",
            "dst": f"agents/{a}.md",
            "type": "agent",
        })
    for fname in REFERENCES:
        items.append({
            "src": f"references/{fname}",
            "dst": f"references/{fname}",
            "type": "reference",
        })
    return items


def copy_artifacts(target_dir: Path) -> int:
    """Copy AI-Fleet design skills + advisor agents into the PM pack dir."""
    written = 0
    for s in SKILLS:
        src = AI_FLEET_ROOT / "skills" / "shared" / s / "SPEC.md"
        if not src.exists():
            src = AI_FLEET_ROOT / "skills" / "shared" / s / "SKILL.md"
        if not src.exists():
            print(f"    WARN: missing skill source: {s}", file=sys.stderr)
            continue
        dst = target_dir / "skills" / s / "SKILL.md"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        written += 1
    for a in AGENTS:
        src = AI_FLEET_ROOT / ".claude" / "agents" / f"{a}.md"
        if not src.exists():
            print(f"    WARN: missing agent source: {src}", file=sys.stderr)
            continue
        dst = target_dir / "agents" / f"{a}.md"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        written += 1
    for fname, rel in REFERENCES.items():
        src = AI_FLEET_ROOT / rel
        if not src.exists():
            continue
        dst = target_dir / "references" / fname
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        written += 1
    return written


def render_manifest_json(items: list[dict[str, str]]) -> str:
    return json.dumps({
        "pack": TARGET_PACK_ID,
        "version": "4.1.0",
        "design_augmented": True,
        "items": items,
    }, indent=2, ensure_ascii=False)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not AI_FLEET_ROOT.exists():
        print(f"ERROR: AI-Fleet root missing: {AI_FLEET_ROOT}", file=sys.stderr)
        return 1
    if not TARGET_PACK_DIR.exists():
        print(f"ERROR: target pack dir missing: {TARGET_PACK_DIR}", file=sys.stderr)
        print(f"  Run `node scripts/generate-packs.mjs` first.", file=sys.stderr)
        return 1

    n_artifacts = len(SKILLS) + len(AGENTS) + len(REFERENCES)
    manifest_items = build_manifest()

    if args.dry_run:
        print(f"  DRY-RUN augment {TARGET_PACK_ID}/  artifacts={n_artifacts}  install.sh+manifest.json overwrite")
        if LEGACY_PACK_DIR.exists():
            print(f"  DRY-RUN remove legacy {LEGACY_PACK_ID}/")
        return 0

    # Override install.sh + manifest.json (config files come from generate-packs.mjs)
    (TARGET_PACK_DIR / "install.sh").write_text(render_install_sh())
    (TARGET_PACK_DIR / "install.sh").chmod(0o755)
    (TARGET_PACK_DIR / "manifest.json").write_text(render_manifest_json(manifest_items))

    n_copied = copy_artifacts(TARGET_PACK_DIR)
    print(f"  augmented {TARGET_PACK_ID}/  install.sh+manifest.json overwritten  artifacts={n_copied}/{n_artifacts}")

    # Remove legacy design-prototyper directory if present
    if LEGACY_PACK_DIR.exists():
        shutil.rmtree(LEGACY_PACK_DIR)
        print(f"  removed legacy pack dir: {LEGACY_PACK_DIR.relative_to(FOUNDRY_ROOT)}")

    # Update packs.json: remove design-prototyper entry + add artifacts to PM entry
    if FOUNDRY_PACKS_JSON.exists():
        existing = json.loads(FOUNDRY_PACKS_JSON.read_text())
        if isinstance(existing, dict) and "packs" in existing:
            packs_list = existing["packs"]
            wrap = lambda lst: {**existing, "packs": lst, "total": len(lst)}
        else:
            packs_list = existing
            wrap = lambda lst: lst

        before = len(packs_list)
        packs_list = [p for p in packs_list if p.get("id") != LEGACY_PACK_ID]
        removed = before - len(packs_list)

        for p in packs_list:
            if p.get("id") == TARGET_PACK_ID:
                p["files"] = ["CLAUDE.md", "AGENTS.md", "settings.json", "prompts.md",
                              "install.sh", "manifest.json"]
                p["artifacts"] = {
                    "skills": len(SKILLS),
                    "agents": len(AGENTS),
                    "references": len(REFERENCES),
                }
                p["design_augmented"] = True
                break

        FOUNDRY_PACKS_JSON.write_text(json.dumps(wrap(packs_list), indent=2, ensure_ascii=False))
        print(f"  updated packs.json (-{removed} legacy + product-manager.artifacts={len(SKILLS)}/{len(AGENTS)}/{len(REFERENCES)})")

    return 0


if __name__ == "__main__":
    sys.exit(main())
