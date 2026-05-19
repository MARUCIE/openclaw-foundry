---
description: 'Use when encountering a bug, test failure, crash, or unexpected behavior.
  Enforces root-cause investigation before any fix attempt. NOT for writing new features.
  Trigger: bug, error, failing test, broken, unexpected, crash, regression.'
name: systematic-debugging
---

## 是什么

帮你把"出 bug 了赶紧打补丁"的本能反应换成一条"先定根因再动手"的纪律线，让一次修复真正消除问题、且不会在下一处冒出来，避免补丁堆补丁的恶性循环。

## 怎么用

1. 出现报错、测试失败、崩溃或异常行为时，先用本技能记录完整证据：报错文本、最近改动、复现步骤、相关日志。
2. 让本技能强制执行四个阶段顺序：先做根因排查，再找类似可工作的样例对比，再立单一假设做最小验证，最后才动手改代码。
3. 多组件系统按层注入诊断，让本技能定位"在哪一层断的"，再聚焦那一层，而不是同时改多处。
4. 守住"3 次失败规则"：同一个 bug 连续修 3 次仍未解决，立刻停手——这是架构问题不是局部 bug，先把假设拿出来与团队对齐。
5. 修复完成后，让本技能要求先写一条会失败的回归测试，再让测试通过，避免同类问题悄悄回潮。

## 架构图

```mermaid
flowchart LR
  A[出现异常] --> B[阶段一 根因排查]
  B --> C[阶段二 模式对比]
  C --> D[阶段三 单一假设验证]
  D --> E[阶段四 写回归测试]
  E --> F[修复并验收]
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
