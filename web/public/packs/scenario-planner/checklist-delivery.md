# 交付清单 · 业务分析 / 场景规划岗

> 安装前 + 上手后 + 一周后回顾，三段式 checklist。逐项勾选；未勾的项自动进入下一轮工具包迭代的待办。

## 第一阶段 · 安装与首日上手

### 装上

- [ ] 拉取 AI-Fleet 最新 commit（如已安装）：`cd ~/00-AI-Fleet && git pull`
- [ ] 把本 pack 的 `CLAUDE.md` 复制到你的工作仓库根目录，并按 `[EDIT]` 提示自定义岗位字段
- [ ] 已安装 AI-Fleet 时，运行 `python3 ~/00-AI-Fleet/core/harness/semantic_skill_router.py --enable` — 退出码 0 即正常
- [ ] 已安装时，运行 `python3 ~/00-AI-Fleet/core/harness/semantic_skill_router.py --status` — 确认显示 449+ 个 skill
- [ ] 已安装时，确认 `~/.claude/skills/` 至少 400 个条目：`ls ~/.claude/skills | wc -l`
- [ ] 未安装 AI-Fleet 时，跳过上面 3 项 harness 步骤；其余文件正常工作

### 读

- [ ] 完整读一遍 `baseline-before-after.md`（5 分钟）
- [ ] 浏览本 pack 下 `agents/` 与 `skills/` 目录，对照自己本周真实积压找匹配的族（5 分钟）
- [ ] 至少精读 `prompts.md` 里的 2 条 prompt（10 分钟）
- [ ] 读一遍本 pack 的 `CLAUDE.md`，确认工具白名单与你日常工作流匹配

### 校准

- [ ] 从本周真实工作里挑 1 项与 baseline 10 行之一对应的任务
- [ ] 用**老办法做一次并自己计时**，把原始小时数填到 `data-collection/baseline-actual.csv` 里 `actual_hours_cohort_member_N` 列
- [ ] 30 分钟内挑不出真任务 → 不要硬着头皮跳过，找一个真任务再开始（没有真任务的训练都是空转）

## 第二阶段 · 实操与每日跟踪

### 每日

- [ ] 每天至少把当天的客户事件 / 政策事件 / 商机事件按对应族跑一次 prompt（参考 `tool-kit-03-sop-flowchart.md` 流程图）
- [ ] 每条 prompt 输出有问题就当天记录（具体哪一步崩了）— 用于反馈表 Q4
- [ ] 同一个 prompt 失败 2 次 → 不要再跑第 3 次（已安装 harness 时 `loop_detector.py` 会自动触发）；切换策略：缩小范围 / 换 prompt / 转人工

### 每周（建议周五）

- [ ] 跑 `prompts.md` §1.2 → §1.3 → 手写本周状态 → §1.4 触达盘点
- [ ] 把当周实测工时填进 `data-collection/baseline-actual.csv`（至少 1 行）
- [ ] 在反馈表 T+7 段勾选实际跑了哪几项 baseline 任务

## 第三阶段 · 一周后回顾

### T+7

- [ ] `data-collection/baseline-actual.csv` 至少填了 5 行实测值
- [ ] `data-collection/cohort-feedback-form.md` T+7 段填完
- [ ] 已安装 harness 时，跑一次 `python3 ~/00-AI-Fleet/core/harness/quality_scorer.py --report` 给本周自己的产出打分
- [ ] 算一下节省差异：实测 vs `baseline-before-after.md` 目标 — 差距 > 30% 的行进入下一轮迭代范围

### 自评结果分级

- [ ] 实测节省 ≥ 目标的 60% → 标 GREEN，正常进入下一波
- [ ] 实测节省 30-59% → 标 YELLOW + 自动进入工具包迭代清单
- [ ] 实测节省 < 30% → 标 RED + 与同事或 program owner 做一次 1 小时根因复盘

## T+14 · 持续使用确认

- [ ] 反馈表 T+14 段填完（哪些 prompt / skill 还在用，哪些放弃了）
- [ ] 把放弃的 prompt 标注原因（输入变量不清楚 / 输出格式不符 / AI 没理解我意图 / 没有合适的现成数据 / 其他）
- [ ] 推荐 1 条对你最有用的 prompt 给同岗位同事

## 跨波次审视（一周后做一次）

- [ ] 把本 pack 用了一周的体感写下 1 条最重要的反馈 — 用作下一波次的输入
- [ ] 如果你有 W1 / W2 的同事，对比一下三个波次的体验 — 是否有跨岗位都成立的共性问题

---

AI 训战工作坊 · scenario-planner pack · 业务分析 / 场景规划岗
Maurice | maurice_wen@proton.me
