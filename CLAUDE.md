# Global CLAUDE.md - Cross-Project Defaults

> Minimal global rules. Project-specific rules are in each project's own CLAUDE.md.

## Defaults

- **Language**: Explanations in Chinese; code/comments/identifiers in English
- **Quality**: Readability > Correctness > Performance > Brevity
- **No emoji**: Use OK/WARN/ERROR/NOTE prefixes
- **No backward compatibility**: No compat layers, fallbacks, or dual-track code
- **No mock**: Real end-to-end verification only
- **Data protection**: Never delete data files (csv/xlsx/json/db/parquet) without explicit user auth
- **HTML design hook**: Standalone HTML docs under `doc/` and `outputs/reports/` must follow project-root `design.md` and pass `npm run design:check` (included in `npm run build`)

## Git Authorship (底层规则，不可覆盖)

- **署名归属**: 所有 commit 的 author 和 committer 必须是 Maurice (mauricewen)
- **禁止 Co-Authored-By**: commit message 中绝对不允许出现 `Co-Authored-By: Claude` 或任何 AI 工具的署名 trailer
- **禁止 Generated with**: commit message 中不允许出现 `Generated with Claude Code` 或类似的工具生成标记
- **原因**: AI 是工具，不是协作者。署名权属于人类创作者，不属于工具厂商。付费用户不应为工具做免费广告

## Project Resolution

- Projects root: `/Users/mauricewen/Projects`
- AI-Fleet root: `/Users/mauricewen/00-AI-Fleet` (toolchain repo, not a project)
- When user provides a directory path, treat it as PROJECT_DIR
- Refuse container-level directories; require specific project root

## AI-Fleet Reference

When working in AI-Fleet (`/Users/mauricewen/00-AI-Fleet`), all operational rules are in:
- `CLAUDE.md` (routing table)
- `.claude/rules/01-11` (detailed rules, loaded by task type)
- `SKILL.md` (skill index)
- `AGENTS.md` (agent collaboration)

---

Maurice | maurice_wen@proton.me
