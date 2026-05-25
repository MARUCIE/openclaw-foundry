# W4 · 交付 Checklist · T-3 / T+0 / T+7 三时点共 30 项

> Pre-flight + 当天 + 复盘 checklist。cohort + 引导员 + the program owner（程序负责人）分工。完成的打勾；未勾的滚动到 Buffer 1（日历 W5）工具包迭代。

## T-3 · 2026-06-08 周一 · cohort 收到工具包

负责人：cohort 成员（每人勾自己那份）

### 安装
- [ ] Clone 或 pull AI-Fleet 到最新 commit（`cd ~/00-AI-Fleet && git pull`）
- [ ] 把 `tool-kit-01-claude-md.md` 的内容复制到你测试仓库的 `CLAUDE.md`（重命名 + 定制岗位块）
- [ ] 跑 `python3 ~/00-AI-Fleet/core/harness/semantic_skill_router.py --enable` — 确认退出码 0
- [ ] 跑 `python3 ~/00-AI-Fleet/core/harness/semantic_skill_router.py --status` — 确认索引到 449+ skill
- [ ] 确认 `~/.claude/skills/` 有 ≥ 400 个条目（`ls ~/.claude/skills | wc -l`）
- [ ] 在你测试仓库里跑 `verification_gate.py`（`python3 ~/00-AI-Fleet/core/harness/verification_gate.py --dry-run`）通

### 阅读
- [ ] 通读 `baseline-before-after.md`（5 分钟）
- [ ] 浏览 `scenarios/INDEX.md`，找到当前 sprint backlog 对应的族（5 分钟）
- [ ] 仔细读 `scenarios/0{1,2,3}.md` 里至少 2 个深度 prompt（10 分钟）
- [ ] 读 `tool-kit-01-claude-md.md` 里你部门那段，确认工具白名单与日常工作流匹配

### 校准
- [ ] 从当前 sprint 里挑 1 个真实任务，对应 10 行基线中的一行
- [ ] **workshop 前用老方式跑一次**计时 — 把原始小时数写到 `data-collection/baseline-actual.csv` 的 `actual_hours_cohort_member_N` 列
- [ ] 30 分钟内挑不出来就告诉联络人（不要跳过 — 没有真任务，workshop 就是空想）
- [ ] 确认你有可用的合成测试数据 — 如果仓库用生产 fixture，告诉引导员（隐私底线）

## T+0 · 2026-06-11 周四 · 线下场

负责人：引导员 + 副引导员

### 场地与器材
- [ ] 会议室已订，IM（企业微信）频道已置顶
- [ ] `tool-kit-03-sop-flowchart.md` 打印好（每组一份）
- [ ] cohort 笔记本已验证：每台都能跑 `python3 ~/00-AI-Fleet/core/harness/verification_gate.py --dry-run` 无报错
- [ ] 副引导员就位（记每组的未解问题数；≥ 3 个未解 = 真实理解 gap，升级到 Buffer 1）
- [ ] 现场练习用的合成 fixture 已备好（无 PII；税规用例预先脱敏）

### 流程
- [ ] 5 分钟开场，屏幕共享挂墙上的 SOP 流程图
- [ ] 3 个组 × 25 分钟分别在指定族（F1 / F2 / F3）上用 `scenarios/0{1,2,3}.md` 的 prompt
- [ ] 中场互换：每组组长把最严重的卡点讲给全场（不讲最好的成果 — 失败比成功传递更好）
- [ ] 收尾 10 分钟：每位 cohort 成员写下下周一回工位要试的一个 prompt（这个承诺比 demo 输出更重要）

### 现场捕获
- [ ] 副引导员记每个失败的 prompt 与对应补丁 — 输入到 `tool-kit-02` v1.1，在两期 workshop 之间出
- [ ] 拍墙上流程图照片，包括各组涂改 — 归档到 `outputs/session-photos/W4-2026-06-11/`

## T+1 至 T+7 · 日 / 周复盘

负责人：cohort + 程序负责人

### 次日（T+1，2026-06-12 周五）
- [ ] 30 分钟 cohort 复盘，Zoom / 企业微信
- [ ] 每人写一行 Worked / Broke-and-patched 到 `../../doc/wave-digest.md` 的 W4 块
- [ ] 引导员在 W4 块底部草拟一句 One-advice-for-W5

### 完课一周（T+7，2026-06-18 周四）
- [ ] cohort 把实测时长填到 `data-collection/baseline-actual.csv`（10 行至少填 5 行）
- [ ] cohort 填 `data-collection/cohort-feedback-form.md` 的 T+7 段
- [ ] the program owner 跑 `python3 ~/00-AI-Fleet/core/harness/quality_scorer.py --wave W4` 对 cohort 产出（能自动评的测试代码 / 套件）做 lint/tests/docs/hygiene/structural 评级
- [ ] the program owner 算节省 delta：实测 vs `baseline-before-after.md` 目标 — gap > 30% 的列入下个 cycle

### 签发触发条件
- [ ] 实测节省 ≥ 目标 60% → `wave-digest.md` 里 W4 标 GREEN
- [ ] 实测节省 30-59% → 标 YELLOW + 自动入 Buffer 1 工具包迭代队列
- [ ] 实测节省 < 30% → 标 RED + the program owner + 引导员在 W5 启动前做 1 小时根因 review

## 跨 wave 审计（T+7 后做一次）

- [ ] 把 `wave-digest.md` 的 W4 块和 W1 + W2 + W3 块比对 — 有没有 the program owner 该提升到全局 CANONICAL.md 的跨 wave 模式
- [ ] 若 W4 cohort 反馈 "Mermaid SOP 太密"，在 W5 生成前把 `_template/CANONICAL.md` axis 3 改成 ≤ 20 节点（不是 ≤ 30）
- [ ] 校验 cohort 产出中零 PII / 生产数据泄露（隐私底线 — 不容妥协）

---

Agent Foundry Team
