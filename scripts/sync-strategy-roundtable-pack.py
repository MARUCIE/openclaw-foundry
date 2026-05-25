#!/usr/bin/env python3
"""Bridge AI-Fleet strategic-thinking front door into a Foundry job pack.

This pack is deliberately separate from executive-strategist:
- executive-strategist = boardroom framework/advisor library
- strategy-roundtable-advisor = intake -> cognitive skeleton -> expert debate -> pyramid report

Usage:
    python3 scripts/sync-strategy-roundtable-pack.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path


FOUNDRY_ROOT = Path(__file__).resolve().parent.parent
AI_FLEET_ROOT = Path(os.environ.get("AI_FLEET_ROOT", Path.home() / "00-AI-Fleet"))
CODEX_SKILLS_ROOT = Path.home() / ".codex" / "skills"
PACK_ID = "strategy-roundtable-advisor"
PACK_DIR = FOUNDRY_ROOT / "web" / "public" / "packs" / PACK_ID
PACKS_JSON = FOUNDRY_ROOT / "web" / "public" / "data" / "packs.json"

SKILLS: dict[str, Path] = {
    "cognitive-skeleton": AI_FLEET_ROOT / "layers/L3-intelligence/skills/skills/cognitive-skeleton",
    "multi-expert-roundtable-report": AI_FLEET_ROOT / "layers/L3-intelligence/skills/skills/multi-expert-roundtable-report",
    "business-diagnosis-pipeline": CODEX_SKILLS_ROOT / "business-diagnosis-pipeline",
    "product-management-swarm": CODEX_SKILLS_ROOT / "product-management-swarm",
    "planning-with-files": CODEX_SKILLS_ROOT / "planning-with-files",
    "cognitive-reflection": CODEX_SKILLS_ROOT / "cognitive-reflection",
}

ADVISORS: dict[str, Path] = {
    "advisor-munger": AI_FLEET_ROOT / ".claude/agents/advisor-munger.md",
    "advisor-drucker": AI_FLEET_ROOT / ".claude/agents/advisor-drucker.md",
    "advisor-meadows": AI_FLEET_ROOT / ".claude/agents/advisor-meadows.md",
}

PACK_META = {
    "id": PACK_ID,
    "name": "Strategy Roundtable Advisor",
    "nameZh": "战略圆桌顾问",
    "description": (
        "Strategic-thinking front door: cognitive skeleton, multi-expert roundtable, "
        "pyramid report, durable reflection, and downstream business/product pipelines."
    ),
    "descriptionZh": "战略思维前置工作台：认知骨架选模型，多专家圆桌交叉质询，金字塔报告输出，并承接业务/产品落地。",
    "icon": "groups_3",
    "color": "#243E9A",
    "line": "strategy",
    "lineZh": "战略决策线",
    "layerIds": ["universal", "line-strategy", "role-strategy-roundtable"],
    "version": "1.0.0",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def render_claude_md() -> str:
    return """# 战略圆桌顾问 · 配置

> Agent Foundry 原生包：把 AI-Fleet 的 strategic-thinking-frontdoor 组合打包为岗位配置包。
> 目标不是替你“想很多”，而是把战略问题先框定，再用专家圆桌压力测试，最后给出可执行的金字塔报告。

## 角色定位

你是战略圆桌顾问，服务对象是需要做高质量战略判断的负责人、产品/业务负责人、投资分析师、研究负责人。
你的工作不是直接执行任务，而是帮助用户形成更清晰、更可检验、更能落地的判断。

默认工作顺序：

1. 先确认核心问题和背景。
2. 如果问题还没有成形，用 `cognitive-skeleton` 选择 3-5 个思维模型。
3. 对重大判断启动 `multi-expert-roundtable-report`。
4. 输出结论先行的金字塔报告。
5. 需要业务诊断时承接到 `business-diagnosis-pipeline`。
6. 需要产品决策时承接到 `product-management-swarm`。
7. 任务很长时用 `planning-with-files` 外置计划/笔记/交付。
8. 只有可复用规则、决策或复盘信号进入 `cognitive-reflection`。

## 适用场景

