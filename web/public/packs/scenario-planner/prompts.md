# 业务分析 / 场景规划岗 · Prompt 模板矩阵 · PDCA × 3 族

> 12 条日常使用的 BA prompt，按 PDCA（Plan / Do / Check / Act）× 3 族（F1 客户记录 / F2 商机管理 / F3 政策合规）分类。
> 每条 prompt 都 < 200 词，`<尖括号>` 内是变量，发送前替换。可直接粘贴到 Claude / ChatGPT / Codex。

## 矩阵总览

|  | Plan | Do | Check | Act |
|--|------|-----|-------|-----|
| **F1 客户记录与项目跟踪** | §1.1 联系日志骨架 | §1.2 工时分类 | §1.3 周报缺口扫描 | §1.4 相关方触达盘点 |
| **F2 商机与客户管理** | §2.1 商机录入表 | §2.2 客户风险画像 | §2.3 流失信号复盘 | §2.4 交叉销售短名单 |
| **F3 政策与合规监控** | §3.1 政策摄入草稿 | §3.2 1-pager 生成 | §3.3 适用性判断 | §3.4 每日摘要编排 |

---

## F1 · 客户记录与项目跟踪

### 1.1 P · 联系日志骨架

```
You are a customer-relationship analyst. Source material:
<paste email subject + body, OR meeting transcript snippet, OR WeChat group excerpt>

Produce a CRM-ready log entry with these fields:
- Channel (email / meeting / IM / phone)
- Timestamp (UTC, infer from source)
- Counterparties (name + role + org)
- Summary (1 sentence, conclusion-first)
- Action items (≤ 5, each with owner + deadline)
- Open questions (≤ 3)
- Sentiment signal (positive / neutral / friction; cite the phrase that triggered)

Constraint: no anonymized "they said" — every claim must trace to a quoted phrase from the source.
```

### 1.2 D · 工时分类

```
You are a project accountant. Input:
<paste your raw daily activity log (free text or git/calendar entries)>

Output a timesheet table with columns:
| Date | Hours | Project code | Activity type | Billable (Y/N) | Notes |

Categorize each line into one of these activity types:
[client meeting, internal sync, deliverable creation, research, admin, travel, blocked-waiting]

Constraint: total hours per day must sum to the input range; flag missing time as "[gap]" rows rather than silently absorbing.
```

### 1.3 C · 周报缺口扫描

```
You are a status-report editor. Input:
- Last week's status report: <paste>
- This week's draft: <paste>
- Project plan tasks expected this week: <paste>

Produce a gap analysis:
1. Tasks listed in plan but absent from this-week's draft (carryover risk)
2. Tasks in this-week's draft but not in plan (scope creep candidates)
3. Status changes (green→yellow→red) without explicit cause cited
4. Stakeholder asks from last-week's "Open questions" still open

Constraint: do not rewrite the report. Output the gap list only; PM decides what to merge.
```

### 1.4 A · 相关方触达盘点

```
You are a stakeholder coordinator. Input:
- Stakeholder list with roles: <paste>
- Last 3 weekly status reports: <paste>

For each stakeholder, output:
- Last touched: <date>
- Cadence target: <weekly / biweekly / monthly>
- Cadence actual: <derived from input>
- Drift: <on-track / overdue by N days>
- Recommended next touch: <date + channel + topic in 1 sentence>

Sort by drift descending. Constraint: only recommend reaches that have a concrete reason; "just to check in" is rejected output.
```

---

## F2 · 商机与客户管理

### 2.1 P · 商机录入表

```
You are a sales operations analyst. Raw input:
<paste lead source data — inbound form, referral note, conference scan, etc.>

Produce a qualification packet:
- Lead source classification (inbound / outbound / referral / cold)
- Account: <name + industry + estimated employee count + region>
- Use case (1 sentence in their words, not yours)
- Budget signal (explicit / implicit / unknown — cite source)
- Timeline signal (explicit / implicit / unknown — cite source)
- Decision-maker (named or "TBD — need to ask")
- Next step (1 specific action with owner + due date)

Constraint: do NOT score the lead yet — qualification ≠ scoring. Score happens in §2.4 after we have all 4 BANT fields.
```

### 2.2 D · 客户风险画像

```
You are a customer-risk analyst. Input:
- Account: <name>
- Recent interaction signals: <paste — emails, support tickets, usage data>
- Contract status: <renewal in N days / mid-term / new / overdue>

Produce a risk profile:
1. Headline: <low / medium / high> risk, 1 sentence why
2. Top 3 leading signals (named, with cited evidence)
3. Hypothesis chain (≥ 3 hops): IF <signal> THEN <consequence> THEN <larger consequence>
4. 2 falsifying tests we could run this week to confirm/refute
5. Suggested intervention (named, with effort estimate in hours)

Constraint: a single-letter grade without 3 named signals is rejected. Generic verbs like "engage" are rejected.
```

### 2.3 C · 流失信号复盘

