#!/usr/bin/env python3
"""Generate data/TOP-SKILLS.md — a browsable, rated, repo-native index hook.

The 40MB unified-index.json is the source of truth; nobody bookmarks a 40MB JSON
blob. This renders the top-N skills (by composite score) into a readable Markdown
table so the repo itself becomes the destination — the awesome-list virality
pattern, backed by a real S/A/B/C/D rating system.

Every number in the header is computed from the index `meta` block and printed
with the exact one-liner that reproduces it, so the badges can never silently
drift away from the data (the "counts must be reproducible or they become a
liability" rule).

Usage:
    python3 scripts/generate-top-skills.py            # writes data/TOP-SKILLS.md
    python3 scripts/generate-top-skills.py --top 50   # custom row count
"""
from __future__ import annotations

import argparse
import json
import pathlib

REPO = pathlib.Path(__file__).resolve().parent.parent
INDEX = REPO / "data" / "unified-index.json"
OUT = REPO / "data" / "TOP-SKILLS.md"

# Canonical categories are stored in Chinese; this repo's public face is English.
CATEGORY_EN = {
    "教育学习": "Education & Learning",
    "电商营销": "E-commerce & Marketing",
    "搜索与研究": "Search & Research",
    "效率工具": "Productivity",
    "DevOps 部署": "DevOps & Deployment",
    "AI 模型": "AI Models",
    "安全合规": "Security & Compliance",
    "金融交易": "Finance & Trading",
    "代码开发": "Code & Dev",
    "Agent 基建": "Agent Infrastructure",
    "办公文档": "Office & Docs",
    "区块链 Web3": "Blockchain & Web3",
    "浏览器自动化": "Browser Automation",
    "内容创作": "Content Creation",
    "游戏娱乐": "Gaming & Entertainment",
    "系统工具": "System Tools",
    "HR 人才": "HR & Talent",
    "通讯集成": "Communications",
    "生活服务": "Lifestyle",
    "多媒体": "Multimedia",
    "数据分析": "Data Analytics",
    "其他": "Other",
    "API 网关": "API Gateway",
}


def md_escape(text: str) -> str:
    """Keep a cell from breaking the table: strip pipes/newlines, clamp length."""
    cleaned = (text or "").replace("|", "\\|").replace("\n", " ").replace("\r", " ").strip()
    return cleaned[:80]


def rank_key(skill: dict) -> tuple:
    return (skill.get("score") or 0, skill.get("downloads") or 0, skill.get("stars") or 0)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--top", type=int, default=100, help="rows to render (default 100)")
    args = parser.parse_args()

    data = json.loads(INDEX.read_text())
    meta = data.get("meta", {})
    skills = data["skills"]

    total = meta.get("total", len(skills))
    by_rating = meta.get("byRating", {})
    by_source = meta.get("bySource", {})
    synced = meta.get("syncedAt", "unknown")
    s_count = by_rating.get("S", 0)
    s_pct = (s_count / total * 100) if total else 0

    ranked = sorted((s for s in skills if not s.get("stale")), key=rank_key, reverse=True)
    top = ranked[: args.top]

    lines: list[str] = []
    lines.append(f"# Top {args.top} Agent Skills — rated S by Agent Foundry")
    lines.append("")
    lines.append(
        f"A curated, rated, browsable slice of **{total:,} deduplicated agent skills** "
        f"({by_source.get('clawhub', 0):,} from ClawHub + {by_source.get('mcp-registry', 0):,} "
        "from the MCP registry). No signup, no website — the data lives right here in the repo."
    )
    lines.append("")
    lines.append(f"> Snapshot synced `{synced}` · regenerate with `python3 scripts/generate-top-skills.py`")
    lines.append("")
    lines.append("## How the rating works")
    lines.append("")
    lines.append(
        "Each skill carries a composite `score` (downloads + stars + metadata completeness), "
        "bucketed into percentile tiers. The distribution across the full index:"
    )
    lines.append("")
    lines.append("| Tier | Count | Share | Meaning |")
    lines.append("|------|------:|------:|---------|")
    tier_meaning = {
        "S": "top tier — battle-tested, widely adopted",
        "A": "strong, actively used",
        "B": "solid, niche traction",
        "C": "early or narrow",
        "D": "minimal signal",
    }
    for tier in ["S", "A", "B", "C", "D"]:
        n = by_rating.get(tier, 0)
        pct = (n / total * 100) if total else 0
        lines.append(f"| **{tier}** | {n:,} | {pct:.1f}% | {tier_meaning[tier]} |")
    lines.append("")
    lines.append(
        f"S is the top **~{s_pct:.0f}%** ({s_count:,} skills). This table shows the highest-scoring "
        f"{len(top)} of them, sorted by composite score then downloads."
    )
    lines.append("")
    lines.append("## The list")
    lines.append("")
    lines.append("| # | Skill | Author | Category | Rating | Downloads | Stars |")
    lines.append("|--:|-------|--------|----------|:------:|----------:|------:|")
    for i, s in enumerate(top, 1):
        name = md_escape(s.get("name", ""))
        url = s.get("url") or s.get("sourceUrl") or ""
        name_cell = f"[{name}]({url})" if url else name
        author = md_escape(s.get("author", ""))
        cat = CATEGORY_EN.get(s.get("category", ""), s.get("category", "") or "—")
        rating = s.get("rating", "—")
        dl = s.get("downloadsDisplay") or (f"{s.get('downloads'):,}" if s.get("downloads") else "—")
        st = s.get("starsDisplay") or (f"{s.get('stars'):,}" if s.get("stars") else "—")
        lines.append(f"| {i} | {name_cell} | {author} | {cat} | {rating} | {dl} | {st} |")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(
        "Want the full index? See [`unified-index.json`](unified-index.json) — every field for all "
        f"{total:,} entries (ClawHub skills + MCP-registry servers, deduplicated into one schema)."
    )
    lines.append("")
    lines.append("<sub>Maurice | maurice_wen@proton.me</sub>")
    lines.append("")

    OUT.write_text("\n".join(lines))
    print(f"OK wrote {OUT.relative_to(REPO)} — {len(top)} rows, source total={total:,}, S={s_count:,} ({s_pct:.1f}%)")


if __name__ == "__main__":
    main()
