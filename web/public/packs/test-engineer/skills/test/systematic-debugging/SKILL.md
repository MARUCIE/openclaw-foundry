---
description: 'Use when encountering a bug, test failure, crash, or unexpected behavior.
  Enforces root-cause investigation before any fix attempt. NOT for writing new features.
  Trigger: bug, error, failing test, broken, unexpected, crash, regression.'
name: systematic-debugging
---

## 是什么

这是一个面向 bug、测试失败、崩溃、回归的系统化排查能力，先定位根因再动手修复，避免"症状级补丁"留下二次故障与隐性回归。

## 怎么用

1. 先复述缺陷现象、复现路径、影响范围，把"我看到什么"和"我猜原因"严格区分，避免被先入为主带偏。
2. 按系统的每一层边界（输入 / 中间态 / 输出）注入诊断信号，让证据指向某一层，而不是凭经验猜测某个组件。
3. 列出至少两个候选根因假设，分别给出"如果是这个原因，会观察到什么现象"，再用日志或断点逐一证伪。
4. 找到根因后再写修复方案，把"修复了什么、为什么这样修、回归测试覆盖什么场景"三件事一起写进 PR（Pull Request，合并请求）。
5. 修复合并后补一条回归测试用例进 CI（持续集成）流水线，防止同一缺陷因后续重构再次复发。

## 架构图

```mermaid
flowchart LR
    A[现象描述] --> B[分层注入诊断]
    B --> C[候选根因假设]
    C --> D[证据逐一证伪]
    D --> E[根因定位+修复方案]
    E --> F[回归测试入库]
```

# Systematic Debugging

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

## Gotchas

1. **Don't propose fixes before Phase 1.** The #1 failure mode is jumping to "quick fix" without understanding WHY. Symptom fixes mask root causes and create new bugs.

2. **Multi-component systems need layer-by-layer evidence.** Before guessing which component failed, inject diagnostics at EACH boundary:
   ```bash
   # Layer 1: Entry point
   echo "=== Input data: ==="
   echo "VAR: ${VAR:+SET}${VAR:-UNSET}"
   # Layer 2: Processing
   echo "=== After transform: ==="
   # Layer 3: Output
   echo "=== Final state: ==="
   ```
   Run ONCE to see WHERE it breaks. Then investigate THAT layer only.

3. **3-Strike Rule.** Fix 1: diagnose & targeted fix. Fix 2: different approach. Fix 3: rethink assumptions. **After 3 failed fixes: STOP — this is an architectural problem, not a bug.** Discuss with user before attempting more.

## 4 Phases (Sequential, No Skipping)

```
Phase 1: Root Cause    → Read errors fully, reproduce, check recent changes, trace data flow
Phase 2: Pattern       → Find working examples, compare differences, understand dependencies
Phase 3: Hypothesis    → Single hypothesis, smallest possible test, one variable at a time
Phase 4: Fix           → Create failing test FIRST, implement single fix, verify, check for regressions
```

## Red Flags — STOP and Return to Phase 1

- "Quick fix for now, investigate later"
- "Just try changing X and see"
- Proposing solutions before tracing data flow
- "One more fix attempt" after 2+ failures
- Each fix reveals a new problem in a different place (= architectural issue)

## Supporting References

- `root-cause-tracing.md` — Backward tracing through call stack
- `defense-in-depth.md` — Multi-layer validation after fix
- `condition-based-waiting.md` — Replace timeouts with condition polling
- Related: `verification-before-completion` (verify fix before claiming success)