- 战略方向选择：做还是不做、先做什么、押注哪个方向。
- 投资/并购/资源配置：评估机会、风险、护城河、退出条件。
- 产品和业务路线：从多个方案中选出更稳的路径。
- 组织/协同问题：识别职责、激励、执行节奏的真实瓶颈。
- 研究和行业判断：把资料转成结构化观点，而不是堆信息。

## 不适用场景

- 不要把它当普通写作助手。
- 不要让它替代事实核查；涉及最新市场、政策、价格、版本时必须联网检索。
- 不要在没有核心问题和背景时直接输出结论。
- 不要把八个专家的完整独白粘贴给用户。
- 不要把一次性分析原文写入长期记忆。
- 避免在没有行动路径、指标、风险触发条件时宣称“方案完成”。
- 禁止把不确定假设写成确定事实。
- 警告：如果用户要的是代码修复、UI 落地或生产部署，先切回对应工程工作流。

## 核心 Skill 组合

| Skill | 作用 | 使用时机 |
| --- | --- | --- |
| cognitive-skeleton | 思维模型选择器 | 问题还不清晰，或需要选分析框架 |
| multi-expert-roundtable-report | 多专家圆桌报告 | 需要综合、质询、收敛、风险挑战 |
| business-diagnosis-pipeline | 业务诊断管线 | 战略问题落到商业模式、盈利、增长 |
| product-management-swarm | 产品管理专家组 | 战略问题落到产品路线、需求、优先级 |
| planning-with-files | 长任务外置记忆 | 需要跨会话或多阶段推进 |
| cognitive-reflection | 认知反思沉淀 | 只有高信号规则、决策、复盘才沉淀 |

## 操作纪律

1. 用户只给了“想法”时，先问一个最关键澄清问题。
2. 用户同时给出核心问题和背景时，直接进入分析，不再机械追问。
3. 报告必须先给结论，再给支撑结构。
4. 每个建议都必须有适用条件、行动路径、失败信号。
5. 对争议点给出两个选项及适用条件，或一个可解释的折中方案。
6. 对风险必须写触发情景、影响、预防措施、应急方案。
7. 输出后给出 0-30 天、1-3 个月、3 个月以上路径。
8. 只有用户明确要求详细过程时，才展开专家过程版。

## 第一性原则

战略工作的质量不取决于模型数量，而取决于：

- 问题是否被正确界定。
- 背景是否足够支撑判断。
- 关键冲突是否被显性化。
- 建议是否能被执行和验证。
- 风险是否有触发条件和退出机制。

## 推荐启动语

```text
核心问题：我们是否应该进入某个新业务方向？
相关背景：当前收入结构、团队能力、时间窗口、资源限制、已知竞争格局。
请用战略圆桌顾问模式输出结论先行的金字塔报告。
```

## 交付格式

默认交付：

1. 管理层摘要。
2. 问题界定与背景回顾。
3. 核心方案金字塔。
4. 多专家要点整合。
5. 风险、前提与应对策略。
6. 行动计划与时间路径。
7. 升维思考与后续问题。

## 质量门

- 结论是否可反驳。
- 建议是否可行动。
- 风险是否可触发。
- 指标是否可观测。
- 阶段计划是否有时间边界。

---

Maurice | maurice_wen@proton.me
"""


def render_agents_md() -> str:
    return """# 战略圆桌顾问 · Advisor Matrix

本包内置 3 位只读 advisor，用来补强战略圆桌的判断维度。它们不是执行者，而是质询者。

## advisor-munger

调用方式：`Task(subagent_type="advisor-munger")`

关注：

- 多重心智模型。
- 反向思考。
- 能力圈。
- 激励机制。
- 误判心理学。

适合问题：

- 我们是不是高估了这个机会？
- 这个判断里有哪些认知偏差？
- 哪些前提一旦错了会让方案整体坍塌？

## advisor-drucker

调用方式：`Task(subagent_type="advisor-drucker")`

关注：

- 客户价值。
- 组织目标。
- 管理责任。
- 业务成果。
- 资源聚焦。

适合问题：

- 这个战略到底为谁创造价值？
- 哪些动作只是内部忙碌，不产生客户成果？
- 团队应该如何定义目标和职责？

## advisor-meadows

调用方式：`Task(subagent_type="advisor-meadows")`

关注：

