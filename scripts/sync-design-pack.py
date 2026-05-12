#!/usr/bin/env python3
"""sync-design-pack.py — bridge AI-Fleet's design/prototyping skill bundle
into Agent Foundry as the `design-prototyper` job pack.

Bundles:
  - 8 design/prototype skills (prototype, stitch, design-system, etc.)
  - 3 advisor agents (advisor-jobs, advisor-hara, advisor-catmull)

Idempotent. Usage:
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
FOUNDRY_PACK_DIR = FOUNDRY_ROOT / "web" / "public" / "packs" / "design-prototyper"
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

PACK_META = {
    "id": "design-prototyper",
    "name": "Design Prototyper",
    "nameZh": "原型设计师",
    "description": "Rapid prototyping + visual polish + design review: 8 design skills + 3 advisor lenses.",
    "descriptionZh": "快速原型 + 视觉打磨 + 设计评议工作台：8 个设计 skill + 3 位顾问视角。",
    "icon": "brush",
    "color": "#DB2777",
    "line": "design",
    "lineZh": "创意设计线",
    "layerIds": ["universal", "line-design", "role-design-prototyper"],
    "version": "1.0.0",
}


def render_claude_md() -> str:
    return """# 原型设计师 · 配置 (Claude Code)

> Agent Foundry 原生包：把 AI-Fleet 的快速原型 + 视觉打磨骨架打包成
> 可移植工作台，给做产品原型、UI 设计、视觉评议的 PM/设计师使用。

## 角色定位

让 Claude 作为 **设计协调员 + 多视角评议者**：
- 用 `prototype` / `stitch-design-pipeline` 出快速可点原型
- 用 `design-system` / `visual-style` 做视觉一致性
- 用 `impeccable-design` / `design-review` 做最后打磨
- 跑 3 位 advisor 的差异化判断（Jobs 用户体验 / Hara 系统极简 / Catmull 创意文化）

## 适用场景

- 产品功能的可点原型（早期交互验证）
- 落地页 / 营销页视觉设计
- 现有产品的视觉审计与升级
- 设计系统从 0 到 1（tokens / components / patterns）

不适用：
- 写工程代码（用 frontend-engineer 包）
- 战略层面的产品方向（用 executive-strategist）

## 协作约定

- **先原型后设计**：用 prototype skill 出 30 秒可点版本，再细化视觉
- **3 advisor 互相挑刺**：任何设计稿先跑 Jobs+Hara+Catmull 三家评议
- **设计 token 先于像素**：先定 color/spacing/radius 系统，再画具体页面
- **真实数据**：原型用真实文案/图片，不用 Lorem Ipsum

## 顾问视角

| Advisor | 关注点 |
|---|---|
| advisor-jobs | 用户体验、设计卓越、用户惊喜 |
| advisor-hara | 系统极简、结构清晰、空无哲学 |
| advisor-catmull | 创意文化、心理安全、坦诚反馈 |

---

Maurice | maurice_wen@proton.me
"""


def render_agents_md() -> str:
    descriptions = {
        "advisor-jobs":    "Steve Jobs lens. 产品体验、设计卓越、用户惊喜。'这够好吗？'的最高标准。",
        "advisor-hara":    "Kenya Hara lens. 系统极简、结构清晰、'空' 的设计哲学。",
        "advisor-catmull": "Ed Catmull lens. 创意文化、坦诚反馈、心理安全。",
    }
    lines = []
    for a in AGENTS:
        lines.append(f"### {a}")
        lines.append(f"调用：`Task(subagent_type=\"{a}\")`")
        lines.append(f"视角：{descriptions[a]}")
        lines.append("")
    return f"""# 原型设计师 · 顾问矩阵

3 位 advisor 跑在独立上下文，工具只读。

## 顾问 ({len(AGENTS)})

{chr(10).join(lines)}

## 推荐调用

**单 advisor 锐评**：
```python
Task(subagent_type="advisor-jobs", prompt="评议这个落地页的首屏体验")
```

**三家分歧（推荐默认）**：
```python
Task(subagent_type="advisor-jobs", prompt="...")
Task(subagent_type="advisor-hara", prompt="...")
Task(subagent_type="advisor-catmull", prompt="...")
```

---

Maurice | maurice_wen@proton.me
"""


def render_prompts_md() -> str:
    return """# 原型设计师 · 斜杠命令

本包通过 skill 自动触发，未引入新斜杠命令。

后续候选：
- `/design:prototype` — 30 秒可点原型模板
- `/design:audit` — 现有设计的视觉审计
- `/design:advisor-council` — Jobs+Hara+Catmull 三家并行评议

---

Maurice | maurice_wen@proton.me
"""


def render_settings_json() -> str:
    return json.dumps({
        "_meta": {
            "pack": "design-prototyper",
            "source": "AI-Fleet native (skills/shared/ + .claude/agents/)",
            "audience": "designer / PM / creative director",
        },
        "memory": {"chunks": 96},
        "autonomy": {"level": "L2-counselor"},
        "mcpServers": {},
    }, indent=2, ensure_ascii=False)


def render_install_sh() -> str:
    return """#!/bin/bash
# Agent Foundry - Design Prototyper Pack Installer (manifest-driven)
set -euo pipefail
PACK_ID="design-prototyper"
BASE_URL="${FOUNDRY_BASE_URL:-https://openclaw-foundry.pages.dev}/packs/$PACK_ID"
TARGET_DIR="$HOME/.claude"

echo "Installing Design Prototyper Pack: $PACK_ID"
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
echo "  rm -rf \\$HOME/.claude/skills/design \\\\"
echo "         \\$HOME/.claude/agents/advisor-jobs.md \\\\"
echo "         \\$HOME/.claude/agents/advisor-hara.md \\\\"
echo "         \\$HOME/.claude/agents/advisor-catmull.md"
"""


def build_manifest() -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for fname in ("CLAUDE.md", "AGENTS.md", "settings.json", "prompts.md"):
        items.append({"src": fname, "dst": fname, "type": "config"})
    for s in SKILLS:
        items.append({
            "src": f"skills/{s}/SKILL.md",
            "dst": f"skills/design/{s}/SKILL.md",
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
        print(f"  DRY-RUN design-prototyper/  config={len(config_files)} + artifacts={n_artifacts} total={total}")
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
    print(f"  wrote design-prototyper/  config={len(config_files)} artifacts={n_copied} total={actual_total}")

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
    print(f"  updated packs.json (+1 design-prototyper entry)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
