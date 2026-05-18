# Skill · design-tokens

> Source: AI-Fleet `html-style-router` token 系统 · prototype-designer pack
> When to use: 需要在原型/网页中应用一致的 design tokens（颜色 / 字号 / 间距 / 圆角 / 阴影）

## Trigger phrases
- "设计令牌" / "design tokens" / "色板" / "type scale"
- "我需要 stripe / linear / claude warm 的 token"
- "改一下品牌色但保持其他不变"

## Inputs
- 品牌名 / 风格名（claude-warm / stripe-minimal / linear-dark / bloomberg-terminal / mckinsey-blue / 自定义）
- 范围：完整 token set OR 单一 token group（仅颜色 / 仅排版 / 仅间距）

## Outputs
- 1 份 CSS `:root` 变量定义（推荐）OR Tailwind `tailwind.config.js` extend 块
- 1 份 token cheatsheet `.md`：每个 token 名 + 值 + 何时使用

## Procedure
1. **路由风格** → `html-style-router` SPEC 找匹配 token 集
2. **导出 CSS variables** → 写入 `:root { --color-primary: ...; }` 命名层次
3. **生成 cheatsheet** → token name / value / usage 三列
4. **示例片段** → 给出 1 段 HTML 示范 token 应用

## Gotchas
- 不要在原型里硬编码颜色（如 `bg-blue-500`），全部走 token（`bg-[var(--color-primary)]` 或 tailwind theme extend）
- 不要混用 2 套 token 系统 → 一个原型一个风格
- token 命名用语义化（`--color-error` not `--color-red`），避免风格变更时全文替换

## Worked example
- Input: "stripe-minimal 完整 token"
- Output:
  - `tokens.css` ~30 行（colors / type-scale / spacing / radius / shadow）
  - `tokens-cheatsheet.md` ~20 行（每个 token 一行说明）

Maurice | maurice_wen@proton.me
