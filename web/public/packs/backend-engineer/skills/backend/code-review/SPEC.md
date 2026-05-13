---
name: code-reviewing
description: "Use when asked to review a PR, diff, or file for bugs, security issues, or code quality. Analyzes git diffs and flags anti-patterns. NOT for writing new code or explaining code without evaluating it. Trigger: review, PR, diff, audit."
allowed-tools: Read, Grep, Glob, Bash
---

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
