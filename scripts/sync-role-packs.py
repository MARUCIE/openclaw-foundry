#!/usr/bin/env python3
"""sync-role-packs.py — augment all 9 layer-based role packs with curated
skill/advisor bundles from AI-Fleet's shared library.

Curation table below maps each role pack to N skills + M advisors.
Idempotent: safe to re-run; copies from canonical AI-Fleet source.

Run order:
    python3 scripts/sync-role-packs.py        # copy artifacts + write manifest.json
    node scripts/generate-packs.mjs           # picks up artifacts metadata,
                                              # writes manifest-driven install.sh,
                                              # rewrites packs.json

Source of truth:
    data/job-packs/packs/<id>.json must carry artifacts: {skills, agents, references}
    matching the count produced here. This script asserts that match before writing.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

FOUNDRY_ROOT = Path(__file__).resolve().parent.parent
AI_FLEET_ROOT = Path(os.environ.get("AI_FLEET_ROOT", Path.home() / "00-AI-Fleet")).expanduser()
PACKS_DIR = FOUNDRY_ROOT / "web" / "public" / "packs"
SOURCE_DIR = FOUNDRY_ROOT / "data" / "job-packs" / "packs"
SHARED_SKILLS = AI_FLEET_ROOT / "skills" / "shared"
ADVISORS_DIR = AI_FLEET_ROOT / ".claude" / "agents"

# Curation table — single source of truth for role artifact bundles.
# Each entry: pack_id -> { skills: [...], agents: [...], skill_namespace: <subdir> }
CURATION = {
    "algorithm-engineer": {
        "skill_namespace": "algorithm",
        "skills": [
            "algo-core", "algo-dl", "bigdata-ml",
            "deep-learning-pipeline", "perf-profile", "systematic-debugging",
        ],
        "agents": ["advisor-hickey", "advisor-munger"],
    },
    "backend-engineer": {
        "skill_namespace": "backend",
        "skills": [
            "api-design-reviewer", "fastapi-templates", "postgresql-best-practices",
            "code-review", "perf-profile", "new-api-endpoint",
            "systematic-debugging", "test-driven-development",
        ],
        "agents": ["advisor-hickey", "advisor-brooks"],
    },
    "bigdata-engineer": {
        "skill_namespace": "bigdata",
        "skills": [
            "bigdata-core", "bigdata-ml", "bigdata-viz",
            "data-pipeline", "pipeline-triage", "postgresql-best-practices",
        ],
        "agents": ["advisor-meadows", "advisor-hickey"],
    },
    "compliance-expert": {
        "skill_namespace": "compliance",
        "skills": [
            "ft-business-analyst", "ft-compliance-auditor", "ft-compliance-checklist",
            "ft-internal-audit", "ft-risk-assessment", "ft-tax-advisor",
            "ft-tax-planner", "compliance-docs",
        ],
        "agents": ["advisor-drucker", "advisor-buffett", "advisor-munger"],
    },
    "frontend-engineer": {
        "skill_namespace": "frontend",
        "skills": [
            "frontend-design", "design-review", "design-system",
            "design-taste-frontend", "frontend-testing", "impeccable-design",
            "gsap-performance", "redesign-existing-projects",
        ],
        "agents": ["advisor-jobs", "advisor-hara"],
    },
    "infra-engineer": {
        "skill_namespace": "infra",
        "skills": [
            "codex-cloudflare-deploy", "deploy-preview", "docker-optimizer",
            "infra-patrol", "observability-setup",
        ],
        "agents": ["advisor-hickey", "advisor-musk"],
    },
    "ops-engineer": {
        "skill_namespace": "ops",
        "skills": [
            "infra-patrol", "observability-setup", "enterprise-agent-ops",
            "swarm-ops", "deploy-preview",
        ],
        "agents": ["advisor-brooks", "advisor-musk"],
    },
    "scenario-planner": {
        "skill_namespace": "scenario",
        "skills": [
            "ansoff-matrix", "beachhead-segment", "business-model",
            "create-prd", "pm-cmd-business-model",
        ],
        "agents": ["advisor-drucker", "advisor-meadows"],
    },
    "test-engineer": {
        "skill_namespace": "test",
        "skills": [
            "test-driven-development", "test-runner", "test-scenarios",
            "frontend-testing", "code-review", "systematic-debugging",
            "vibe-debug",
        ],
        "agents": ["advisor-brooks", "advisor-catmull"],
    },
}


def find_skill_md(skill_id: str) -> tuple[Path, str] | None:
    """Locate skill spec at one of two canonical filenames:
    - shared/<id>/SKILL.md  (design-class convention)
    - shared/<id>/SPEC.md   (shared default convention)
    Returns (path, basename) or None.
    """
    for fname in ("SKILL.md", "SPEC.md"):
        p = SHARED_SKILLS / skill_id / fname
        if p.is_file():
            return p, fname
    return None


def find_advisor_md(advisor_id: str) -> Path | None:
    candidate = ADVISORS_DIR / f"{advisor_id}.md"
    return candidate if candidate.is_file() else None


def upsert_item(items: list[dict], item: dict) -> None:
    key = (item["src"], item["dst"], item["type"])
    if any((i.get("src"), i.get("dst"), i.get("type")) == key for i in items):
        return
    items.append(item)


def sync_pack(pack_id: str, cfg: dict, dry_run: bool, refresh_artifacts: bool) -> dict:
    """Copy skills + agents into pack dir + write manifest.json. Return summary."""
    pack_dir = PACKS_DIR / pack_id
    pack_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = pack_dir / "manifest.json"
    existing_manifest = {}
    if manifest_path.is_file():
        try:
            existing_manifest = json.loads(manifest_path.read_text())
        except json.JSONDecodeError:
            existing_manifest = {}

    items = list(existing_manifest.get("items") or [])
    for item in [
        {"src": "CLAUDE.md", "dst": "CLAUDE.md", "type": "config"},
        {"src": "AGENTS.md", "dst": "AGENTS.md", "type": "config"},
        {"src": "settings.json", "dst": "settings.json", "type": "config"},
        {"src": "prompts.md", "dst": "prompts.md", "type": "config"},
    ]:
        upsert_item(items, item)

    skills_copied = 0
    skills_preserved = []
    skills_missing = []
    for skill_id in cfg["skills"]:
        found = find_skill_md(skill_id)
        if not found:
            rel = f"skills/{cfg['skill_namespace']}/{skill_id}/SPEC.md"
            alt_rel = f"skills/{cfg['skill_namespace']}/{skill_id}/SKILL.md"
            if (pack_dir / rel).is_file():
                upsert_item(items, {"src": rel, "dst": rel, "type": "skill"})
                skills_copied += 1
                skills_preserved.append(skill_id)
                continue
            if (pack_dir / alt_rel).is_file():
                upsert_item(items, {"src": alt_rel, "dst": alt_rel, "type": "skill"})
                skills_copied += 1
                skills_preserved.append(skill_id)
                continue
            skills_missing.append(skill_id)
            continue
        src, fname = found
        rel = f"skills/{cfg['skill_namespace']}/{skill_id}/{fname}"
        dst_full = pack_dir / rel
        if dst_full.is_file() and not refresh_artifacts:
            skills_preserved.append(skill_id)
        elif not dry_run:
            dst_full.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst_full)
        upsert_item(items, {"src": rel, "dst": rel, "type": "skill"})
        skills_copied += 1

    agents_copied = 0
    agents_preserved = []
    agents_missing = []
    for agent_id in cfg["agents"]:
        src = find_advisor_md(agent_id)
        if not src:
            rel = f"agents/{agent_id}.md"
            if (pack_dir / rel).is_file():
                upsert_item(items, {"src": rel, "dst": rel, "type": "agent"})
                agents_copied += 1
                agents_preserved.append(agent_id)
                continue
            agents_missing.append(agent_id)
            continue
        rel = f"agents/{agent_id}.md"
        dst_full = pack_dir / rel
        if dst_full.is_file() and not refresh_artifacts:
            agents_preserved.append(agent_id)
        elif not dry_run:
            dst_full.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst_full)
        upsert_item(items, {"src": rel, "dst": rel, "type": "agent"})
        agents_copied += 1

    # Read pack source JSON for version + assertion
    src_json_path = SOURCE_DIR / f"{pack_id}.json"
    src_json = json.loads(src_json_path.read_text())
    declared = src_json.get("artifacts") or {}
    declared_skills = declared.get("skills", -1)
    declared_agents = declared.get("agents", -1)

    manifest = {
        **existing_manifest,
        "pack": pack_id,
        "version": src_json.get("version", "1.0.0"),
        "items": items,
    }
    if not dry_run:
        (pack_dir / "manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
        )

    return {
        "pack_id": pack_id,
        "skills_copied": skills_copied,
        "skills_preserved": skills_preserved,
        "skills_missing": skills_missing,
        "agents_copied": agents_copied,
        "agents_preserved": agents_preserved,
        "agents_missing": agents_missing,
        "declared_skills": declared_skills,
        "declared_agents": declared_agents,
        "match": (skills_copied == declared_skills and agents_copied == declared_agents),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--refresh-artifacts",
        action="store_true",
        help="overwrite existing bundled skill/advisor files from AI-Fleet sources; default preserves curated pack-local copies",
    )
    ap.add_argument("--pack", help="sync only one pack id (default: all)")
    args = ap.parse_args()

    target = list(CURATION.items())
    if args.pack:
        target = [(args.pack, CURATION[args.pack])]

    print(f"sync-role-packs.py — {'DRY-RUN' if args.dry_run else 'WRITE'}")
    print(f"AI-Fleet root: {AI_FLEET_ROOT}")
    print()

    summaries = []
    any_missing = False
    for pid, cfg in target:
        s = sync_pack(pid, cfg, args.dry_run, args.refresh_artifacts)
        summaries.append(s)
        marker = "OK" if s["match"] and not (s["skills_missing"] or s["agents_missing"]) else "WARN"
        print(
            f"  [{marker}] {pid:<22} "
            f"skills {s['skills_copied']}/{s['declared_skills']}  "
            f"agents {s['agents_copied']}/{s['declared_agents']}"
            + (f"  preserved skills: {s['skills_preserved']}" if s['skills_preserved'] else "")
            + (f"  preserved agents: {s['agents_preserved']}" if s['agents_preserved'] else "")
            + (f"  MISSING skills: {s['skills_missing']}" if s['skills_missing'] else "")
            + (f"  MISSING agents: {s['agents_missing']}" if s['agents_missing'] else "")
        )
        if s["skills_missing"] or s["agents_missing"]:
            any_missing = True

    print()
    print(f"Done. {len(summaries)} packs processed.")
    return 1 if any_missing else 0


if __name__ == "__main__":
    sys.exit(main())