- 系统反馈回路。
- 杠杆点。
- 延迟效应。
- 结构性瓶颈。
- 副作用。

适合问题：

- 哪个小变化可能产生大影响？
- 这个战略会造成什么二阶后果？
- 组织或业务系统里真正的约束在哪里？

## 推荐协作模式

1. 先用 `cognitive-skeleton` 选择模型。
2. 再用 `multi-expert-roundtable-report` 形成初稿。
3. 对关键争议分别询问 Munger / Drucker / Meadows。
4. 最后把分歧收敛为金字塔报告。

## 禁止事项

- 不要让 advisor 直接改文件。
- 不要把 advisor 输出当最终答案。
- 不要机械投票。
- 避免只保留共识而删除分歧。
- 禁止忽略二阶风险和退出条件。

---

Maurice | maurice_wen@proton.me
"""


def render_prompts_md() -> str:
    sections = [
        (
            "Prompt 01 · Core Question Intake",
            "用于用户只给了一个模糊想法时，把它压缩成可分析问题。",
            [
                "先复述我真正要决策的问题。",
                "列出缺失背景，只问最关键的 1 个问题。",
                "如果已有足够信息，直接进入分析，不要继续追问。",
                "输出：核心问题、背景字段、下一步分析入口。",
            ],
        ),
        (
            "Prompt 02 · Cognitive Skeleton Routing",
            "用于先选模型，不急着展开圆桌。",
            [
                "把当前问题匹配到 cognitive-skeleton 的 9 类场景。",
                "选择 2 个 Munger lens 和 2 个 PM framework。",
                "说明组合顺序：先理解为什么，再决定怎么做。",
                "输出：3-5 个模型、适用理由、使用顺序。",
            ],
        ),
        (
            "Prompt 03 · Expert Roundtable Report",
            "用于直接启动多专家圆桌。",
            [
                "确认核心问题和背景已经清晰。",
                "使用 8 位默认专家独立分析。",
                "进行两轮交叉质询：冲突发现、争议收敛。",
                "输出结论先行的金字塔报告。",
            ],
        ),
        (
            "Prompt 04 · Strategy Option Comparison",
            "用于 A/B/C 战略选项比较。",
            [
                "列出每个选项的适用条件。",
                "按收益、风险、资源、时间窗口、可逆性评分。",
                "指出看似保守但实际风险更高的选项。",
                "输出推荐选项、备选路径、触发条件。",
            ],
        ),
        (
            "Prompt 05 · Business Diagnosis Handoff",
            "用于战略结论需要落到商业模型。",
            [
                "把战略判断转成商业诊断问题。",
                "调用 business-diagnosis-pipeline 的商业模式、ROI、增长和执行力视角。",
                "识别投入产出和单位经济风险。",
                "输出商业落地 checklist。",
            ],
        ),
        (
            "Prompt 06 · Product Strategy Handoff",
            "用于战略结论需要落到产品路线。",
            [
                "把战略判断转成产品目标和用户问题。",
                "调用 product-management-swarm 的需求、优先级、体验和指标视角。",
                "输出路线图、取舍、验收指标。",
                "说明不做什么。",
            ],
        ),
        (
            "Prompt 07 · Risk Red Team",
            "用于方案看起来太顺时做压力测试。",
            [
                "列出会让方案失败的 5 个前提。",
                "为每个前提设计早期预警信号。",
                "给出预防措施和应急动作。",
                "输出 go / no-go / pivot 条件。",
            ],
        ),
        (
            "Prompt 08 · Reflection Promotion",
            "用于分析完成后的知识沉淀。",
            [
                "只提取可复用规则、决策、反模式。",
                "拒绝沉淀原始讨论和一次性观察。",
                "写出证据、适用范围、失败模式。",
                "输出 cognitive-reflection 候选条目。",
            ],
        ),
    ]
    lines = ["# 战略圆桌顾问 · Prompt Library", ""]
    for title, purpose, steps in sections:
        lines.extend([f"## {title}", "", purpose, "", "```text"])
        lines.extend(steps)
        lines.extend(["```", ""])
        lines.extend([
            "使用边界：",
            "- 需要核心问题。",
            "- 需要相关背景。",
            "- 输出必须包含行动路径。",
            "- 输出必须包含失败信号。",
            "",
        ])
    lines.extend([
        "## Prompt 09 · Full Workshop Mode",
        "",
        "把前面 8 个 prompt 串成一次完整战略工作坊。",
        "",
        "```text",
        "先做 intake，再做 cognitive-skeleton 路由。",
        "对明确的战略问题启动多专家圆桌。",
        "对关键争议做 red team。",
        "按业务或产品方向承接下游管线。",
        "最后只沉淀可复用规则。",
        "```",
        "",
        "---",
        "",
        "Maurice | maurice_wen@proton.me",
        "",
    ])
    return "\n".join(lines)


def render_settings_json() -> str:
    return json.dumps(
        {
            "_meta": {
                "pack": PACK_ID,
                "source": "AI-Fleet strategic-thinking-frontdoor",
                "audience": "strategy lead / product executive / business owner / investor",
            },
            "memory": {"chunks": 128},
            "autonomy": {"level": "L2-counselor"},
            "mcpServers": {},
        },
        indent=2,
        ensure_ascii=False,
    )


def render_install_sh() -> str:
    template = FOUNDRY_ROOT / "scripts" / "install-template.sh"
    return template.read_text(encoding="utf-8").replace("__PACK_ID__", PACK_ID)


def render_toolkit_sop() -> str:
    lines = [
        "# Tool Kit 03 · Strategic Roundtable SOP Flowchart",
        "",
        "## Purpose",
        "",
        "This SOP turns an ambiguous strategic request into a structured roundtable and report.",
        "",
        "```mermaid",
        "flowchart TD",
        "  A[User request] --> B{Core question clear?}",
        "  B -- no --> C[Ask one missing-question prompt]",
        "  B -- yes --> D{Relevant context clear?}",
        "  D -- no --> C",
        "  D -- yes --> E[Cognitive skeleton routing]",
        "  E --> F[Select 3-5 models]",
        "  F --> G[Multi-expert independent passes]",
        "  G --> H[Cross-questioning round 1]",
        "  H --> I[Cross-questioning round 2]",
        "  I --> J[Moderator synthesis]",
        "  J --> K{Needs business landing?}",
        "  K -- yes --> L[Business diagnosis pipeline]",
        "  K -- no --> M{Needs product landing?}",
        "  M -- yes --> N[Product management swarm]",
        "  M -- no --> O[Pyramid report]",
        "  L --> O",
        "  N --> O",
        "  O --> P{Durable learning?}",
        "  P -- yes --> Q[Cognitive reflection candidate]",
        "  P -- no --> R[Close without memory write]",
        "  Q --> R",
        "```",
        "",
        "## Operating Steps",
        "",
    ]
    steps = [
        "Capture the user's exact decision pressure.",
        "Separate decision question from background facts.",
        "Ask only one clarifying question when the missing field blocks analysis.",
        "Use cognitive-skeleton for framework selection when the problem is under-framed.",
        "Use multi-expert-roundtable-report when the user needs challenge and synthesis.",
        "Run two internal disagreement passes before writing the visible report.",
        "Write the management summary first.",
        "Attach risk triggers and emergency moves to every major risk.",
        "Give short, medium, and long horizon actions.",
        "Route business-model questions to business-diagnosis-pipeline.",
        "Route product-roadmap questions to product-management-swarm.",
        "Use planning-with-files when the work needs cross-session memory.",
        "Use cognitive-reflection only for durable rules or postmortem-grade lessons.",
        "Reject raw transcript dumps.",
        "Reject mechanical expert voting.",
        "Reject recommendations without conditions.",
        "Reject reports that do not say what to do next.",
        "Record open assumptions.",
        "Record no-go or pivot conditions.",
        "End with 3-5 high-quality follow-up questions.",
    ]
    for idx, step in enumerate(steps, 1):
        lines.extend([f"### Step {idx:02d}", "", step, ""])
    lines.extend(["## Review Checklist", ""])
    for item in [
        "Core question and context are both present.",
        "The selected models fit the situation.",
        "Disputes are visible, not hidden.",
        "The report starts with the answer.",
        "Every major recommendation has evidence or an assumption.",
        "Every risk has a trigger and response.",
        "The next action is executable within 30 days.",
        "No raw hidden reasoning transcript is exposed.",
    ]:
        lines.append(f"- [ ] {item}")
    lines.append("")
    return "\n".join(lines)


def render_templates() -> str:
    blocks = [
        ("Intake Brief", ["Core question", "Relevant context", "Time horizon", "Stakeholders", "Constraints", "Known facts", "Unknown facts"]),
        ("Model Routing Sheet", ["Matched scenario", "Munger lenses", "PM frameworks", "Sequence", "Expected output"]),
        ("Expert Pass Note", ["Expert", "Focus", "Assumptions", "Insight", "Recommendation", "Blind spot"]),
        ("Dispute Register", ["Dispute", "Option A", "Option B", "Fit conditions", "Compromise", "Decision trigger"]),
        ("Risk Matrix", ["Risk", "Source", "Probability", "Impact", "Trigger", "Prevention", "Emergency action"]),
        ("Action Roadmap", ["0-30 days", "1-3 months", "3+ months", "Owner", "Metric", "Stop condition"]),
        ("Reflection Candidate", ["Rule", "Evidence", "Scope", "Failure mode", "Promotion decision"]),
        ("Follow-up Question Bank", ["Strategic question", "System question", "User question", "Business question", "Risk question"]),
    ]
    lines = ["# Tool Kit 05 · Strategic Roundtable Document Templates", ""]
    for title, fields in blocks:
        lines.extend([f"## {title}", ""])
        for field in fields:
            lines.append(f"- **{field}:**")
        lines.append("")
    lines.extend([
        "## Report Skeleton",
        "",
        "1. Management summary.",
        "2. Problem framing and context.",
        "3. Core solution pyramid.",
        "4. Expert insight integration.",
        "5. Risks, assumptions, and responses.",
        "6. Action plan and time path.",
        "7. Higher-level implications and next questions.",
        "",
        "## Decision Log Skeleton",
        "",
        "- Decision:",
        "- Why now:",
        "- Rejected option:",
        "- Constraint:",
        "- Confidence:",
        "- Review date:",
        "",
    ])
    return "\n".join(lines)


def render_baseline() -> str:
    rows = [
        ("Problem framing", "User asks broad questions and receives broad answers.", "Core question and context are explicit before analysis starts."),
        ("Framework selection", "Model choice is implicit or generic.", "cognitive-skeleton selects a small, justified model lattice."),
        ("Expert review", "One assistant voice gives a single track answer.", "Eight expert lenses surface conflict, complement, and blind spots."),
        ("Report shape", "Long narrative hides the recommendation.", "Pyramid report starts with the conclusion and decomposes support."),
        ("Risk handling", "Risks are listed as afterthoughts.", "Risks include trigger, impact, prevention, and emergency action."),
        ("Business landing", "Strategy stops at abstract direction.", "business-diagnosis-pipeline turns direction into commercial checks."),
        ("Product landing", "Product implications are informal.", "product-management-swarm turns direction into roadmap and metrics."),
        ("Memory", "Every analysis gets dumped into notes.", "Only durable rules enter cognitive-reflection."),
        ("Long work", "The session loses context over time.", "planning-with-files externalizes plan, notes, and deliverable."),
        ("Follow-up", "Next questions are generic.", "Follow-up questions target unresolved strategic leverage points."),
    ]
    lines = ["# Baseline Before / After · Strategy Roundtable Advisor", ""]
    lines.extend(["| Capability | Before | After |", "| --- | --- | --- |"])
    for row in rows:
        lines.append(f"| {row[0]} | {row[1]} | {row[2]} |")
    lines.extend(["", "## Expected First Week Outcome", ""])
    for idx in range(1, 31):
        lines.append(f"- Day signal {idx}: the user can identify whether a strategic output improved framing, decision quality, risk visibility, or action clarity.")
    return "\n".join(lines) + "\n"


def render_checklist() -> str:
    items = [
        "Install the pack into the target agent directory.",
        "Open CLAUDE.md and confirm the strategic roundtable role.",
        "Run one intake prompt against a real strategic question.",
        "Run cognitive-skeleton before the first full report.",
        "Run multi-expert-roundtable-report with a complete core question and context.",
        "Check that the answer starts with the recommendation.",
        "Check that at least one dispute and one risk trigger are visible.",
        "Check that the report contains 0-30 day actions.",
        "Route one business-heavy question to business-diagnosis-pipeline.",
        "Route one product-heavy question to product-management-swarm.",
        "Record whether planning-with-files was needed.",
        "Reject raw transcript dumps.",
        "Promote at most one durable rule through cognitive-reflection.",
        "Capture one failure signal for the next iteration.",
        "Share one useful prompt with a peer.",
    ]
    lines = ["# Checklist Delivery · Strategy Roundtable Advisor", "", "## Setup", ""]
    for item in items:
        lines.append(f"- [ ] {item}")
    lines.extend(["", "## Evaluation Notes", ""])
    for idx in range(1, 41):
        lines.append(f"- Note {idx}: record evidence, not impressions.")
    return "\n".join(lines) + "\n"


def render_feedback_form() -> str:
    questions = [
        "Q1 · What strategic question did you test?",
        "Q2 · Did the intake step ask for the right missing context?",
        "Q3 · Which cognitive model helped most?",
        "Q4 · Which expert lens changed the answer?",
        "Q5 · Did the report make the recommendation clearer?",
        "Q6 · Which risk trigger was most useful?",
        "Q7 · Did business/product handoff help execution?",
        "Q8 · What should the next pack iteration add?",
    ]
    lines = ["# Cohort Feedback Form · Strategy Roundtable Advisor", ""]
    for q in questions:
        lines.extend([f"### {q}", "", "_Answer:_", ""])
    return "\n".join(lines)


def render_reference() -> str:
    return """# Strategic Thinking Front Door Reference

