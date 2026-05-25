#!/usr/bin/env python3
"""sync-strategy-pack.py — bridge AI-Fleet's NATIVE strategy-thinking layer
into Agent Foundry as the `executive-strategist` job pack.

Unlike `sync-spellbook-packs.py` which copies kid-sid/claude-spellbook
upstream content, this script bundles AI-Fleet's own home-grown strategy
infrastructure for executive audiences:

  - 8 strategy framework skills (SWOT, PESTLE, Porter's 5, Lean Canvas, etc.)
  - 5 advisor agents (Buffett, Munger, Drucker, Meadows, Taleb)
  - COGNITIVE_SKELETON.md reference (211 mental models index)

Pack layout (parallel to spellbook packs for installer compatibility):

  web/public/packs/executive-strategist/
    CLAUDE.md           role config (executive strategic-thinking workspace)
    AGENTS.md           advisor matrix
    prompts.md          slash command index (currently empty)
    settings.json       autonomy: L2-counselor (advisory, not execution)
    install.sh          manifest-driven downloader
    manifest.json       artifact catalog
    skills/<id>/SKILL.md       (renamed from AI-Fleet's SPEC.md convention)
    agents/<id>.md             (raw copy of advisor-*.md)
    references/cognitive-skeleton.md   (211-model index)

Idempotent. Reversible via `--uninstall`.

Usage:
    python3 scripts/sync-strategy-pack.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

# ---- paths ----
FOUNDRY_ROOT = Path(__file__).resolve().parent.parent
AI_FLEET_ROOT = Path(os.environ.get("AI_FLEET_ROOT", Path.home() / "00-AI-Fleet")).expanduser()
FOUNDRY_PACK_DIR = FOUNDRY_ROOT / "web" / "public" / "packs" / "executive-strategist"
FOUNDRY_PACKS_JSON = FOUNDRY_ROOT / "web" / "public" / "data" / "packs.json"

# ---- pack catalog ----
# Skills: AI-Fleet's home-grown strategy frameworks (skills/shared/<id>/SPEC.md)
SKILLS = [
    "swot-analysis",
    "pestle-analysis",
    "porters-five-forces",
    "business-model",
    "lean-canvas",
    "value-proposition",
    "ansoff-matrix",
    "product-strategy",
]
# Agents: advisor lenses for multi-mental-model deliberation
AGENTS = [
    "advisor-buffett",   # moat thinking, focus, saying no
    "advisor-munger",    # multi-mental-model decision analysis
    "advisor-drucker",   # business value, customer focus
    "advisor-meadows",   # systems dynamics, leverage points
    "advisor-taleb",     # antifragility, asymmetric risk
]
# Reference docs
REFERENCES = {
    "cognitive-skeleton.md": "knowledge/models/COGNITIVE_SKELETON.md",
}

PACK_META = {
    "id": "executive-strategist",
    "name": "Executive Strategist",
    "nameZh": "高管战略顾问",
    "description": "Executive strategic thinking workspace: 8 frameworks + 5 advisor lenses + 211-model cognitive skeleton.",
    "descriptionZh": "高管战略思考工作台：8 个分析框架 + 5 位顾问导师视角 + 211 心智模型索引。",
    "icon": "insights",
    "color": "#1E3A8A",  # deep navy — premium / boardroom register
    "line": "strategy",
    "lineZh": "战略决策线",
    "layerIds": ["universal", "line-strategy", "role-executive-strategist"],
    "version": "1.0.0",
}


def render_claude_md() -> str:
    return """# 高管战略顾问 · 配置 (Claude Code)

> Agent Foundry 原生包：把 AI-Fleet 的策略思考层（框架 + 顾问 + 心智骨架）
> 打包给做战略规划、市场分析、投资决策的高管用。

## 角色定位

为高管做战略规划与分析。Claude 将作为 **战略顾问** 而不是 **执行助手**：
推荐多种角度的思考框架，呈现 Buffett / Munger / Drucker / Meadows / Taleb
五位顾问的视角差异，并基于 Munger 的 211 心智模型库做决策辅助。

英文版：Executive strategic-counselor role. Multi-lens deliberation, not
single-track execution.

## 适用场景

- 做 5 年战略规划、市场进入决策、资本配置
- 评估收并购机会、新业务线 GO/NO-GO
- 高管层的 SWOT / PESTLE / Porter's Five Forces / 蓝海定位
- 跨部门战略对齐前的多角度思考
- "我们应不应该做 X？" 的反向论证（Inversion #001）

不适用：
- 写代码、跑测试、做交付（请用 spellbook-code-reviewer 等工程包）
- 单一答案的事实问题（请直接问，无需框架）

## 协作约定

- **多视角先于单一结论**：每次战略问题先调用 ≥ 2 个 advisor 看分歧
- **Inversion 必跑**：决策前先问 "什么会让这个失败"，不是 "什么会让它成功"
- **211 心智模型**：策略问题先扫 `references/cognitive-skeleton.md` 看哪几个
  model 直接命中
