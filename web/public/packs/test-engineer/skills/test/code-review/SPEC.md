---
name: code-reviewing
description: "Use when asked to review a PR, diff, or file for bugs, security issues, or code quality. Analyzes git diffs and flags anti-patterns. NOT for writing new code or explaining code without evaluating it. Trigger: review, PR, diff, audit."
allowed-tools: Read, Grep, Glob, Bash
---

## 是什么

这是一个针对 PR（Pull Request，合并请求）和 diff（差异变更）的代码评审能力，用来在合并入库前把可能引发线上故障或安全漏洞的变更拦在评审环节，提高发布稳定性与质量门槛。

## 怎么用

1. 评审范围聚焦在本次 diff 内的新增与修改行，避免对未变更代码提出意见，减少作者的返工与情绪成本。
2. 按 CRITICAL（阻断合并）、MAJOR（强烈建议修复）、MINOR（优化建议）、NITPICK（风格偏好）四档标注，让作者清楚知道哪些必须改、哪些可以下次处理。
3. 对任何涉及用户输入、凭据、权限、加密的变更逐行核对 OWASP（开放式 Web 应用安全项目）十大风险，发现一处记一处，绝不放过安全类问题。
4. 对每条 CRITICAL 与 MAJOR 给出复现路径或风险场景，让作者能在本地验证，避免“凭感觉改”导致的二次返工。
5. 评审结论按"必修 / 建议 / 可选"分组输出，作者依照优先级分批提交，缩短合并周期，提升团队节奏。

## 架构图

```mermaid
flowchart LR
    A[拉取 diff] --> B[按文件分块]
    B --> C[安全/逻辑/风格三类检查]
    C --> D[四级严重度标注]
    D --> E[评审结论分组输出]
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