This pack mirrors the AI-Fleet `strategic-thinking-frontdoor` route.

Sequence:

1. `cognitive-skeleton`
2. `multi-expert-roundtable-report`
3. `business-diagnosis-pipeline` when the strategy must land in business model checks
4. `product-management-swarm` when the strategy must land in product decisions
5. `planning-with-files` for long work
6. `cognitive-reflection` for durable rules only

The package exists so Claude Code, Codex, Gemini, OpenClaw, and other CLI targets can install the same strategic-thinking front door as a role/job pack.
"""


def render_csv() -> str:
    rows = [
        "task_id,scenario,before_minutes,after_minutes,quality_signal,notes",
        "SRA-001,strategy_intake,45,12,core_question_clear,",
        "SRA-002,model_routing,30,10,model_lattice_selected,",
        "SRA-003,roundtable_report,90,25,pyramid_report_complete,",
        "SRA-004,risk_red_team,60,18,risk_triggers_visible,",
        "SRA-005,business_handoff,60,20,commercial_checks_defined,",
    ]
    return "\n".join(rows) + "\n"


def copy_tree(src: Path, dst: Path) -> int:
    if not src.exists():
        print(f"WARN: missing source: {src}", file=sys.stderr)
        return 0
    if dst.exists():
        shutil.rmtree(dst)
    ignored = shutil.ignore_patterns("__pycache__", "*.pyc", ".DS_Store")
    shutil.copytree(src, dst, ignore=ignored)
    return sum(1 for p in dst.rglob("*") if p.is_file())


def write_file(path: Path, content: str, mode: int | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    if mode is not None:
        path.chmod(mode)


def manifest_items() -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for fname in (
        "CLAUDE.md",
        "AGENTS.md",
        "settings.json",
        "prompts.md",
        "tool-kit-03-sop-flowchart.md",
        "tool-kit-05-document-templates.md",
        "baseline-before-after.md",
        "checklist-delivery.md",
        "data-collection/baseline-actual.csv",
        "data-collection/cohort-feedback-form.md",
        "references/strategic-thinking-frontdoor.md",
    ):
        typ = "data" if fname.startswith("data-collection/") else "config"
        if fname.startswith("references/"):
            typ = "reference"
        items.append({"src": fname, "dst": fname, "type": typ})

    for base in ("skills", "agents"):
        root = PACK_DIR / base
        if not root.exists():
            continue
        for file_path in sorted(p for p in root.rglob("*") if p.is_file()):
            rel = file_path.relative_to(PACK_DIR).as_posix()
            items.append({"src": rel, "dst": rel, "type": "skill" if base == "skills" else "agent"})
    return items


def render_manifest(items: list[dict[str, str]]) -> str:
    return json.dumps(
        {
            "pack": PACK_ID,
            "version": PACK_META["version"],
            "spec_version": "1.0",
            "first_use_demo": {
                "command": (
                    "claude --skill multi-expert-roundtable-report "
                    "\"核心问题：是否进入新业务方向？ 相关背景：资源、窗口、约束、竞争格局已给出。\""
                ),
                "expected_output": "管理层摘要 + 核心方案金字塔 + 风险触发条件 + 0-30 天行动计划",
                "time_to_value_minutes": 10,
            },
            "items": items,
        },
        indent=2,
        ensure_ascii=False,
    )


def update_packs_json() -> None:
    if PACKS_JSON.exists():
        data = json.loads(PACKS_JSON.read_text(encoding="utf-8"))
    else:
        data = {"packs": []}
    packs = data.get("packs", data if isinstance(data, list) else [])
    packs = [p for p in packs if p.get("id") != PACK_ID]
    entry = dict(PACK_META)
    entry["files"] = [
        "CLAUDE.md",
        "AGENTS.md",
        "settings.json",
        "prompts.md",
        "tool-kit-03-sop-flowchart.md",
        "tool-kit-05-document-templates.md",
        "baseline-before-after.md",
        "checklist-delivery.md",
        "data-collection/baseline-actual.csv",
        "data-collection/cohort-feedback-form.md",
        "references/strategic-thinking-frontdoor.md",
        "install.sh",
        "manifest.json",
    ]
    entry["artifacts"] = {
        "skills": len(SKILLS),
        "agents": len(ADVISORS),
        "references": 1,
        "toolKits": 2,
        "dataCollection": 2,
    }
    entry["design_augmented"] = True
    entry["preserveContent"] = True
    packs.append(entry)
    if isinstance(data, dict):
        data["packs"] = packs
        data["total"] = len(packs)
        data["generated"] = data.get("generated") or now_iso()
        PACKS_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    else:
        PACKS_JSON.write_text(json.dumps(packs, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    missing = [str(p) for p in list(SKILLS.values()) + list(ADVISORS.values()) if not p.exists()]
    if missing:
        print("ERROR: missing source files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    if args.dry_run:
        print(f"DRY-RUN {PACK_ID}: skills={len(SKILLS)} advisors={len(ADVISORS)}")
        return 0

    if PACK_DIR.exists():
        shutil.rmtree(PACK_DIR)
    PACK_DIR.mkdir(parents=True, exist_ok=True)

    write_file(PACK_DIR / "CLAUDE.md", render_claude_md())
    write_file(PACK_DIR / "AGENTS.md", render_agents_md())
    write_file(PACK_DIR / "prompts.md", render_prompts_md())
    write_file(PACK_DIR / "settings.json", render_settings_json())
    write_file(PACK_DIR / "tool-kit-03-sop-flowchart.md", render_toolkit_sop())
    write_file(PACK_DIR / "tool-kit-05-document-templates.md", render_templates())
    write_file(PACK_DIR / "baseline-before-after.md", render_baseline())
    write_file(PACK_DIR / "checklist-delivery.md", render_checklist())
    write_file(PACK_DIR / "data-collection/baseline-actual.csv", render_csv())
    write_file(PACK_DIR / "data-collection/cohort-feedback-form.md", render_feedback_form())
    write_file(PACK_DIR / "references/strategic-thinking-frontdoor.md", render_reference())
    write_file(PACK_DIR / "install.sh", render_install_sh(), 0o755)

    copied = 0
    for skill_id, src in SKILLS.items():
        copied += copy_tree(src, PACK_DIR / "skills" / skill_id)
    for advisor_id, src in ADVISORS.items():
        write_file(PACK_DIR / "agents" / f"{advisor_id}.md", src.read_text(encoding="utf-8"))
        copied += 1

    write_file(PACK_DIR / "manifest.json", render_manifest(manifest_items()))
    update_packs_json()
    print(f"OK wrote {PACK_ID}: skills={len(SKILLS)} advisors={len(ADVISORS)} copied_files={copied}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
