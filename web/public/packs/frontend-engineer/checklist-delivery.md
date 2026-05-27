# W2 交付 Checklist · 3 阶段

> 维护人：the program owner · workshop date 2026-05-28
> 3 阶段：T-3（pre）/ T+0（on-site）/ T+7（post）
> 任一项失败 → 写入 [notes.md](../../doc/00_project/initiative_ai_workshop/notes.md) + 触发回归

## 阶段 1 · Pre-Workshop (T-3 至 T-1)

- [ ] 1.1 baseline-before-after.md 已用 cohort 自报数据校准（基线 26.5h 来源于接口联调代表/技术文档代表/前端开发代表等 6 人自报）
- [ ] 1.2 3 个 scenarios 文件每个 ≥ 5 prompts，每个 prompt 有 Variables + 完整长 prompt + Why this works
- [ ] 1.3 5 个 tool-kit 文件齐全（claude.md / 提示词模板 / SOP / Skill / 文档模板）
- [ ] 1.4 `pe-backend-api` Skill frontmatter 三段齐 + 触发关键词列表 ≥ 10 个
- [ ] 1.5 Mermaid 流程图节点 ≤ 20 + 应急路径已画
- [ ] 1.6 README 中 5 个 tool-kit 链接全部可点击
- [ ] 1.7 scenarios/INDEX.md 中 baseline 映射 10 项任务全部命中至少 1 个 prompt
- [ ] 1.8 .google-sync.md HITL gate 文档存在（3 种执行方法各 1 段）
- [ ] 1.9 全部素材打包发给 cohort（飞书群 / 邮件 / Google Drive 链接）— T-3 周一上午前完成
- [ ] 1.10 与 W1 cohort 同步本期素材库链接（便于交叉借鉴）

## 阶段 2 · On-Site (T+0 · 2026-05-28)

- [ ] 2.1 9:00 开场 — cohort 自报上周实际工作量（与 baseline 对照）
- [ ] 2.2 9:30 Session A · 接口联调族实战（接口联调代表选 1 个真实接口跑 prompt 1-3）
- [ ] 2.3 10:30 茶歇 + cohort 互验：邻座查 prompt 输出质量
- [ ] 2.4 10:45 Session B · 需求转技术文档族实战（技术文档代表选 1 个真实 PRD 跑 prompt 1-3）
- [ ] 2.5 11:45 午休
- [ ] 2.6 13:30 Session C · 前端开发族实战（前端开发代表选 1 个真实 Figma 页面跑 prompt 1-4）
- [ ] 2.7 14:30 装 Skill · cohort 把 `pe-backend-api` Skill 装到自己 Claude / Codex
- [ ] 2.8 15:00 装 CLAUDE.md · cohort 把 tool-kit-01 模板装到自己仓库
- [ ] 2.9 15:30 4 模板实战 · 用 tool-kit-05 写一份接口文档 + 一份技术方案
- [ ] 2.10 16:30 复盘 + 提问 · cohort 每人提 1 个工作场景痛点，AI 专家现场示范
- [ ] 2.11 17:00 收集当天反馈表 — 提交方式 / 截止时间明确
- [ ] 2.12 17:30 结束 · 每人带 1 个"明天回工位立刻能用"的 prompt 走

## 阶段 3 · Post-Workshop (T+1 至 T+14)

- [ ] 3.1 T+1: 收集 cohort 当晚 / 次日"试用反馈"（哪个 prompt 用了 / 哪个没用 / 卡在哪）
- [ ] 3.2 T+3: 与 cohort 1-on-1 抽样 3 人（每族至少 1 人）核对实测耗时
- [ ] 3.3 T+7: 完整一周后收集 10 项 baseline 任务的实测数据（哪项达标 / 哪项偏差 ≥ 30%）
- [ ] 3.4 T+7: 更新 baseline-before-after.md 的"实测值"列（不删原 After 列，加一列实测）
- [ ] 3.5 T+8: 中期回顾会议 — 偏差 ≥ 30% 的行降级标注 / > 3 行降级触发 baseline 重写
- [ ] 3.6 T+10: 把 W2 经验交接给 W3（部署/上线岗）— 跨 wave 衔接观察点交付
- [ ] 3.7 T+14: 归档 W2 素材库到 archive/ + 把"实测后的 baseline"作为后续 wave 引用基准
- [ ] 3.8 T+14: Skill 包 `pe-backend-api` 沉淀到 AI-Fleet skills/shared/（cohort 之外可复用）
- [ ] 3.9 T+14: Wave Digest 更新 W1+W2 已完成段，对 W3 启动给出 3 个观察点
- [ ] 3.10 T+14: 给 cohort 发"sustained usage 调研"问卷 — 2 周后还在用哪个 prompt / 哪个被废弃

## 风险预警

- 若 1.9 延期（cohort T-3 没拿到素材）→ 整个 workshop 学员留存率 ≥ 30% 下降
- 若 2.7-2.8 装 Skill / CLAUDE.md 失败 → 现场 1-on-1 排查；超过 5 人失败 → 暂停后续 session 集中解决
- 若 3.4 偏差 ≥ 30% 行数 > 3 → baseline 推倒重写并通知 W3 调整目标值
- 若 3.10 sustained usage < 30% → 整个素材库失败信号，需复盘"是 prompt 设计问题还是工作流不匹配"

## 信号点

- **leading 信号**（2.x 阶段就能观察）：
  - 现场装 Skill 失败率 ≤ 10%
  - 实战 session 至少 1 个 cohort 成员能跑通端到端
- **lagging 信号**（3.x 阶段才知道）：
  - T+7 实测耗时 ≥ 70% 节省达标
  - T+14 sustained usage ≥ 50%

---

Agent Foundry Team
