#!/usr/bin/env python3
"""sync-spellbook-packs.py — bridge AI-Fleet `configs/spellbook-packs.json`
into Agent Foundry `web/public/packs/spellbook-<role>/` + register in
`web/public/data/packs.json`.

Source of truth: AI-Fleet's spellbook-packs.json defines 8 role packs
and what skills/agents/commands/lint each contains. This script generates
each pack as a SELF-CONTAINED bundle:

  web/public/packs/spellbook-<role>/
    CLAUDE.md            role config (workspace-level)
    AGENTS.md            agent matrix
    prompts.md           command index
    settings.json        Claude Code settings
    install.sh           manifest-driven downloader
    manifest.json        catalog of all artifacts
    skills/<id>/SKILL.md   ACTUAL skill bodies (copied from spellbook source)
    agents/<id>.md         ACTUAL agent definitions
    commands/<id>.md       ACTUAL command bodies
    lint/<lang>/...        ACTUAL lint configs

install.sh reads manifest.json and curls every artifact into the right
destination on the user's machine, no AI-Fleet checkout required.

Per-pack duplication is intentional: simpler than cross-pack symlinking,
total disk cost is ~2MB across all 8 packs.

Usage:
    python3 scripts/sync-spellbook-packs.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path
from typing import Any

# ---- paths ----
FOUNDRY_ROOT = Path(__file__).resolve().parent.parent
AI_FLEET_ROOT = Path("/Users/mauricewen/00-AI-Fleet")
SPELLBOOK_PACKS_JSON = AI_FLEET_ROOT / "configs" / "spellbook-packs.json"
SPELLBOOK_SOURCE = AI_FLEET_ROOT / "outputs" / "spellbook-adaptation" / "2026-05-10" / "raw" / "spellbook-source"

FOUNDRY_PACKS_DIR = FOUNDRY_ROOT / "web" / "public" / "packs"
FOUNDRY_PACKS_JSON = FOUNDRY_ROOT / "web" / "public" / "data" / "packs.json"

# ---- per-pack visual + classification metadata ----
# Maps spellbook pack-id → (Foundry id prefix `spellbook-`, icon, color, line, layerIds)
PACK_META: dict[str, dict[str, Any]] = {
    "code-reviewer": {
        "icon": "rate_review",
        "color": "#0053A4",
        "line": "engineering",
        "lineZh": "工程职能线",
        "layerIds": ["universal", "line-engineering", "role-spellbook-cr"],
        "summary_en": "Two-stage PR review (spec compliance → code quality) with sonnet-grade specialist agents.",
        "summary_zh": "两阶段 PR 评审（规格合规 → 代码质量）配 sonnet 级专家代理。",
    },
    "security-auditor": {
        "icon": "verified_user",
        "color": "#DC2626",
        "line": "engineering",
        "lineZh": "工程职能线",
        "layerIds": ["universal", "line-engineering", "role-spellbook-sec"],
        "summary_en": "OWASP Top 10 + IAM patterns + dependency CVE audit + pre-deploy gate.",
        "summary_zh": "OWASP Top 10 + IAM 模式 + 依赖 CVE 审计 + 部署前 gate。",
    },
    "test-engineer": {
        "icon": "bug_report",
        "color": "#059669",
        "line": "engineering",
        "lineZh": "工程职能线",
        "layerIds": ["universal", "line-engineering", "role-spellbook-test"],
        "summary_en": "Full test pyramid (unit → integration → E2E + perf) + coverage gap agent + scaffolding.",
        "summary_zh": "完整测试金字塔（单测 → 集成 → E2E + 性能）+ 覆盖率代理 + 测试脚手架。",
    },
    "platform-engineer": {
        "icon": "cloud",
        "color": "#003A70",
        "line": "engineering",
        "lineZh": "工程职能线",
        "layerIds": ["universal", "line-engineering", "role-spellbook-platform"],
        "summary_en": "CI/CD + containerization + IaC + observability + incident response + 5-language lint configs.",
        "summary_zh": "CI/CD + 容器化 + IaC + 可观测性 + 事件响应 + 5 种语言 lint 配置。",
    },
    "backend-engineer": {
        "icon": "dns",
        "color": "#7C3AED",
        "line": "engineering",
        "lineZh": "工程职能线",
        "layerIds": ["universal", "line-engineering", "role-spellbook-backend"],
        "summary_en": "FastAPI + Pydantic + PostgreSQL/Mongo/Redis + queue patterns + scaffolding command.",
        "summary_zh": "FastAPI + Pydantic + PostgreSQL/Mongo/Redis + 队列模式 + 脚手架命令。",
    },
    "frontend-engineer": {
        "icon": "web",
        "color": "#D97706",
        "line": "engineering",
        "lineZh": "工程职能线",
        "layerIds": ["universal", "line-engineering", "role-spellbook-frontend"],
        "summary_en": "WCAG/ARIA accessibility + Angular + Tailwind + 3-language lint configs.",
        "summary_zh": "WCAG/ARIA 无障碍 + Angular + Tailwind + 3 种语言 lint 配置。",
    },
    "ai-app-engineer": {
        "icon": "psychology",
        "color": "#005136",
        "line": "data-ai",
        "lineZh": "数据AI职能线",
        "layerIds": ["universal", "line-data-ai", "role-spellbook-ai"],
        "summary_en": "Agentex / LangGraph / OpenAI Agents SDKs + complex-doc-RAG debug + memory architecture.",
        "summary_zh": "Agentex / LangGraph / OpenAI Agents SDK + 复杂文档 RAG 调试 + 内存架构。",
    },
    "onboarding": {
        "icon": "school",
        "color": "#C96E4A",
        "line": "product",
        "lineZh": "产品职能线",
        "layerIds": ["universal", "line-product", "role-spellbook-onboard"],
        "summary_en": "Repo orientation agent + PRD scaffolding for tech leads briefing new hires.",
        "summary_zh": "仓库引导代理 + PRD 脚手架，技术 leader 给新人做引导用。",
    },
}

NAME_EN_MAP = {
    "code-reviewer": "Code Reviewer",
    "security-auditor": "Security Auditor",
    "test-engineer": "Test Engineer (Spellbook)",
    "platform-engineer": "Platform Engineer",
    "backend-engineer": "Backend Engineer (Spellbook)",
    "frontend-engineer": "Frontend Engineer (Spellbook)",
    "ai-app-engineer": "AI App Engineer",
    "onboarding": "Onboarding Lead",
}

# ---- file content templates ----

def render_claude_md(pack_id: str, pack: dict[str, Any]) -> str:
    """CLAUDE.md — engineering context + role positioning."""
    label_zh = pack.get("label_zh", pack_id)
    meta = PACK_META[pack_id]
    skills = ", ".join(pack.get("skills", []))
    return f"""# {label_zh} · 配置 (Claude Code)