- **中文交付**：deliverable 写中文，技术标识符（框架名、advisor slug）保留英文

## 框架库

本包提供 8 个战略分析框架（skill 形式，按需自动触发）：

| 框架 | 用途 |
|---|---|
| swot-analysis | 优劣机威四象限 |
| pestle-analysis | 宏观环境扫描 |
| porters-five-forces | 行业结构分析 |
| business-model | 商业模式画布 (BMC) |
| lean-canvas | 精益创业画布 |
| value-proposition | 价值主张设计 |
| ansoff-matrix | 市场/产品成长矩阵 |
| product-strategy | 产品战略规划 |

## 顾问矩阵

5 个 advisor agent，每个携带独立的判断风格 + 工具限制：

| Advisor | 视角 | 调用关键词 |
|---|---|---|
| Buffett | 护城河、long-term compounding、focus | 投资、moat、专注、估值 |
| Munger | 多重心智模型、inversion、风险识别 | 决策、tradeoff、能力圈 |
| Drucker | 业务增长、客户价值、organizational design | 增长、客户、组织 |
| Meadows | 系统动力学、leverage points、feedback loop | 系统、杠杆、机制 |
| Taleb | antifragility、black swan、asymmetric risk | 风险、不确定性、压力测试 |

## 升级路径

如果需要更深的心智模型库（211 模型完整版 + 13 advisor 全集），切换到
AI-Fleet 本体使用：

```bash
cd /path/to/AI-Fleet
# 211 完整 + 13 advisor 全员
```

详见 `references/cognitive-skeleton.md`。

---

Maurice | maurice_wen@proton.me
"""


def render_agents_md() -> str:
    advisor_lines = []
    descriptions = {
        "advisor-buffett":  "护城河思维 / 长期复利 / 说不的纪律。投资决策、战略聚焦、资源分配。",
        "advisor-munger":   "多重心智模型分析 / 风险识别 / inversion。重大决策、tradeoff、能力圈检查。",
        "advisor-drucker":  "业务增长 / 价值定义 / 客户聚焦。增长战略、功能优先级、'应不应做'决策。",
        "advisor-meadows":  "系统动力学 / 反馈回路 / 杠杆点。系统设计、cascading effect、小变化大影响。",
        "advisor-taleb":    "Antifragility / 黑天鹅 / skin in the game / asymmetric risk。风险评估、压力测试。",
    }
    for a in AGENTS:
        advisor_lines.append(f"### {a}")
        advisor_lines.append(f"调用方式：`Task(subagent_type=\"{a}\")`")
        advisor_lines.append(f"安装路径：`.claude/agents/{a}.md`")
        advisor_lines.append(f"视角：{descriptions.get(a, '(see agent file)')}")
        advisor_lines.append("")

    return f"""# 高管战略顾问 · 顾问矩阵

## 协作约定

本包的 5 位 advisor 是 AI-Fleet 13-advisor 套件中最聚焦于战略思考的子集
（Buffett/Munger/Drucker/Meadows/Taleb）。他们都跑在独立上下文里，工具
权限受限（只读 + WebSearch），不能修改文件。这是 by design：advisor
的输出是判断，不是执行。

## 本包提供的顾问 ({len(AGENTS)})

{chr(10).join(advisor_lines)}

## 推荐调用模式

**单 advisor — 锐利判断**：
```python
Task(subagent_type="advisor-buffett", prompt="我们应不应该收购 X 公司？")
```

**多 advisor — 视角分歧**：
```python
# 同问题问 3 个 advisor，看分歧
Task(subagent_type="advisor-buffett", prompt="...")   # moat lens
Task(subagent_type="advisor-meadows", prompt="...")   # systems lens
Task(subagent_type="advisor-taleb", prompt="...")     # tail-risk lens
```

**蜂群审计模式**：所有 5 个并行 → 看共识 vs 分歧 → 决策的多维度照射。

---

Maurice | maurice_wen@proton.me
"""


def render_prompts_md() -> str:
    return """# 高管战略顾问 · 斜杠命令

本包目前不引入新的斜杠命令。战略框架通过 skill 自动触发（按内容匹配），
advisor 通过 `Task(subagent_type=...)` 显式调用。

## 后续扩展候选

如果未来需要专属斜杠命令，候选方向：

- `/strategy:swot` — SWOT 模板一键填充
- `/strategy:advisor-council` — 调起 5 advisor 并行评议
- `/strategy:inversion` — 强制走 Munger 的反向论证流程

不优先实现，因为 skill 自动触发 + Task 显式调用已经覆盖了 95% 用例。

---

