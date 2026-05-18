# Baseline · Before vs After · Prototype Designer

## 质量信号优先

| 领域 | 信号 | 下限 |
|------|------|------|
| Mock data | 真实感（姓名/金额/日期） | 100% 非占位 |
| Token | 硬编码颜色占比 | ≤20% |
| Hierarchy | aesthetic 评分 | ≥4/5 |
| Mobile | 320-1920 都可用 | 必须 |
| Handoff | 4 列表完整率 | 100% |

## 10 项 baseline 任务

| # | 任务 | 族 | Baseline (h) | 目标 (h) | 节省 % | 质量信号 |
|---|------|-----|-------------:|---------:|-------:|---------|
| 1 | PRD → 3 屏 clickable HTML | S1 | 4.0 | 0.5 | 88 | 真实 mock data 100% |
| 2 | PRD → 5 屏 clickable HTML | S1 | 8.0 | 1.0 | 88 | token 硬编码 ≤20% |
| 3 | 设计 → handoff spec | S1 | 2.0 | 0.5 | 75 | 4 列表 100% |
| 4 | 单页 token set CSS 生成 | S2 | 1.5 | 0.2 | 87 | ≤3 字号 ≤2 字重 |
| 5 | 现有原型 token 重构 | S2 | 4.0 | 1.0 | 75 | aesthetic +0.5 分 |
| 6 | Brand swap（保结构换风格） | S2 | 6.0 | 1.5 | 75 | 替换覆盖率 100% |
| 7 | Aesthetic probe 自审 | S3 | 1.0 | 0.2 | 80 | 7 维全打分 |
| 8 | Top 3 改进落地 | S3 | 3.0 | 0.8 | 73 | 评分平均 +0.4 |
| 9 | Mobile responsive 改造 | S3 | 4.0 | 1.0 | 75 | 320-1920 都过 |
| 10 | 季度 SOTA refresh | S3 | 12.0 | 4.0 | 67 | Hara+Jobs 双审过关 |

**Baseline 合计**：45.5 h / 月  ·  **目标**：10.7 h / 月  ·  **整体节省**：76.5%

## 失效信号

1. Mock data 是占位（"User" "Test Inc"） → cohort 不信
2. Token 硬编码 >20% → 后续改主题工作量大
3. aesthetic <4 分但交付 → 视觉债务
4. Handoff 缺 data shape → eng 用假数据上线
5. Mobile 不过 → 一半用户没体验

---

Maurice | maurice_wen@proton.me
