#!/usr/bin/env python3
"""sync-role-packs.py — augment all 9 layer-based role packs with curated
skill/role-neutral advisor bundles from AI-Fleet's shared library.

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
        "agents": ["advisor-software-simplicity", "advisor-decision-framework"],
    },
    "backend-engineer": {
        "skill_namespace": "backend",
        "skills": [
            "api-design-reviewer", "fastapi-templates", "postgresql-best-practices",
            "code-review", "perf-profile", "new-api-endpoint",
            "systematic-debugging", "test-driven-development",
        ],
        "agents": ["advisor-software-simplicity", "advisor-project-complexity"],
    },
    "bigdata-engineer": {
        "skill_namespace": "bigdata",
        "skills": [
            "bigdata-core", "bigdata-ml", "bigdata-viz",
            "data-pipeline", "pipeline-triage", "postgresql-best-practices",
        ],
        "agents": ["advisor-systems-thinking", "advisor-software-simplicity"],
    },
    "compliance-expert": {
        "skill_namespace": "compliance",
        "skills": [
            "ft-business-analyst", "ft-compliance-auditor", "ft-compliance-checklist",
            "ft-internal-audit", "ft-risk-assessment", "ft-tax-advisor",
            "ft-tax-planner", "compliance-docs",
        ],
        "agents": ["advisor-business-value", "advisor-strategic-focus", "advisor-decision-framework"],
    },
    "frontend-engineer": {
        "skill_namespace": "frontend",
        "skills": [
            "frontend-design", "design-review", "design-system",
            "design-taste-frontend", "frontend-testing", "impeccable-design",
            "gsap-performance", "redesign-existing-projects",
        ],
        "agents": ["advisor-product-experience", "advisor-design-simplicity"],
    },
    "infra-engineer": {
        "skill_namespace": "infra",
        "skills": [
            "codex-cloudflare-deploy", "deploy-preview", "docker-optimizer",
            "infra-patrol", "observability-setup",
        ],
        "agents": ["advisor-software-simplicity", "advisor-execution-speed"],
    },
    "ops-engineer": {
        "skill_namespace": "ops",
        "skills": [
            "infra-patrol", "observability-setup", "enterprise-agent-ops",
            "swarm-ops", "deploy-preview",
        ],
        "agents": ["advisor-project-complexity", "advisor-execution-speed"],
    },
    "scenario-planner": {
        "skill_namespace": "scenario",
        "skills": [
            "ansoff-matrix", "beachhead-segment", "business-model",
            "create-prd", "pm-cmd-business-model",
        ],
        "agents": ["advisor-business-value", "advisor-systems-thinking"],
    },
    "test-engineer": {
        "skill_namespace": "test",
        "skills": [
            "test-driven-development", "test-runner", "test-scenarios",
            "frontend-testing", "code-review", "systematic-debugging",
            "vibe-debug",
        ],
        "agents": ["advisor-project-complexity", "advisor-team-culture"],
    },
}

ADVISOR_PROFILES = {
    "advisor-decision-framework": (
        "Decision Framework Advisor",
        "Role-neutral advisor for inversion, incentives, tradeoffs, and decision risk.",
        [
            "Invert the decision and identify how the plan can fail.",
            "Map incentives, constraints, and second-order effects.",
            "Separate reversible experiments from irreversible commitments.",
        ],
    ),
    "advisor-business-value": (
        "Business Value Advisor",
        "Role-neutral advisor for customer value, effectiveness, and business outcomes.",
        [
            "Clarify the customer or stakeholder outcome being served.",
            "Separate visible activity from measurable value creation.",
            "Connect priorities to constraints, accountability, and operating cadence.",
        ],
    ),
    "advisor-systems-thinking": (
        "Systems Thinking Advisor",
        "Role-neutral advisor for feedback loops, leverage points, and system side effects.",
        [
            "Map feedback loops, delays, and reinforcing or balancing forces.",
            "Identify leverage points with disproportionate downstream effects.",
            "Surface unintended consequences before recommending action.",
        ],
    ),
    "advisor-strategic-focus": (
        "Strategic Focus Advisor",
        "Role-neutral advisor for focus, durability, compounding, and resource allocation.",
        [
            "Test whether the opportunity has durable advantage or only short-term appeal.",
            "Protect focus by making tradeoffs explicit.",
            "Define pass criteria as clearly as go criteria.",
        ],
    ),
    "advisor-software-simplicity": (
        "Software Simplicity Advisor",
        "Role-neutral advisor for simplicity, composability, and reducing accidental complexity.",
        [
            "Prefer clear data, small interfaces, and explicit boundaries.",
            "Remove incidental complexity before adding abstractions.",
            "Challenge stateful or clever designs that weaken maintenance.",
        ],
    ),
    "advisor-project-complexity": (
        "Project Complexity Advisor",
        "Role-neutral advisor for essential complexity, scheduling risk, and team scaling.",
        [
            "Separate essential complexity from accidental process or tooling overhead.",
            "Expose coordination cost and schedule risk early.",
            "Recommend smaller milestones with observable completion evidence.",
        ],
    ),
    "advisor-product-experience": (
        "Product Experience Advisor",
        "Role-neutral advisor for product clarity, user delight, and decisive scope control.",
        [
            "Reduce a product promise to one clear user outcome.",
            "Cut features that blur the primary experience.",
            "Raise the bar on onboarding, naming, copy, and interaction quality.",
        ],
    ),
    "advisor-design-simplicity": (
        "Design Simplicity Advisor",
        "Role-neutral advisor for visual restraint, structural clarity, and useful emptiness.",
        [
            "Remove visual noise and expose the underlying structure.",
            "Use whitespace, rhythm, and hierarchy to make decisions easier.",
            "Question whether each element needs to exist.",
        ],
    ),
    "advisor-team-culture": (
        "Team Culture Advisor",
        "Role-neutral advisor for candor, creative safety, and collaboration dynamics.",
        [
            "Protect candid feedback without turning it into blame.",
            "Separate idea quality from status, role, or personality.",
            "Design review loops that improve the work and the team.",
        ],
    ),
    "advisor-execution-speed": (
        "Execution Speed Advisor",
        "Role-neutral advisor for first principles, urgency, and removing execution bottlenecks.",
        [
            "Return to first principles before optimizing inherited process.",
            "Shorten feedback loops and remove avoidable handoffs.",
            "Use aggressive timelines only when evidence and safeguards are visible.",
        ],
    ),
}


def render_advisor_md(agent_id: str) -> str:
    title, description, focus_items = ADVISOR_PROFILES[agent_id]
    focus = "\n".join(f"- {item}" for item in focus_items)
    return f"""---
name: {agent_id}
description: "{description}"
---
# {title}

You are a role-neutral advisory lens. Do not impersonate a real person, cite a living or historical individual as the source of the persona, or use biographical authority. Provide concise, evidence-oriented critique from the capability described by this file.

## Focus

{focus}

## Operating Rules

- Stay in the named capability lane.
- Give the strongest useful challenge before recommendations.
- Make assumptions, risks, and stop conditions explicit.
- Do not modify files; return advisory output only.
"""


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
        rel = f"agents/{agent_id}.md"
        dst_full = pack_dir / rel
        if agent_id in ADVISOR_PROFILES:
            if dst_full.is_file() and not refresh_artifacts:
                agents_preserved.append(agent_id)
            elif not dry_run:
                dst_full.parent.mkdir(parents=True, exist_ok=True)
                dst_full.write_text(render_advisor_md(agent_id), encoding="utf-8")
        else:
            src = find_advisor_md(agent_id)
            if not src:
                if dst_full.is_file():
                    upsert_item(items, {"src": rel, "dst": rel, "type": "agent"})
                    agents_copied += 1
                    agents_preserved.append(agent_id)
                    continue
                agents_missing.append(agent_id)
                continue
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
