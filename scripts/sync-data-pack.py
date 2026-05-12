#!/usr/bin/env python3
"""sync-data-pack.py — bridge AI-Fleet's PM-facing analytics skill bundle
into Agent Foundry as the `data-analyst` job pack.

Differs from existing `bigdata-engineer` / `algorithm-engineer` packs by
audience: this pack targets PM-facing analytics (metrics, dashboards,
SQL ad-hoc, growth questions), not engineering of data pipelines.

Bundles:
  - 8 analytics skills (bigdata-core/viz/ml, metrics-dashboard, sql, etc.)
  - 2 advisor agents (research-analyst, advisor-meadows)

Idempotent. Usage:
    python3 scripts/sync-data-pack.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

FOUNDRY_ROOT = Path(__file__).resolve().parent.parent
AI_FLEET_ROOT = Path("/Users/mauricewen/00-AI-Fleet")
FOUNDRY_PACK_DIR = FOUNDRY_ROOT / "web" / "public" / "packs" / "data-analyst"
FOUNDRY_PACKS_JSON = FOUNDRY_ROOT / "web" / "public" / "data" / "packs.json"

SKILLS = [
    "bigdata-core",
    "bigdata-viz",
    "bigdata-ml",
    "metrics-dashboard",
    "sql-queries",
    "north-star-metric",
    "pm-cmd-setup-metrics",
    "database-designer",
]
AGENTS = [
    "research-analyst",
    "advisor-meadows",
]
REFERENCES: dict[str, str] = {}

PACK_META = {
    "id": "data-analyst",
    "name": "Data Analyst",
    "nameZh": "数据分析师",
    "description": "Analytics + metrics + dashboards: 8 data skills + 2 advisor lenses for PM-facing analysis.",
    "descriptionZh": "数据分析 + 指标体系 + Dashboard 工作台：8 个 PM 视角分析 skill + 2 位顾问视角。",
    "icon": "monitoring",
    "color": "#B45309",
    "line": "analyze",
    "lineZh": "数据洞察线",
    "layerIds": ["universal", "line-analyze", "role-data-analyst"],
    "version": "1.0.0",
}


def render_claude_md() -> str:
    return """# 数据分析师 · 配置 (Claude Code)

> Agent Foundry 原生包：把 AI-Fleet 的数据分析骨架打包成可移植工作台，
> 给做指标分析、A/B 解读、Dashboard 设计的 PM/Growth/分析师使用。

## 角色定位

与 `bigdata-engineer` / `algorithm-engineer` 不同——本包面向 **PM 侧分析**：
- 不是搭管线，是用现成数据回答业务问题
- 用 `north-star-metric` / `pm-cmd-setup-metrics` 定指标体系
- 用 `sql-queries` 做 ad-hoc 查询
- 用 `metrics-dashboard` / `bigdata-viz` 出可读 Dashboard
- 用 `advisor-meadows` 找系统杠杆点（不是看孤立数字）

## 适用场景

- 业务指标体系设计（North Star → 输入 → 输出 → 健康度）
- A/B 测试结果解读 + 决策建议
- Dashboard 从需求到落地
- 增长漏斗分析、留存研究
- ad-hoc 数据问题（"上周转化率为什么掉了？"）

不适用：
- 数据管线 ETL 工程（用 bigdata-engineer）
- 算法模型训练（用 algorithm-engineer）

## 协作约定

- **指标定义先于数据**：任何分析前先确认"我们到底在测什么"
- **单数字危险**：永远成对呈现（如转化 + 流量，留存 + DAU）
- **置信区间必带**：A/B 解读不给 p-value 是渎职
- **杠杆点思维**：用 Meadows 视角问"小变化大影响在哪？"

## 顾问视角

| Advisor | 用途 |
|---|---|
| research-analyst | 数据探索（把"看数据"当研究跑） |
| advisor-meadows | 系统动力学——找反馈回路、杠杆点 |

---

Maurice | maurice_wen@proton.me
"""


def render_agents_md() -> str:
    descriptions = {
        "research-analyst": "Research orchestrator. 把 'ad-hoc 看数据' 当研究跑——多角度、引文、综合。",
        "advisor-meadows":  "Donella Meadows lens. 系统动力学、反馈回路、杠杆点。",
    }
    lines = []
    for a in AGENTS:
        lines.append(f"### {a}")
        lines.append(f"调用：`Task(subagent_type=\"{a}\")`")
        lines.append(f"视角：{descriptions[a]}")
        lines.append("")
    return f"""# 数据分析师 · 顾问矩阵

2 位 advisor 跑在独立上下文，工具只读。

## 顾问 ({len(AGENTS)})

{chr(10).join(lines)}

## 推荐调用

**深度数据探索**：
```python
Task(subagent_type="research-analyst", prompt="过去 30 天用户留存下降，从多角度找原因")
```

**系统杠杆点分析**：
```python
Task(subagent_type="advisor-meadows", prompt="这 5 个指标之间的反馈回路是什么？")
```

---

Maurice | maurice_wen@proton.me
"""


def render_prompts_md() -> str:
    return """# 数据分析师 · 斜杠命令

本包通过 skill 自动触发，未引入新斜杠命令。

后续候选：
- `/data:north-star` — North Star 指标体系一键搭建
- `/data:ab-readout` — A/B 测试结果解读模板
- `/data:dashboard` — Dashboard 从需求到原型的流程

---

Maurice | maurice_wen@proton.me
"""


def render_settings_json() -> str:
    return json.dumps({
        "_meta": {
            "pack": "data-analyst",
            "source": "AI-Fleet native (skills/shared/ + .claude/agents/)",
            "audience": "data analyst / growth PM / business analyst",
        },
        "memory": {"chunks": 96},
        "autonomy": {"level": "L2-counselor"},
        "mcpServers": {},
    }, indent=2, ensure_ascii=False)


def render_install_sh() -> str:
    return """#!/bin/bash
# Agent Foundry - Data Analyst Pack Installer (manifest-driven)
set -euo pipefail
PACK_ID="data-analyst"
BASE_URL="${FOUNDRY_BASE_URL:-https://openclaw-foundry.pages.dev}/packs/$PACK_ID"
TARGET_DIR="$HOME/.claude"

echo "Installing Data Analyst Pack: $PACK_ID"
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
echo "  rm -rf \\$HOME/.claude/skills/analyze \\\\"
echo "         \\$HOME/.claude/agents/research-analyst.md \\\\"
echo "         \\$HOME/.claude/agents/advisor-meadows.md"
"""


def build_manifest() -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for fname in ("CLAUDE.md", "AGENTS.md", "settings.json", "prompts.md"):
        items.append({"src": fname, "dst": fname, "type": "config"})
    for s in SKILLS:
        items.append({
            "src": f"skills/{s}/SKILL.md",
            "dst": f"skills/analyze/{s}/SKILL.md",
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
        print(f"  DRY-RUN data-analyst/  config={len(config_files)} + artifacts={n_artifacts} total={total}")
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
    print(f"  wrote data-analyst/  config={len(config_files)} artifacts={n_copied} total={actual_total}")

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
    print(f"  updated packs.json (+1 data-analyst entry)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