Maurice | maurice_wen@proton.me
"""


def render_settings_json() -> str:
    settings = {
        "_meta": {
            "pack": "executive-strategist",
            "source": "AI-Fleet native (skills/shared/ + .claude/agents/)",
            "audience": "executive / strategist / investor",
        },
        "memory": {"chunks": 96},
        "autonomy": {"level": "L2-counselor"},
        # No MCP servers required — advisors are read-only + WebSearch
        "mcpServers": {},
    }
    return json.dumps(settings, indent=2, ensure_ascii=False)


def render_install_sh() -> str:
    return """#!/bin/bash
# Agent Foundry - Executive Strategist Pack Installer (manifest-driven)
# Pack: executive-strategist
# Source of truth: AI-Fleet native (skills/shared/ + .claude/agents/)
set -euo pipefail
PACK_ID="executive-strategist"
# Production URL; override via FOUNDRY_BASE_URL=http://localhost:3200 for local testing.
BASE_URL="${FOUNDRY_BASE_URL:-https://agent-foundry.pages.dev}/packs/$PACK_ID"
TARGET_DIR="${INSTALL_DEST:-$HOME/.claude}"

echo "Installing Executive Strategist Pack: $PACK_ID"
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
echo "Next steps:"
echo "  1. Restart Claude Code"
echo "  2. Strategy frameworks auto-trigger by description match"
echo "  3. Advisors: Task(subagent_type=\\"advisor-<name>\\")"
echo "  4. Mental models: read \\$HOME/.claude/references/cognitive-skeleton.md"
echo ""
echo "Uninstall:"
echo "  rm -rf \\$HOME/.claude/skills/strategy \\\\"
echo "         \\$HOME/.claude/agents/advisor-* \\\\"
echo "         \\$HOME/.claude/references/cognitive-skeleton.md"
"""


def build_manifest() -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    # Workspace configs
    for fname in ("CLAUDE.md", "AGENTS.md", "settings.json", "prompts.md"):
        items.append({"src": fname, "dst": fname, "type": "config"})
    # Strategy framework skills (renamed SPEC.md → SKILL.md)
    for s in SKILLS:
        items.append({
            "src": f"skills/{s}/SKILL.md",
            "dst": f"skills/strategy/{s}/SKILL.md",
            "type": "skill",
        })
    # Advisor agents
    for a in AGENTS:
        items.append({
            "src": f"agents/{a}.md",
            "dst": f"agents/{a}.md",
            "type": "agent",
        })
    # References (cognitive skeleton)
    for fname in REFERENCES:
        items.append({
            "src": f"references/{fname}",
            "dst": f"references/{fname}",
            "type": "reference",
        })
    return items


def copy_artifacts(target_dir: Path) -> int:
    written = 0
    # Skills: AI-Fleet's SPEC.md → pack's SKILL.md
    for s in SKILLS:
        src = AI_FLEET_ROOT / "skills" / "shared" / s / "SPEC.md"
        if not src.exists():
            print(f"    WARN: missing skill source: {src}", file=sys.stderr)
            continue
        dst = target_dir / "skills" / s / "SKILL.md"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        written += 1
    # Agents
    for a in AGENTS:
        src = AI_FLEET_ROOT / ".claude" / "agents" / f"{a}.md"
        if not src.exists():
            print(f"    WARN: missing agent source: {src}", file=sys.stderr)
            continue
        dst = target_dir / "agents" / f"{a}.md"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        written += 1
    # References
    for fname, rel in REFERENCES.items():
        src = AI_FLEET_ROOT / rel
        if not src.exists():
            print(f"    WARN: missing reference: {src}", file=sys.stderr)
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
    parser.add_argument("--dry-run", action="store_true", help="preview without writing")
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
        print(f"  DRY-RUN executive-strategist/  config={len(config_files)} + artifacts={n_artifacts} "
              f"(skills={len(SKILLS)} agents={len(AGENTS)} refs={len(REFERENCES)})  total={total}")
        print(f"  DRY-RUN would register packs.json entry")
        return 0

    # Wipe + recreate pack dir for idempotency
    if FOUNDRY_PACK_DIR.exists():
        shutil.rmtree(FOUNDRY_PACK_DIR)
    FOUNDRY_PACK_DIR.mkdir(parents=True, exist_ok=True)
    for fname, content in config_files.items():
        (FOUNDRY_PACK_DIR / fname).write_text(content)
        if fname == "install.sh":
            (FOUNDRY_PACK_DIR / fname).chmod(0o755)
    n_copied = copy_artifacts(FOUNDRY_PACK_DIR)
    actual_total = len(config_files) + n_copied
    print(f"  wrote executive-strategist/  config={len(config_files)} artifacts={n_copied} "
          f"total={actual_total} files")

    # Register in packs.json (drop any prior entry for idempotency)
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
    print(f"  updated packs.json (+1 executive-strategist entry)")

    print(f"\nDone. 1 pack × {actual_total} total files written.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