> Spellbook role pack adapted from kid-sid/claude-spellbook into AI-Fleet,
> bridged into Agent Foundry as job pack `spellbook-{pack_id}`.

## 角色定位

{meta['summary_zh']}

英文版：{meta['summary_en']}

## 适用场景

当 Claude Code 会话需要扮演 **{label_zh}** 角色时，激活这套配置。Claude 将
按以下技能集合自动触发对应专项行为：

- **Skills**: {skills if skills else '(none — agents/commands only)'}

## 协作约定

- Read-before-Edit：修改任何文件前必须先 Read 当前内容
- Verification gate：完成任务前跑 lint + typecheck + test，PASS 才宣告 done
- 命名空间隔离：所有 spellbook 产出在 `spellbook/` 子目录下，不污染其它技能
- 中文交付：人面 deliverable 用中文，机面 spec 用英文，技术标识符（slug、ID、
  命令）保持英文

## 升级路径

如果想要更深的整合（直接把 spellbook 的 skill / agent / command 文件加进
AI-Fleet 注册表），运行 AI-Fleet 侧的安装器：

```bash
cd /path/to/AI-Fleet
bash scripts/spellbook-install.sh --pack {pack_id}
```

详见 [USAGE.md](https://github.com/kid-sid/claude-spellbook) 上游文档。

---

Maurice | maurice_wen@proton.me
"""


def render_agents_md(pack_id: str, pack: dict[str, Any]) -> str:
    """AGENTS.md — list of agents this pack provides."""
    label_zh = pack.get("label_zh", pack_id)
    agents = pack.get("agents", [])
    if not agents:
        agents_section = "本包不引入新代理，依赖 AI-Fleet 已有的代理矩阵。"
    else:
        agent_lines = []
        for a in agents:
            agent_lines.append(f"### spellbook/{a}")
            agent_lines.append(f"调用方式：`Task(subagent_type=\"spellbook-{a}\")`")
            agent_lines.append(f"安装路径：`.claude/agents/spellbook/{a}.md`")
            agent_lines.append("")
        agents_section = "\n".join(agent_lines)

    return f"""# {label_zh} · 代理矩阵

## 协作约定

岗位包标准：所有 spellbook 代理在 `.claude/agents/spellbook/` 命名空间下，与
AI-Fleet 现有 23 个代理（advisor-* / bmad-* / code-reviewer / doc-writer 等）
零冲突。卸载时 `rm -rf .claude/agents/spellbook/` 一键清空。

## 本包提供的代理 ({len(agents)})

{agents_section}

## 调用示例

```
# 当 PR diff 超过 5 个文件或 300 行
Task(subagent_type="spellbook-code-reviewer", prompt="Review PR #42")

# 当需要部署前安全扫描
Task(subagent_type="spellbook-security-auditor", prompt="Audit dependencies")

# 当需要找测试覆盖率盲点
Task(subagent_type="spellbook-test-coverage-agent", prompt="Find gaps in module X")
```

---

Maurice | maurice_wen@proton.me
"""


def render_prompts_md(pack_id: str, pack: dict[str, Any]) -> str:
    """prompts.md — list of slash commands this pack provides."""
    label_zh = pack.get("label_zh", pack_id)
    commands = pack.get("commands", [])
    if not commands:
        cmd_section = "本包不引入新斜杠命令。"
    else:
        cmd_lines = []
        for c in commands:
            cmd_lines.append(f"- `/spellbook:{c}` — 详见 `.claude/commands/spellbook/{c}.md`")
        cmd_section = "\n".join(cmd_lines)

    return f"""# {label_zh} · 斜杠命令

## 命名空间

所有 spellbook 命令通过 `/spellbook:<id>` 调用，与 AI-Fleet 现有 14 个命令
（/commit /pr /optimize 等）零冲突。

## 本包提供的命令 ({len(commands)})

{cmd_section}

## 通用约定

- 命令的实际实现在 `.claude/commands/spellbook/<id>.md`
- 修改命令行为：直接编辑对应 .md 文件
- 卸载命令：`bash scripts/spellbook-install.sh --uninstall --pack {pack_id}`

---

Maurice | maurice_wen@proton.me
"""


def render_settings_json(pack_id: str, pack: dict[str, Any]) -> str:
    """settings.json — Claude Code workspace settings."""
    n_skills = len(pack.get("skills", []))
    n_agents = len(pack.get("agents", []))
    n_cmds = len(pack.get("commands", []))
    # Memory chunks scale with content
    chunks = max(48, (n_skills + n_agents + n_cmds) * 8)
    settings = {
        "_meta": {
            "pack": f"spellbook-{pack_id}",
            "source": "https://github.com/kid-sid/claude-spellbook",
            "adapted_via": "AI-Fleet/configs/spellbook-packs.json",
        },
        "memory": {"chunks": chunks},
        "autonomy": {"level": "L1-guided"},
        "mcpServers": {
            "github": {
                "command": "npx",
                "args": ["-y", "@anthropic-ai/mcp-remote", "https://mcp.github.com/sse"],
            }
        },
    }
    return json.dumps(settings, indent=2, ensure_ascii=False)


def build_manifest(pack_id: str, pack: dict[str, Any]) -> list[dict[str, str]]:
    """Build manifest entries mapping pack-relative src → user-relative dst.

    User-side destinations follow Claude Code convention:
      - workspace config: $HOME/.claude/{CLAUDE.md,AGENTS.md,settings.json,prompts.md}
      - skills:           $HOME/.claude/skills/spellbook/<id>/SKILL.md  (uppercase per AI-Fleet)
      - agents:           $HOME/.claude/agents/spellbook/<id>.md
      - commands:         $HOME/.claude/commands/spellbook/<id>.md
      - lint configs:     $HOME/.claude/configs/lint/spellbook/<lang>/<file>
    """
    items: list[dict[str, str]] = []
    # Workspace-level configs (5 files, all packs)
    for fname in ("CLAUDE.md", "AGENTS.md", "settings.json", "prompts.md"):
        items.append({"src": fname, "dst": fname, "type": "config"})
    # Skills (source: skill.md lowercase → dst: SKILL.md uppercase)
    for s in pack.get("skills", []):
        items.append({
            "src": f"skills/{s}/SKILL.md",
            "dst": f"skills/spellbook/{s}/SKILL.md",
            "type": "skill",
        })
    # Agents
    for a in pack.get("agents", []):
        items.append({
            "src": f"agents/{a}.md",
            "dst": f"agents/spellbook/{a}.md",
            "type": "agent",
        })
    # Commands
    for c in pack.get("commands", []):
        items.append({
            "src": f"commands/{c}.md",
            "dst": f"commands/spellbook/{c}.md",
            "type": "command",
        })
    # Lint (each lang dir has multiple files; we expand at copy time, manifest
    # uses dir-level entries that install.sh expands)
    for l in pack.get("lint", []):
        items.append({
            "src": f"lint/{l}/",
            "dst": f"configs/lint/spellbook/{l}/",
            "type": "lint-dir",
        })
    return items


def copy_artifacts(target_dir: Path, pack: dict[str, Any], source_root: Path) -> int:
    """Copy actual skill/agent/command/lint bodies from spellbook source into
    pack directory. Returns count of files written.

    Source layout:
      $SOURCE/skills/<id>/skill.md (lowercase) → target/skills/<id>/SKILL.md (uppercase)
      $SOURCE/.claude/agents/<id>.md           → target/agents/<id>.md
      $SOURCE/.claude/commands/<id>.md         → target/commands/<id>.md
      $SOURCE/tools/<lang>/*                   → target/lint/<lang>/*
    """
    written = 0
    for s in pack.get("skills", []):
        src = source_root / "skills" / s / "skill.md"
        if not src.exists():
            print(f"    WARN: missing skill source: {src}", file=sys.stderr)
            continue
        dst = target_dir / "skills" / s / "SKILL.md"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        written += 1
    for a in pack.get("agents", []):
        src = source_root / ".claude" / "agents" / f"{a}.md"
        if not src.exists():
            print(f"    WARN: missing agent source: {src}", file=sys.stderr)
            continue
        dst = target_dir / "agents" / f"{a}.md"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        written += 1
    for c in pack.get("commands", []):
        src = source_root / ".claude" / "commands" / f"{c}.md"
        if not src.exists():
            print(f"    WARN: missing command source: {src}", file=sys.stderr)
            continue
        dst = target_dir / "commands" / f"{c}.md"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        written += 1
    for l in pack.get("lint", []):
        src_dir = source_root / "tools" / l
        if not src_dir.is_dir():
            print(f"    WARN: missing lint dir: {src_dir}", file=sys.stderr)
            continue
        dst_dir = target_dir / "lint" / l
        dst_dir.mkdir(parents=True, exist_ok=True)
        for src_file in src_dir.iterdir():
            if src_file.is_file():
                shutil.copy2(src_file, dst_dir / src_file.name)
                written += 1
    return written


def render_manifest_json(pack_id: str, manifest_items: list[dict[str, str]],
                          lint_expansion: dict[str, list[str]]) -> str:
    """manifest.json — listing every artifact this pack carries with
    src (pack-relative URL path) and dst (user-relative install path).

    lint-dir entries get expanded to individual files for client simplicity.
    """
    expanded: list[dict[str, str]] = []
    for item in manifest_items:
        if item["type"] == "lint-dir":
            lang = item["src"].rstrip("/").split("/")[-1]
            for fname in lint_expansion.get(lang, []):
                expanded.append({
                    "src": f"lint/{lang}/{fname}",
                    "dst": f"configs/lint/spellbook/{lang}/{fname}",
                    "type": "lint",
                })
        else:
            expanded.append(item)
    return json.dumps({
        "pack": f"spellbook-{pack_id}",
        "version": "1.0.0",
        "items": expanded,
    }, indent=2, ensure_ascii=False)


def render_install_sh(pack_id: str) -> str:
    """install.sh — manifest-driven downloader.

    Reads manifest.json from the pack URL, then curls every item into the
    user's $HOME/.claude/ tree. No AI-Fleet checkout required — this carries
    the full bundle.
    """
    # Use ascii-only template to dodge unicode-escaping headaches in bash heredocs
    return f"""#!/bin/bash
# Agent Foundry - Spellbook Job Pack Installer (manifest-driven)
# Pack: spellbook-{pack_id}
# Source of truth: AI-Fleet/configs/spellbook-packs.json
set -euo pipefail
PACK_ID="spellbook-{pack_id}"
# Production URL; override via FOUNDRY_BASE_URL=http://localhost:3200 for local testing.
BASE_URL="${{FOUNDRY_BASE_URL:-https://openclaw-foundry.pages.dev}}/packs/$PACK_ID"
TARGET_DIR="$HOME/.claude"

echo "Installing Spellbook Job Pack: $PACK_ID"
echo "  Source: $BASE_URL"
echo "  Target: $TARGET_DIR"
echo ""

mkdir -p "$TARGET_DIR"

# Workspace for manifest + TSV
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
MANIFEST="$WORK/manifest.json"
TSV="$WORK/items.tsv"

echo "  -> Fetching manifest.json"
curl -sfL "$BASE_URL/manifest.json" -o "$MANIFEST"

# Emit TSV: one (src, dst, type) per line. Single-quoted python script means
# no f-string interpolation collides with the outer bash f-string.
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
  printf "  [%2d/%d] %-7s %s\\n" "$i" "$N" "$typ" "$dst"
  curl -sfL "$BASE_URL/$src" -o "$full_dst"
done < "$TSV"

echo ""
echo "  OK Installed $N artifacts under $TARGET_DIR"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Code"
echo "  2. Skills auto-trigger by description match"
echo "  3. Agents:   Task(subagent_type=\\"spellbook-<id>\\")"
echo "  4. Commands: /spellbook:<id>"
echo ""
echo "Uninstall: rm -rf \\$HOME/.claude/skills/spellbook \\\\"
echo "                  \\$HOME/.claude/agents/spellbook \\\\"
echo "                  \\$HOME/.claude/commands/spellbook \\\\"
echo "                  \\$HOME/.claude/configs/lint/spellbook"
"""


# ---- main ----

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0] if __doc__ else "")
    parser.add_argument("--dry-run", action="store_true", help="preview without writing")
    args = parser.parse_args()

    if not SPELLBOOK_PACKS_JSON.exists():
        print(f"ERROR: AI-Fleet pack source missing: {SPELLBOOK_PACKS_JSON}", file=sys.stderr)
        return 1

    spellbook = json.loads(SPELLBOOK_PACKS_JSON.read_text())
    packs_in = spellbook.get("packs", {})

    if not SPELLBOOK_SOURCE.exists():
        print(f"ERROR: Spellbook source tree missing: {SPELLBOOK_SOURCE}", file=sys.stderr)
        print("       Run AI-Fleet's spellbook adoption step first.", file=sys.stderr)
        return 1

    # Pre-scan: lint dir → list of file names (for manifest expansion)
    lint_expansion: dict[str, list[str]] = {}
    for lint_dir in (SPELLBOOK_SOURCE / "tools").iterdir() if (SPELLBOOK_SOURCE / "tools").is_dir() else []:
        if lint_dir.is_dir() and lint_dir.name not in ("install.sh", "README.md"):
            lint_expansion[lint_dir.name] = sorted(
                f.name for f in lint_dir.iterdir() if f.is_file()
            )

    # Generate pack files
    pack_count = 0
    file_count = 0
    for pack_id, pack in packs_in.items():
        if pack_id == "all":
            continue  # super-pack not exposed as Foundry job pack
        if pack_id not in PACK_META:
            print(f"  WARN: no PACK_META for {pack_id}, skipping", file=sys.stderr)
            continue

        foundry_id = f"spellbook-{pack_id}"
        target_dir = FOUNDRY_PACKS_DIR / foundry_id
        manifest_items = build_manifest(pack_id, pack)
        config_files = {
            "CLAUDE.md": render_claude_md(pack_id, pack),
            "AGENTS.md": render_agents_md(pack_id, pack),
            "prompts.md": render_prompts_md(pack_id, pack),
            "settings.json": render_settings_json(pack_id, pack),
            "install.sh": render_install_sh(pack_id),
            "manifest.json": render_manifest_json(pack_id, manifest_items, lint_expansion),
        }
        # Count actual artifacts that will be copied
        n_skills = len(pack.get("skills", []))
        n_agents = len(pack.get("agents", []))
        n_commands = len(pack.get("commands", []))
        n_lint = sum(len(lint_expansion.get(l, [])) for l in pack.get("lint", []))
        n_artifacts = n_skills + n_agents + n_commands + n_lint
        total_files = len(config_files) + n_artifacts

        if args.dry_run:
            print(f"  DRY-RUN {foundry_id}/  config={len(config_files)} + artifacts={n_artifacts} "
                  f"(skills={n_skills} agents={n_agents} cmds={n_commands} lint={n_lint})")
            pack_count += 1
            file_count += total_files
            continue

        # Wipe existing pack dir to avoid stale subtrees from prior generator
        if target_dir.exists():
            shutil.rmtree(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
        for fname, content in config_files.items():
            (target_dir / fname).write_text(content)
            if fname == "install.sh":
                (target_dir / fname).chmod(0o755)
        n_copied = copy_artifacts(target_dir, pack, SPELLBOOK_SOURCE)
        actual_total = len(config_files) + n_copied
        print(f"  wrote {foundry_id}/  config={len(config_files)} artifacts={n_copied} "
              f"total={actual_total} files")
        pack_count += 1
        file_count += actual_total

    # Update packs.json — register/refresh spellbook entries
    if FOUNDRY_PACKS_JSON.exists():
        existing = json.loads(FOUNDRY_PACKS_JSON.read_text())
        if isinstance(existing, dict) and "packs" in existing:
            packs_list = existing["packs"]
            wrap = lambda lst: {**existing, "packs": lst}
        else:
            packs_list = existing
            wrap = lambda lst: lst
    else:
        packs_list = []
        wrap = lambda lst: lst

    # Drop existing spellbook-* entries (idempotent re-run)
    packs_list = [p for p in packs_list if not p.get("id", "").startswith("spellbook-")]

    new_entries = []
    for pack_id, pack in packs_in.items():
        if pack_id == "all" or pack_id not in PACK_META:
            continue
        meta = PACK_META[pack_id]
        n_skills = len(pack.get("skills", []))
        n_agents = len(pack.get("agents", []))
        n_commands = len(pack.get("commands", []))
        n_lint = sum(len(lint_expansion.get(l, [])) for l in pack.get("lint", []))
        new_entries.append({
            "id": f"spellbook-{pack_id}",
            "name": NAME_EN_MAP[pack_id],
            "nameZh": pack.get("label_zh", pack_id),
            "description": meta["summary_en"],
            "descriptionZh": meta["summary_zh"],
            "icon": meta["icon"],
            "color": meta["color"],
            "line": meta["line"],
            "lineZh": meta["lineZh"],
            "layerIds": meta["layerIds"],
            "version": "1.1.0",
            "files": ["CLAUDE.md", "AGENTS.md", "settings.json", "prompts.md",
                      "install.sh", "manifest.json"],
            "artifacts": {
                "skills": n_skills,
                "agents": n_agents,
                "commands": n_commands,
                "lint_files": n_lint,
            },
        })

    packs_list.extend(new_entries)
    output = wrap(packs_list)

    if args.dry_run:
        print(f"  DRY-RUN would update packs.json (+{len(new_entries)} spellbook entries)")
    else:
        FOUNDRY_PACKS_JSON.write_text(json.dumps(output, indent=2, ensure_ascii=False))
        print(f"  updated packs.json (+{len(new_entries)} spellbook entries)")

    verb = "would be " if args.dry_run else ""
    print(f"\nDone. {pack_count} packs × {file_count} total files {verb}written. "
          f"{len(new_entries)} pack entries {verb}registered.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
