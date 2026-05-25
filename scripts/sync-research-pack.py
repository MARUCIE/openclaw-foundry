#!/usr/bin/env python3
"""sync-research-pack.py — bridge AI-Fleet's research/SOTA-scan skill bundle
into Agent Foundry as the `research-analyst` job pack.

Bundles:
  - 8 research-flow skills (deep-research, multi-search, paper-flow, etc.)
  - 3 advisor agents (research-analyst, advisor-orwell, advisor-drucker)

Idempotent. Usage:
    python3 scripts/sync-research-pack.py [--dry-run]
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
FOUNDRY_PACK_DIR = FOUNDRY_ROOT / "web" / "public" / "packs" / "research-analyst"
FOUNDRY_PACKS_JSON = FOUNDRY_ROOT / "web" / "public" / "data" / "packs.json"

SKILLS = [
    "deep-research",
    "multi-search-engine",
    "search-first",
    "tavily-search",
    "ljg-paper-flow",
    "paper-write",
    "web-multi-search",
    "karpathy-autoresearch",
]
AGENTS = [
    "research-analyst",
    "advisor-orwell",
    "advisor-drucker",
]
REFERENCES: dict[str, str] = {}

PACK_META = {
    "id": "research-analyst",
    "name": "Research Analyst",
    "nameZh": "研究分析师",
    "description": "SOTA scan + competitive analysis + literature synthesis: 8 research-flow skills + 3 advisor lenses.",
    "descriptionZh": "前沿扫描 + 竞品分析 + 文献综述工作台：8 个研究骨架 skill + 3 位顾问视角。",
    "icon": "science",
    "color": "#047857",
    "line": "research",
    "lineZh": "研究学习线",
    "layerIds": ["universal", "line-research", "role-research-analyst"],
    "version": "1.0.0",
}


def render_claude_md() -> str:
    return """# 研究分析师 · 配置 (Claude Code)

> Agent Foundry 原生包：把 AI-Fleet 的研究与 SOTA 扫描骨架打包成可移植
> 工作台，给做行业研究、竞品分析、论文综述的 PM/分析师使用。

## 角色定位

研究是判断的前置——本包让 Claude 作为 **多源研究协调员**：
- 跨搜索引擎检索（Tavily / Web Multi-Search / Search-First）
- 论文阅读与综述（ljg-paper-flow / paper-write）
- 深度研究流（Karpathy auto-research / deep-research）
- 多源信息综合后再给结论，禁止单源引用

## 适用场景

- 行业 / 赛道 SOTA 扫描
- 竞品对比研究（功能 / 定价 / 用户口碑 / 技术栈）
- 论文综述 + 关键引文整理
- 投资标的尽调材料前置

不适用：
- 实时新闻爬取（用 web-scraping-pipeline）
- 写营销文案（用 wechat-content-pipeline）

## 协作约定

- **三源原则**：任何结论至少 3 个独立来源；单源观点必须标 "来源唯一"
- **时间戳必带**：每条引用注明发布日期 + 抓取日期
- **优先 primary > secondary**：原始论文/官方文档 > 评论/转载
- **不编造**：找不到证据就说 "无证据"，而非凭训练数据自信

## 顾问视角

| Advisor | 用途 |
|---|---|
| research-analyst | 主研究协调员（默认入口） |
| advisor-orwell | 语言清晰度——压缩冗长、识别 bullshit |
| advisor-drucker | 把研究翻译成业务决策 |

---

Maurice | maurice_wen@proton.me
"""


def render_agents_md() -> str:
    descriptions = {
        "research-analyst": "Research orchestrator. 跨源检索 + 综合 + 引文管理。默认入口。",
        "advisor-orwell":   "George Orwell lens. 通过语言清晰看清思考——压缩冗长、识别 bullshit。",
        "advisor-drucker":  "Peter Drucker lens. 业务价值定义、客户聚焦、'做这件事到底为什么'。",
    }
    lines = []
    for a in AGENTS:
        lines.append(f"### {a}")
        lines.append(f"调用：`Task(subagent_type=\"{a}\")`")
        lines.append(f"视角：{descriptions[a]}")
        lines.append("")
    return f"""# 研究分析师 · 顾问矩阵

3 位 advisor 跑在独立上下文，工具只读 + WebSearch。

## 顾问 ({len(AGENTS)})

{chr(10).join(lines)}

## 推荐调用

**深度研究**：
```python
Task(subagent_type="research-analyst", prompt="扫描过去 6 个月 X 领域的 SOTA 进展")
```

**研究翻译为决策**：
```python
Task(subagent_type="advisor-drucker", prompt="基于这份研究，我们应该改变哪些优先级？")
```

