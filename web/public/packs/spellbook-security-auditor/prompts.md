# 安全审计师 · 斜杠命令

## 命名空间

所有 spellbook 命令通过 `/spellbook:<id>` 调用，与 AI-Fleet 现有 14 个命令
（/commit /pr /optimize 等）零冲突。

## 本包提供的命令 (2)

- `/spellbook:security-scan` — 详见 `.claude/commands/spellbook/security-scan.md`
- `/spellbook:deploy-check` — 详见 `.claude/commands/spellbook/deploy-check.md`

## 通用约定

- 命令的实际实现在 `.claude/commands/spellbook/<id>.md`
- 修改命令行为：直接编辑对应 .md 文件
- 卸载命令：`bash scripts/spellbook-install.sh --uninstall --pack security-auditor`

---

Maurice | maurice_wen@proton.me
