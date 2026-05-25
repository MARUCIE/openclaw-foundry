# 文档模板 · 业务分析 / 场景规划岗 · 4 份日常产出模板

> 4 份开箱即用的 BA 文档模板，覆盖最常见的产出。复制对应小节，把 `<尖括号占位符>` 替换为实际内容，发送。
> 每份模板都对应 `prompts.md` 里的一条 prompt — 模板定义形状，prompt 产出内容。

---

## 模板 1 · 客户联系日志

> 配套 prompt：`prompts.md` §1.1 · 归档位置：CRM 记录 → 客户文件夹

```markdown
# Contact Log · <Account name> · <YYYY-MM-DD>

| Field | Value |
|-------|-------|
| Channel | <email / meeting / IM / phone> |
| Time (UTC) | <YYYY-MM-DD HH:MM> |
| Duration | <N min, or "N/A async"> |
| Counterparties (us) | <name (role), name (role)> |
| Counterparties (them) | <name (role, org)> |

## Summary

<1 sentence, conclusion-first — what was the meeting about and what changed?>

## Action items

| # | Action | Owner | Due | Status |
|---|--------|-------|-----|--------|
| 1 | <action verb + object> | <name> | <YYYY-MM-DD> | open |
| 2 | <action> | <name> | <YYYY-MM-DD> | open |

## Open questions (to ask back)

1. <question>
2. <question>

## Sentiment signal

<positive / neutral / friction>; trigger phrase: "<exact quote from source>"

## Source

<link to email thread / meeting recording / IM message permalink>
```

---

## 模板 2 · 商机资质化报告

> 配套 prompt：`prompts.md` §2.1 + §2.2 · 归档位置：销售流水线 → 资质化前

```markdown
# Opportunity · <Account name> · <YYYY-MM-DD>

## Lead snapshot

| Field | Value |
|-------|-------|
| Lead source | <inbound / outbound / referral / cold> |
| Account | <name> |
| Industry | <industry, NAICS code if known> |
| Employee count (est.) | <range> |
| Region | <city / country> |
| Use case (their words) | "<quote>" |

## BANT qualification

| | Status | Evidence | Confidence |
|--|--------|----------|------------|
| Budget | <known / signal-only / unknown> | <quote or note> | <H/M/L> |
| Authority | <named / role known / TBD> | <quote or note> | <H/M/L> |
| Need | <strong / moderate / nice-to-have> | <quote or note> | <H/M/L> |
| Timing | <urgent / Q-bound / undefined> | <quote or note> | <H/M/L> |

## Risk profile (after first interaction)

- Headline: <low / medium / high> risk · <1 sentence why>
- Top 3 leading signals:
  1. <signal>
  2. <signal>
  3. <signal>
- Hypothesis chain: IF <signal> THEN <consequence> THEN <larger consequence>
- Falsifying tests this week:
  - <test 1>
  - <test 2>

## Recommended next step

<1 specific action> · Owner: <name> · Due: <YYYY-MM-DD>

## Open questions to client

1. <question>
2. <question>

---
Logged by: <your name> · Reviewed by: <reviewer name or "self">
```

---

## 模板 3 · 政策 1-pager（客户可见）

> 配套 prompt：`prompts.md` §3.2 · 归档位置：合规库 → 客户公告文件夹

```markdown
# <Title — conclusion-first, ≤ 12 words>

**Issuer**: <ministry / agency> · **Effective**: <YYYY-MM-DD> · **Source**: [<gazette name>](<URL>) (accessed <YYYY-MM-DD>)

## TL;DR

- <bullet ≤ 25 words, with anchor to source paragraph or article number>
- <bullet ≤ 25 words, with anchor>
- <bullet ≤ 25 words, with anchor>

## Who is affected

| Cohort | Approx. count in our book | Action priority |
|--------|---------------------------|----------------|
| <cohort 1 description> | <N clients> | <P0 / P1 / P2> |
| <cohort 2 description> | <N clients> | <P0 / P1 / P2> |

## Action items by cohort

### Cohort 1: <name>
1. <action with deadline>
2. <action>
3. <action>

### Cohort 2: <name>
1. <action>

## Open questions (escalate to legal/tax counsel)

- <question>
- <question>

## Effective date timeline

| Date | Event |
|------|-------|
| <YYYY-MM-DD> | Announcement |
| <YYYY-MM-DD> | Effective date |
| <YYYY-MM-DD> | First filing / reporting deadline |

---
Prepared by: <your name> · Reviewed by: <reviewer> · Distribute to: <client list link>
```

---

## 模板 4 · 周度 BA 摘要

> 配套 prompt：`prompts.md` §1.3 + §1.4 · 归档位置：团队 IM channel + 项目页面

```markdown
# Weekly BA Digest · <YYYY-MM-DD> · <Your name>

## Headline

<1 sentence — what's the most important thing the team should know this week?>

## Project status

| Project | Status | Δ vs last week | Top risk this week |
|---------|--------|----------------|--------------------|
| <project A> | 🟢 / 🟡 / 🔴 | <↑ / → / ↓> | <1 sentence> |
| <project B> | 🟢 / 🟡 / 🔴 | <↑ / → / ↓> | <1 sentence> |

## Customer interactions this week

| Account | Touch type | Outcome | Next step |
|---------|-----------|---------|-----------|
| <account> | <meeting / email / call> | <1 sentence> | <action + date> |

## New opportunities

| Account | Source | Stage | Owner |
|---------|--------|-------|-------|
| <account> | <inbound / outbound / referral> | <intake / qualified / proposal> | <name> |

## Compliance / policy alerts this week

- <P0 circular> · affecting <N clients> · action owner <name>
- <P1 circular> · affecting <N clients>

## Stakeholder cadence drift

| Stakeholder | Last touched | Days overdue | Recommended action |
|-------------|-------------|--------------|---------------------|
| <name (role)> | <YYYY-MM-DD> | <N> | <reach by <date>, topic: <topic>> |

## Open asks for the team

1. <ask, with owner and date>
2. <ask>

## Time tracking summary

| Project | Hours this week | Vs target |
|---------|-----------------|-----------|
| <project> | <N> | <±%> |

---
Sent: <YYYY-MM-DD HH:MM> · Next digest: <YYYY-MM-DD>
```

---

## 怎么用（DO 与 DO NOT）

DO：

- 整段复制 markdown，把占位符替换掉，30 分钟内发出去
- 每份模板和它对应的 `prompts.md` prompt 配对使用 — 模板定结构，prompt 产内容
- 团队内部保持 section header 一致 — 客户经理扫读会快很多

DO NOT：

- 没和团队对齐就加新 section（一致性 > 个人定制）
- 把政策 1-pager 里的 `Source` 引用删掉 — 合规可追溯性不可妥协
- 用这套模板写客户法律意见 — 升级到 `ft-tax-advisor` + 人类律师

---

AI 训战工作坊 · scenario-planner pack · 业务分析 / 场景规划岗
Agent Foundry Team
