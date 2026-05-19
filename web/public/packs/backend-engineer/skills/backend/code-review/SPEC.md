---
name: code-reviewing
description: "Use when asked to review a PR, diff, or file for bugs, security issues, or code quality. Analyzes git diffs and flags anti-patterns. NOT for writing new code or explaining code without evaluating it. Trigger: review, PR, diff, audit."
allowed-tools: Read, Grep, Glob, Bash
---

## 是什么

帮你把"代码评审"这件事从感性挑刺变成一份结构化清单，让每一次合并请求都按统一标准过一遍安全、质量、性能与测试覆盖，减少漏网的回归与隐患流入主分支。

## 怎么用

1. 把待评审的差异（`git diff` 或 PR（Pull Request，合并请求）范围）交给本技能，先让它聚焦在改动行而不是整文件。
2. 让本技能按 OWASP（开放式 Web 应用程序安全项目）Top 10 维度扫一遍改动是否引入注入、鉴权绕过、敏感数据外泄等风险。
3. 让本技能为每条问题打上严重度（CRITICAL/MAJOR/MINOR/NITPICK），并把同类问题一起列出，避免作者只补一行就当修完。
4. 把评审结论按统一 JSON 结构反馈到合并请求，提交 approve / request_changes / comment 之一作为闸门结论。
5. 合并前确认作者已按 CRITICAL 与 MAJOR 项整改，并补齐对应回归测试。

## 架构图

```mermaid
flowchart LR
  A[PR 差异] --> B[扫描安全风险]
  B --> C[评估质量与性能]
  C --> D[严重度分级]
  D --> E[评审结论 JSON]
  E --> F[合并闸门]
```

# Code Reviewing

## Quick Start

Analyze staged changes:
```bash
git diff --staged
```

Review specific file:
```bash
git diff HEAD -- path/to/file.py
```

## Gotchas

1. **Review the diff, not the whole file.** Reading unchanged code wastes context and leads to irrelevant suggestions. Focus on `git diff` output — what was added, modified, or deleted. Only read surrounding code when needed to understand impact.

2. **Don't suggest "improvements" outside the diff scope.** If the user changed one function, don't suggest renaming variables in adjacent functions. Scope creep in reviews wastes time and annoys authors. Flag only issues in changed code.

3. **Security issues in changed code are always worth flagging.** Even if the user "just added a log statement," if that log statement includes user input or credentials, it's a security finding. OWASP Top 10 checks apply to every changed line.

4. **Distinguish severity: CRITICAL vs SUGGESTION.** Not everything is equally important. Use: CRITICAL (will break/security risk), MAJOR (likely bug), MINOR (improvement), NITPICK (style preference). This helps the author prioritize.

5. **Same-type bug scan: if you find one instance, grep for siblings.** One missing null check often means there are 3 more. Use Grep to find similar patterns across the codebase — this is where reviews add the most value.

## Review Checklist

Copy and track progress:

```
Review Progress:
- [ ] Code organization and structure
- [ ] Error handling patterns
- [ ] Security concerns (OWASP Top 10)
- [ ] Performance considerations
- [ ] Test coverage
- [ ] Documentation completeness
```

## Review Process

**Step 1: Understand Context**
- Read the changed files
- Identify the purpose of changes
- Check related tests

**Step 2: Security Analysis**
- Input validation
- SQL injection risks
- XSS vulnerabilities
- Authentication/Authorization
- Sensitive data exposure

**Step 3: Code Quality**
- DRY principle violations
- Complex functions (>20 lines)
- Magic numbers/strings
- Proper naming conventions
- Type safety

**Step 4: Performance**
- N+1 queries
- Unnecessary loops
- Memory leaks
- Caching opportunities

## Output Format

```json
{
  "summary": "Brief summary of changes",
  "issues": [
    {
      "severity": "high|medium|low",
      "file": "path/to/file",
      "line": 42,
      "issue": "Description",
      "suggestion": "How to fix"
    }
  ],
  "verdict": "approve|request_changes|comment"
}
```

## Language-Specific Checks

**Python**: Type hints, docstrings, PEP8
**TypeScript**: Strict mode, proper types, no `any`
**JavaScript**: ESLint rules, null checks
**Go**: Error handling, defer usage

## Version History
- v1.0.0 (2025-01): Initial release
