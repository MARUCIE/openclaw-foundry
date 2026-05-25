---
name: multi-expert-roundtable-report
description: Use when the user wants an 8-expert or multi-expert roundtable, multi-perspective strategic analysis, consulting-style decision report, expert challenge session, pyramid-principle report, or front-door strategic thinking workflow. Always collect both a clear core question and relevant context before analysis.
category: strategic-thinking-frontdoor
tags: consulting, strategy, strategic-thinking, expert-roundtable, pyramid-principle, decision-analysis, business-diagnosis, global-skill
triggers: multi-expert-roundtable-report, multi expert roundtable, 8 experts, expert roundtable, pyramid report, consulting report, strategic thinking, strategy report, 多专家圆桌, 8专家, 八专家, 专家圆桌, 金字塔报告, 咨询报告, 多视角分析, 战略思维, 策略分析
---

# Multi-Expert Roundtable Report

Run a structured multi-expert roundtable and produce a conclusion-first pyramid-principle consulting report after the user provides both a core question and relevant context.

## Strategic Thinking Front Door

This skill is part of the global strategic-thinking front door shared across Claude Code, Codex, Gemini, and generic agent mirrors.

Use it with these adjacent skills:

- **`cognitive-skeleton`**: use first when the user asks which frameworks/models to apply, when the problem is under-framed, or when a 3-5 model lattice is enough.
- **`multi-expert-roundtable-report`**: use when the user needs synthesis, debate, decision pressure, risk challenge, and a report-ready pyramid output.
- **`cognitive-reflection`**: use after the analysis only when the user provides a durable decision, correction, postmortem signal, or reusable rule worth promoting.
- **`business-diagnosis-pipeline` / `product-management-swarm`**: use downstream when the decision needs a domain-specific execution pipeline.

Default sequence for strategic work:

1. Frame the core question and context.
2. If the frame is unclear, route through `cognitive-skeleton` to select the right lenses.
3. Run the expert roundtable only after the question and background are clear.
4. Produce the pyramid report and explicit next actions.
5. Promote only durable lessons through `cognitive-reflection`; do not dump raw discussion into memory.

## Intake Gate

Before starting the expert analysis, confirm the user has provided both:

- **Core question**: the decision, problem, or opportunity they most want to resolve.
- **Relevant context**: current state, target outcome, time horizon, object/stakeholders, resources, constraints, and known facts.

If either is missing or vague, ask only for the missing information and stop. Do not begin expert reasoning or give conclusions until both are reasonably clear.

Suggested prompt:

```text
为了帮你做一场多专家圆桌分析，请先补充：
1. 核心问题：你最想解决的是什么？
2. 相关背景：当前现状、目标、时间范围、对象、资源与限制是什么？
```

## Default Expert Table

Use these 8 experts unless the user changes the roles or count:

1. **Strategic and First-Principles Expert**: long-term direction, key leverage, goal decomposition; first principles, backward planning, second-order thinking, SMART.
2. **Systems and Complexity Expert**: structures, causal chains, feedback loops, emergence; systems thinking, iceberg model, causal loops, leverage points.
3. **User and Needs Insight Expert**: personas, pain points, scenarios, demand layers; five whys, journey map, KANO, Jobs To Be Done.
4. **Business and Finance Model Expert**: revenue model, cost structure, unit economics, ROI, risk-return; business model canvas, break-even, ROI analysis.
5. **Technology and Data Expert**: feasibility, implementation path, metrics, validation; maturity assessment, A/B design, Problem-Data-Insight-Action.
6. **Operations and Growth Expert**: acquisition, activation, retention, monetization, referral loops; AARRR, growth loops, north-star metric.
7. **Organization and Collaboration Expert**: team capability, ownership, incentives, execution; RACI, OKR, Tuckman, behavior-motivation iceberg.
8. **Risk, Ethics, and Compliance Expert**: legal, reputation, ethical boundary, extreme scenarios; risk matrix, scenario planning, red-team thinking.

User-specified expert roles override the default table. Preserve the roundtable method with the requested roles.

## Internal Workflow

Use this sequence internally, then report only the synthesized result:

1. **Unified framing**: restate the core question and context in your own words; extract 1-3 priority sub-questions.
2. **Independent expert passes**: for each expert, identify focus points, useful models, assumptions, key insights, recommendations, and blind spots.
3. **Cross-questioning round 1**: identify agreements, conflicts, complements, and blind spots across experts.
4. **Cross-questioning round 2**: converge on the main disputes; for each dispute, give either a compromise path or opposing options with fit conditions.
5. **Moderator synthesis**: define the problem essence, key consensus, remaining tradeoffs, phased action plan, assumptions, and risk controls.
6. **Higher-level scan**: add short/mid/long-term, individual/team/organization/industry, and resource-dimension implications.

Do not expose hidden chain-of-thought or a full transcript of internal expert dialogue. Provide concise rationale, assumptions, tradeoffs, and decision evidence.

## Visible Report Contract

Write the final answer as a conclusion-first pyramid-principle consulting report. Use Chinese when the user writes Chinese unless they request another language.

Recommended structure:

```markdown
一、管理层摘要（结论先行）
- 1-3 句总结论。
- 3-7 条最关键建议。

二、问题界定与背景回顾
- 复述核心问题和背景。
- 列出 1-3 个关键子问题。

三、核心方案金字塔（总-分结构）
- 先给出总方案。
- 展开 2-4 个一级建议模块；每个模块包含支撑理由、关键洞见、关键举措。

四、多专家要点整合
- 按专家维度提炼 2-4 条核心洞见。
- 只保留对结论有价值的分歧和补充。

五、风险、前提与应对策略
- 按影响力或概率列出 3-5 个关键风险。
- 对每个风险说明触发情景、影响、预防措施、应急方案。
- 列出 3-5 个关键前提；说明前提不成立时优先调整哪部分策略。

六、行动计划与时间路径
- 第一阶段（0-30 天）：目标、3-5 个行动、指标。
- 第二阶段（1-3 个月）：目标、关键行动、指标。
- 第三阶段（3 个月以上）：方向性目标、关键建设任务。

七、升维思考与后续问题
- 总结对个人、团队、组织、行业的含义。
- 给出 3-5 个值得继续追问的问题。
```

## Style Rules

- Start with the answer, not background.
- Keep same-level points as MECE as practical.
- Make recommendations concrete, falsifiable, and operational.
- Use numbered headings and bold key conclusions or important numbers.
- If the user asks for a short version, compress to summary, option comparison, risks, and next actions.
- If the user asks for detail, expand assumptions, expert disagreements, and evidence without revealing private chain-of-thought.

## Gotchas

- Do not run the roundtable when either the core question or relevant context is missing. Ask only for the missing field and stop.
- Do not paste eight full monologues into the final answer. The output is a synthesized consulting report, not a transcript.
- Do not let the experts vote mechanically. Surface the decisive tradeoff, fit conditions, and risks.
- Do not turn this into generic brainstorming. Every recommendation must answer the user's stated decision and include an action path.
- Do not promote raw analysis into long-term memory. Use `cognitive-reflection` only for compact, reusable decisions or rules.
