---
description: 'Use when encountering a bug, test failure, crash, or unexpected behavior.
  Enforces root-cause investigation before any fix attempt. NOT for writing new features.
  Trigger: bug, error, failing test, broken, unexpected, crash, regression.'
name: systematic-debugging
---

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