```
You are a retention analyst. Input:
- Account list with last 90 days of usage / support / billing data: <paste or table>

For each account, output a churn-risk row:
| Account | 90d signal trend | Churn probability tier | Earliest leading signal date | Recommended owner |

Risk tiers: SAFE / WATCH / AT-RISK / CRITICAL.
"Earliest leading signal date" must be a date you can defend from input data, not a guess.

Constraint: at most 20% of accounts can land in WATCH or worse — if your output exceeds this ratio, your bar is too low; re-tighten your signal definitions.
```

### 2.4 A · 交叉销售短名单

```
You are an account-growth analyst. Input:
- Account: <name + current product/service consumption>
- Catalog of products/services we sell: <paste>
- Customer journey stage: <onboarding / steady / power user / declining>

Output a ranked cross-sell shortlist (3 items max):
| Rank | Product/service | Why this account, why now (1 sentence) | Effort to pitch (low/med/high) | Expected close window |

Constraint: rank #1 must have an evidence sentence citing a specific account behavior, not "they're a big customer". Do NOT include products customer is already using.
```

---

## F3 · 政策与合规监控

### 3.1 P · 政策摄入草稿

```
You are a tax/policy analyst. Input:
<paste new policy URL OR full circular text>

Produce a 5-line ingest sketch:
1. Issuer (ministry / agency)
2. Effective date + announcement date (YYYY-MM-DD each)
3. Core change (1 sentence — what changes vs the prior rule)
4. Scope (which industries / company sizes / regions)
5. Reading priority for our practice (P0 same-week / P1 within 30 days / P2 background)

Constraint: if any of 1-5 is not knowable from the source, write "[not in source]" — do not infer from training data.
```

### 3.2 D · 1-pager 生成

```
You are a compliance writer. Input:
- Policy ingest sketch from §3.1
- Full policy text: <paste>
- Our client base description: <paste — industries, sizes, regions>

Generate a client-facing 1-pager:
- Title (≤ 12 words, conclusion-first)
- 3-bullet TL;DR (each ≤ 25 words)
- Affected client cohorts (named with rough count)
- Action items by cohort (≤ 3 per cohort, each with owner-side recommendation)
- Open questions to escalate to legal/tax counsel
- Source citation (URL + access date)

Constraint: each TL;DR bullet must cite the specific paragraph or article number from the source. No paraphrase without anchor.
```

### 3.3 C · 适用性判断（按客户）

```
You are a compliance decision support analyst. Input:
- 1-pager from §3.2
- Client profile: <name, industry, employee count, region, current tax positions>

Produce a decision tree:
1. Does the policy apply to this client? <yes/no/maybe — explain in 1 sentence>
2. If yes: required actions, deadline, owner on client side
3. If maybe: which 2-3 client facts would resolve the maybe (questions to ask client)
4. If no: brief reason and a 1-line confidence note

Constraint: "maybe" is the most useful default; do not force a yes/no when source ambiguity exists. Decision-tree branches considered must be ≥ 5 across all clients you process.
```

### 3.4 A · 每日摘要编排

```
You are a daily compliance digest editor. Input:
- 5-15 new policy ingests from §3.1 in the last 24 hours
- Yesterday's digest output (for tone consistency): <paste or "first issue">

Produce today's digest with:
- Header: "<YYYY-MM-DD> · <N> new items, <P0 count> P0"
- P0 items (full 5-line ingest from §3.1, formatted as expandable bullets)
- P1 items (1-line each: issuer + core change + cohort affected)
- P2 items (single line tally: "<N> background items, list at bottom")
- Closing: 1 sentence on the dominant theme of the day (regulatory tightening / loosening / clarification / other)

Constraint: total length ≤ 600 words. If you blow the budget, demote P1 items to P2 — never truncate P0.
```

---

## 这些 prompt 怎么组合

| 工作流 | 顺序 |
|--------|------|
| 每日 inbox 清零（客户日志） | §1.1 → CRM 落档 → 结束 |
| 周度项目状态报告 | §1.2 → §1.3 → 手写 → §1.4 |
| 活动新 lead | §2.1 → §2.2（互动一周后） |
| 季度健康审视 | §2.3 → §2.4（针对 top WATCH 客户） |
| 新政策公告发布 | §3.1 → §3.2 → §3.4（今日摘要） → §3.3（每个受影响客户） |
| 内部审计准备 | §3.3 输出聚合 → 升级到 `ft-internal-audit` skill |

## 不适用场景

- 起草客户法律意见 → 升级到 `ft-tax-advisor` skill + 人类律师
- 完整 M&A 尽调 → 超出 W3 范围；走 `pm-research-swarm` + 专门的 M&A skill
- 非结构化的客户成功对话 → 用 `claude-opus-chatstyle` 调语气，不要套 prompt

---

AI 训战工作坊 · scenario-planner pack · 业务分析 / 场景规划岗
Maurice | maurice_wen@proton.me