---

Maurice | maurice_wen@proton.me
"""


def render_prompts_md() -> str:
    return """# 研究分析师 · 斜杠命令

本包通过 skill 自动触发，未引入新斜杠命令。

后续候选：
- `/research:sota` — SOTA 扫描模板
- `/research:competitor` — 竞品对比表格
- `/research:lit-review` — 文献综述流程

---

Maurice | maurice_wen@proton.me
"""


def render_settings_json() -> str:
    return json.dumps({
        "_meta": {
            "pack": "research-analyst",
            "source": "AI-Fleet native (skills/shared/ + .claude/agents/)",
            "audience": "researcher / analyst / PM",
        },
        "memory": {"chunks": 96},
        "autonomy": {"level": "L2-counselor"},
        "mcpServers": {},
    }, indent=2, ensure_ascii=False)


def render_install_sh() -> str:
    return """#!/bin/bash
# Agent Foundry - Research Analyst Pack Installer (manifest-driven)
set -euo pipefail
PACK_ID="research-analyst"
BASE_URL="${FOUNDRY_BASE_URL:-https://agent-foundry.pages.dev}/packs/$PACK_ID"
TARGET_DIR="${INSTALL_DEST:-$HOME/.claude}"

echo "Installing Research Analyst Pack: $PACK_ID"
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
echo "Uninstall:"
echo "  rm -rf \\$HOME/.claude/skills/research \\\\"
echo "         \\$HOME/.claude/agents/research-analyst.md \\\\"
echo "         \\$HOME/.claude/agents/advisor-orwell.md \\\\"
echo "         \\$HOME/.claude/agents/advisor-drucker.md"
"""


def build_manifest() -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for fname in ("CLAUDE.md", "AGENTS.md", "settings.json", "prompts.md"):
        items.append({"src": fname, "dst": fname, "type": "config"})
    for s in SKILLS:
        items.append({
            "src": f"skills/{s}/SKILL.md",
            "dst": f"skills/research/{s}/SKILL.md",
            "type": "skill",
        })
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
    written = 0
    for s in SKILLS:
        src = AI_FLEET_ROOT / "skills" / "shared" / s / "SPEC.md"
        if not src.exists():
            # AI-Fleet has two naming conventions; fall back to SKILL.md
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
        "pack": PACK_META["id"],
        "version": PACK_META["version"],
        "items": items,
    }, indent=2, ensure_ascii=False)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not AI_FLEET_ROOT.exists():
        print(f"ERROR: AI-Fleet root missing: {AI_FLEET_ROOT}", file=sys.stderr)
        return 1

    config_files = {
        "CLAUDE.md": render_claude_md(),
        "AGENTS.md": render_agents_md(),
        "prompts.md": render_prompts_md(),
        "settings.json": render_settings_json(),
        "install.sh": render_install_sh(),
    }
    manifest_items = build_manifest()
    config_files["manifest.json"] = render_manifest_json(manifest_items)

    n_artifacts = len(SKILLS) + len(AGENTS) + len(REFERENCES)
    total = len(config_files) + n_artifacts

    if args.dry_run:
        print(f"  DRY-RUN research-analyst/  config={len(config_files)} + artifacts={n_artifacts} total={total}")
        return 0

    if FOUNDRY_PACK_DIR.exists():
        shutil.rmtree(FOUNDRY_PACK_DIR)
    FOUNDRY_PACK_DIR.mkdir(parents=True, exist_ok=True)
    for fname, content in config_files.items():
        (FOUNDRY_PACK_DIR / fname).write_text(content)
        if fname == "install.sh":
            (FOUNDRY_PACK_DIR / fname).chmod(0o755)
    n_copied = copy_artifacts(FOUNDRY_PACK_DIR)
    actual_total = len(config_files) + n_copied
    print(f"  wrote research-analyst/  config={len(config_files)} artifacts={n_copied} total={actual_total}")

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

    packs_list = [p for p in packs_list if p.get("id") != PACK_META["id"]]
    entry = dict(PACK_META)
    entry["files"] = ["CLAUDE.md", "AGENTS.md", "settings.json", "prompts.md",
                      "install.sh", "manifest.json"]
    entry["artifacts"] = {
        "skills": len(SKILLS),
        "agents": len(AGENTS),
        "references": len(REFERENCES),
    }
    packs_list.append(entry)
    FOUNDRY_PACKS_JSON.write_text(json.dumps(wrap(packs_list), indent=2, ensure_ascii=False))
    print(f"  updated packs.json (+1 research-analyst entry)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
