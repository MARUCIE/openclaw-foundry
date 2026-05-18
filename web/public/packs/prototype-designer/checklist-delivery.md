# Checklist · Prototype Designer · 日 / 周 / 季度交付

## 阶段 1 · 输入

- [ ] **PRD 收敛**：PM 给的 PRD ≤2 页，scope 清晰（证据：PRD 文件 + 字数）
- [ ] **Brand vibe 对齐**：跟 PM 确认风格参考（claude-warm / stripe / linear / custom）（证据：聊天记录截图）
- [ ] **Screen count 协议**：≤5 屏；如 >5 屏先回去聊（证据：scope 表）

## 阶段 2 · 加工

- [ ] **Token-driven 不硬编码**：所有颜色/字号/间距走 CSS 变量（证据：grep 硬编码占比 ≤20%）
- [ ] **Mock data 真实感**：用真实姓名/金额/日期，禁止 "User" "Test"（证据：mock data 检查）
- [ ] **每屏 ≤3 个核心交互**：超过 3 个说明这屏 scope 错了（证据：screen 描述）

## 阶段 3 · 输出

- [ ] **Aesthetic probe self-review**：7 维评分平均 ≥4（证据：probe 报告）
- [ ] **Top 3 fix 全部解决**：probe 出的 Top 3 都已解决或显式 defer（证据：fix log）
- [ ] **Mobile responsive**：320px / 768px / 1440px 都过（证据：screenshot 3 张）

## 阶段 4 · 闭环

- [ ] **Handoff spec 4 列齐**：screen × component × state × data shape（证据：spec 表）
- [ ] **PM acceptance** 已签字（证据：邮件 OR 会议纪要）
- [ ] **Decision log 更新**：本次设计决策已记录（证据：decision log）

## 周度

- [ ] 本周交付原型数 / 计划数
- [ ] 本周 PM 接受率
- [ ] 本周 aesthetic 平均分 vs 上周

## 季度

- [ ] **季度 refresh 队列**：列出 aesthetic <4 分的 live 原型
- [ ] **Brand consistency audit**：所有 live 原型走的 token 集是否一致
- [ ] **Mobile coverage 月报**：本季度新交付里 mobile responsive 比例
- [ ] **SOTA scan**：参考 Mobbin / Linear / Stripe 的新设计趋势 ≥3 个，提炼应用到我们的 token 集

## 反模式自检（每日 18:00）

- 我有没有用占位 mock data 偷懒？
- 我有没有硬编码颜色省事？
- 我有没有"看着差不多就交付"跳过 aesthetic probe？
- 我有没有 handoff 给 eng 时漏了 data shape？

任一回答"是"，明日开工第一件事就是回补。

---

Maurice | maurice_wen@proton.me
