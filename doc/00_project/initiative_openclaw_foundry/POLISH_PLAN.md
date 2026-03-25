# OpenClaw Foundry — 3-Round UI Polish Plan

> PDCA: Plan → Do → Check → Act, 3 rounds per page group

## Sitemap (13 pages, 4 groups)

| Group | Pages | Priority |
|-------|-------|----------|
| **A: Hero Flow** | Landing `/`, Platforms `/explore/platforms`, Deploy `/deploy` | P0 — first impression |
| **B: Marketplace** | Skills `/explore/skills`, Skill Detail `/skill`, MCP `/explore/mcp`, Combos `/combos` | P0 — core product |
| **C: Info** | News `/news`, Pricing `/pricing`, API Docs `/api-docs`, Arena `/arena` | P1 — supporting |
| **D: Catalog** | Catalog `/catalog` | P1 — alternate browse |

## Per-Page Issue Catalog (from screenshots)

### Group A: Hero Flow

#### 1. Landing `/` (sitemap-01)
- [x-R1] Hero 左右布局，mobile 隐藏星座图 — 但 `hidden md:block` 导致 md 以下完全空白右半部，hero 只有文字偏左
- [x-R1] Stats 卡片 `-mt-16` 在小屏上可能和 hero 重叠
- [x-R1] Platform showcase "Tier 1 Full Auto" 标签缺少 platform count 后缀
- [x-R2] "Trending Skills" 标题和 "Browse All Skills →" 在移动端换行后对齐不佳
- [x-R2] Skill cards 缺少 hover 效果提示可点击
- [x-R3] Footer links 没有 hover 状态

#### 2. Platforms `/explore/platforms` (sitemap-02)
- [x-R1] 页面标题 "Platform Overview" 左边没有视觉装饰，和其他页面不一致
- [x-R1] Deploy + GitHub 按钮在部分卡片中按钮宽度不一致（有 GitHub 的双列 vs 只有 Deploy 的单列）
- [x-R2] Tier 分组之间缺少 section divider 或更强视觉分隔
- [x-R2] 卡片描述文字截断不一致，部分 3 行部分 2 行
- [x-R3] Type filter pills 缺少 active 状态的动画过渡

#### 3. Deploy `/deploy` (sitemap-06)
- [x-R1] Stepper 连接线太细（1px dashed），视觉层次不够
- [x-R1] Platform 选择卡片内容太稀疏 — 只有名字 + vendor + 2 badges，大量空白
- [x-R1] "Next Step" 按钮孤零零在右下角，缺少视觉引导
- [x-R2] 选中平台无高亮反馈（没 selected 态）
- [x-R2] Badge 颜色太接近，Desktop/SaaS/Cloud 难以区分
- [x-R3] Stepper completed step 缺少 checkmark icon

### Group B: Marketplace

#### 4. Skills `/explore/skills` (sitemap-03)
- [x-R1] 左侧 categories 列表在窄屏上缩到不可读
- [x-R1] 卡片 "Install" dropdown 和 "Details" button 视觉重量相同，应区分主次
- [x-R2] Rating badge 太小 (S/A/B)，和卡片标题距离太近
- [x-R2] 分页器样式和 MCP 页面不一致
- [x-R3] Search box 缺少 clear button (x)
- [x-R3] Category count badges 颜色平淡

#### 5. Skill Detail `/skill` (refactor-skill-detail-full)
- [x-R1] Sticky footer 遮挡底部内容，需要 bottom padding 补偿（pb-32 可能不够）
- [x-R1] "What it does" 三栏在移动端应竖排
- [x-R2] Permission cards 的 danger/warn/safe 颜色对比可加强
- [x-R2] Activity zone 数字太小，视觉层次弱
- [x-R3] Breadcrumb `>` 符号建议换成 chevron_right icon（已有但间距偏窄）

#### 6. MCP `/explore/mcp` (sitemap-04)
- [x-R1] Featured 3 卡片高度不一致（desc 长度不同）
- [x-R1] "Showing 16 / 128 results" 数据不动态
- [x-R2] 安装命令 mono 区域太拥挤，copy button 和文字贴太近
- [x-R2] Grid 卡片没有 border-top 颜色区分类别
- [x-R3] Pagination 是假的（不响应点击）

#### 7. Combos `/combos` (sitemap-07)
- [x-R1] Featured card 和普通 card 视觉差异不够强
- [x-R1] "Install" 按钮占了半行但 "Details" 是灰色文字，主次清晰但可更醒目
- [x-R2] Skill pill tags 太多时没有 expand/collapse
- [x-R2] 卡片 top border 颜色全部相同(蓝色)，缺少类别区分
- [x-R3] 0 installs 的空状态可以不显示下载图标

### Group C: Info

#### 8. News `/news` (sitemap-09)
- [x-R1] Featured article 左侧 border 4px 在移动端不够醒目
- [x-R1] 右侧 sidebar 在 lg 以下堆叠到底部，应该在 featured 下面
- [x-R2] 文章列表 hover 效果用 JS inline style，应改为 CSS
- [x-R2] Subscribe 区域文字颜色 `var(--on-primary)` 在深蓝色背景上对比度不足
- [x-R3] Tab filter 没有动画过渡

#### 9. Pricing `/pricing` (sitemap-11)
- [x-R1] 对比表格在移动端滑动时左列 sticky 生效但颜色不够深，和数据列混淆
- [x-R1] 表格行太密，缺少 zebra striping 或更明确的行分隔
- [x-R2] "Recommended" 3 列高亮背景 `rgba(0,62,168,0.05)` 太浅几乎不可见
- [x-R2] 推荐卡片区 "Popular" badge 位置在窄屏被截断
- [x-R3] Enterprise CTA gradient 和 hero gradient 重复，缺少差异化

#### 10. API Docs `/api-docs` (sitemap-08)
- [x-R1] 顶部 hero 区域 dark background 和 nav 白底的过渡太生硬
- [x-R1] Pricing tier cards (Free/$19/$49) 和 pricing 页面风格不一致
- [x-R2] curl 代码块背景色太深 (#1a1c2e)，和浅色主题不协调
- [x-R2] Accordion section headers 缺少 expand/collapse icon
- [x-R3] Rate limits 表格底部没有 border-bottom

#### 11. Arena `/arena` (sitemap-10)
- [x-R1] 巨大的空白区域 — content 只占 viewport 的 30%
- [x-R1] Platform pills 没有分组(全平铺)，12 个 pill 一行太长
- [x-R2] "Start Battle" 按钮 disabled 但没有 tooltip 说明为什么
- [x-R2] Test Task textarea 太矮 (3 rows)，描述 Agent 任务需要更大空间
- [x-R3] 缺少 arena 的使用说明或示例任务

### Group D: Catalog

#### 12. Catalog `/catalog` (sitemap-05)
- [x-R1] 和 platforms 页面高度重叠，差异不明显
- [x-R2] 卡片内 platform/IM tags 太小不可读
- [x-R2] filter bar + search 在移动端布局会挤压
- [x-R3] Empty filter state 已有 ErrorState 但缺少具体筛选条件回显

---

## 3-Round Strategy

### Round 1: Layout & Structure (结构)
**Focus**: 间距、对齐、视觉层次、空白优化、移动端适配
**Gate**: 每个页面在 375px / 768px / 1440px 三个断点下布局合理

### Round 2: Visual Polish (视觉)
**Focus**: 颜色对比度、hover/focus/active 状态、卡片边框、字体权重、图标一致性
**Gate**: 无色盲可访问性问题 (contrast ratio > 4.5:1)

### Round 3: Micro-interactions & Edge Cases (细节)
**Focus**: 动画过渡、空状态、tooltip、loading skeleton、keyboard nav
**Gate**: 每个交互元素都有反馈态

---

## Execution Plan

| Round | Group A (3 pages) | Group B (4 pages) | Group C (4 pages) | Group D (1 page) |
|-------|-------------------|--------------------|--------------------|-------------------|
| R1 | Landing + Platforms + Deploy | Skills + Skill + MCP + Combos | News + Pricing + API + Arena | Catalog |
| R2 | Same | Same | Same | Same |
| R3 | Same | Same | Same | Same |

Execution order: A → B → C → D (per round, all 3 rounds complete before moving to next group)

## Acceptance Criteria
- Build: 15/15 PASS
- No visual regression on existing working pages
- i18n: EN/ZH both render correctly
- Mobile (375px): no horizontal overflow, no truncated buttons
- All interactive elements have visible hover/focus state
