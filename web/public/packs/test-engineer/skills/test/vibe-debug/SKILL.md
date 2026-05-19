---
name: vibe-debug
version: 1.0.0
category: debugging
description: "Automated test-driven debugging pipeline. Replaces human-in-the-loop 'still broken' prompting with: write reproducing test -> self-loop with test feedback -> exit when green."
triggers:
  - bug that persists after 2+ fix attempts
  - user says "vibe debug" or "test-driven debug"
  - same failure signature appears twice consecutively
dependencies:
  - systematic-debugging
  - test-driven-development
  - ralph-wiggum
---

## 是什么

这是一个面向"反复修不好的疑难 bug"的自动化排障管线，先写一条能稳定复现缺陷的测试，再让管线自循环改代码、跑测试、读反馈，直到测试转绿才退出，把研发从"还没好？再试试？"的人工反馈循环中解放出来。

## 怎么用

1. 当同一缺陷修两次以上仍未解决时启用，把"凭印象试错"切换为"用测试驱动收敛"的工作方式。
2. 第一步写一条能稳定复现该缺陷的测试用例，确保测试在缺陷未修复前持续失败，作为收敛的客观信号。
3. 让管线在测试失败 -> 修改实现 -> 重跑测试 -> 读取报错 的闭环内自动迭代，直到测试由红转绿才退出循环。
4. 设置最大迭代轮数和单轮超时，避免管线陷入"修了又坏"的死循环，超出阈值时主动暂停并交回人工判断。
5. 缺陷修复后把那条复现测试永久并入回归测试库，把今天的疑难场景变成明天的质量护栏。

## 架构图

```mermaid
flowchart LR
    A[疑难缺陷] --> B[写复现测试]
    B --> C[运行测试 失败]
    C --> D[管线自动改代码]
    D --> E[重跑测试]
    E -->|仍失败| D
    E -->|转绿| F[退出+回归入库]
```

# Vibe Debug: Test-Driven Debugging Pipeline

## The Problem This Solves

```
ANTI-PATTERN (human-in-the-loop debug):

  Human: "Fix this bug"
  Agent: [makes change]
  Human: "Still broken"           <-- low-information feedback
  Agent: [makes different change]
  Human: "Still broken, now X too" <-- regression
  Agent: [reverts, tries again]
  ... repeat 7-8 times ...        <-- wasted tokens, wasted time

WHY IT FAILS:
  - Human descriptions are lossy (omit stack traces, exact state, timing)
  - Each round costs ~30s human attention + agent tokens
  - Agent has no memory of what already failed
  - No regression guard between attempts
```

```
VIBE DEBUG (zero-HITL pipeline):

  Human: "Fix this bug" (once)
  Agent: [Phase 1] Investigate root cause, gather evidence
  Agent: [Phase 2] Write minimal test that REPRODUCES the bug
  Agent: [Phase 3] Self-loop: fix -> run test -> analyze -> fix
  Agent: [Phase 4] All green -> verify no regression -> done

WHY IT WORKS:
  - Test output >> human description (exact assertion, stack trace, timing)
  - Agent sees structured failure data, not "still broken"
  - Each iteration is automatic (~5s test run vs ~30s human round-trip)
  - Regression guard built in (full suite at Phase 4)
  - Failed attempts accumulate as context (agent learns what NOT to do)
```

## The Iron Law

```
NO FIX ATTEMPTS WITHOUT A FAILING TEST FIRST
```

If you cannot write a test that reproduces the bug, you do not understand
the bug well enough to fix it. Go back to Phase 1.

## When to Use

**Mandatory triggers:**
- Same bug/failure signature appears 2+ times consecutively
- Human says "still broken" or equivalent after a fix attempt
- Agent detects it is about to enter a guess-and-check loop

**Recommended triggers:**
- Any bug that touches >1 file
- Any bug where the root cause is not immediately obvious
- Any bug in code without existing test coverage

**Skip when:**
- Typo / obvious one-liner fix (e.g., wrong variable name)
- Config-only change (no code logic to test)
- Build/tooling error (not a logic bug)

## The 4-Phase Pipeline

### Phase 1: Investigate (from systematic-debugging)

**Goal:** Understand the bug. DO NOT fix anything yet.

```
1. Read the error message / symptom carefully
2. Reproduce: find the minimal trigger (input, state, sequence)
3. Narrow scope: which file(s) / function(s) are involved?
4. Add instrumentation if needed:
   - console.log / print at key decision points
   - Temporary assertions to verify intermediate state
   - Network/timing probes if relevant
5. Identify root cause (not symptom)

OUTPUT: One sentence: "The bug is in [file:function] because [root cause]"
```

**Gate:** Cannot proceed to Phase 2 without a root cause hypothesis.

### Phase 2: Write Reproducing Test (from TDD)

**Goal:** Capture the bug as an automated test that FAILS right now.

```
1. Choose test framework (detect from project: vitest/jest/pytest/go test/etc.)
2. Write the MINIMAL test that triggers the bug:
   - Set up the exact preconditions
   - Execute the buggy code path
   - Assert the CORRECT expected behavior (which currently fails)
3. Run the test. Verify it FAILS with the expected error.
4. If the test PASSES: your root cause hypothesis is wrong. Go back to Phase 1.

OUTPUT: A test file that fails with the bug's signature
```

**Gate:** Test must fail. A passing test means you misidentified the bug.

**Test naming convention:** `test_vibe_debug_<bug_description>`
This makes it easy to identify tests added by this pipeline.

### Phase 3: Fix Loop (from ralph-loop)

**Goal:** Iterate until the test passes. Zero human involvement.

```
LOOP (max iterations: 10):
  1. Analyze the test failure output (not human description)
  2. Identify the minimal code change to fix
  3. Apply the change
  4. Run the reproducing test
  5. IF test passes -> exit loop, go to Phase 4
  6. IF test fails with SAME error -> try different approach
  7. IF test fails with NEW error -> assess if progress or regression
     - Progress (closer to correct): continue
     - Regression (new unrelated failure): revert last change, try again

EXIT CONDITIONS:
  - SUCCESS: reproducing test passes
  - FAILURE: 10 iterations exhausted -> escalate to human with full log
```

**Rules during the loop:**
- Each iteration reads the TEST OUTPUT, not a human prompt
- Keep a running log of what was tried and why it failed
- Never repeat the exact same fix (check against attempt history)
- Prefer minimal diffs (1-3 lines) over large rewrites
- If stuck after 5 iterations, add more instrumentation and re-analyze

**Anti-patterns to avoid:**
- Guessing without reading test output carefully
- Reverting to a "known good" state and trying random things
- Adding try/catch to silence the error instead of fixing root cause
- Changing the test to match buggy behavior

### Phase 4: Verify (regression check)

**Goal:** Confirm the fix is correct and complete.

```
1. Run the reproducing test one final time (must pass)
2. Run the FULL test suite (must pass -- no regressions)
3. Remove any temporary instrumentation (console.log, debug prints)
4. Review the diff: is the fix minimal and correct?
5. Scan for similar patterns: does the same bug exist elsewhere?

OUTPUT:
  - Fix diff
  - Test result (reproducing test: PASS)
  - Full suite result (all tests: PASS or list regressions)
  - Similar pattern scan result
```

**Gate:** Full suite must pass. Any regression -> fix the regression first.

## Instrumentation Toolkit

When Phase 1 needs more visibility, use these patterns:

### JavaScript/TypeScript
```javascript
// Temporary debug probe (remove in Phase 4)
console.log(`[VIBE-DEBUG] ${fnName} input:`, JSON.stringify(args, null, 2));
console.log(`[VIBE-DEBUG] ${fnName} output:`, JSON.stringify(result, null, 2));
console.log(`[VIBE-DEBUG] ${fnName} state:`, { key: value });
```

### Python
```python
# Temporary debug probe (remove in Phase 4)
import sys
print(f"[VIBE-DEBUG] {fn_name} input: {args}", file=sys.stderr)
print(f"[VIBE-DEBUG] {fn_name} output: {result}", file=sys.stderr)
```

### Shell
```bash
# Temporary debug probe (remove in Phase 4)
echo "[VIBE-DEBUG] $FUNCNAME input: $*" >&2
echo "[VIBE-DEBUG] $FUNCNAME output: $result" >&2
```

All probes use `[VIBE-DEBUG]` prefix for easy grep-and-remove in Phase 4:
```bash
grep -rn '\[VIBE-DEBUG\]' . --include='*.{ts,js,py,sh}'
```

## Escalation Protocol

If Phase 3 exhausts all 10 iterations without success:

```
1. Collect: all 10 attempt diffs + test outputs
2. Summarize: "Tried X approaches, all failed because Y"
3. Present to human:
   - Root cause hypothesis (Phase 1)
   - Reproducing test (Phase 2)
   - Attempt log with failure reasons
   - Top 2 remaining hypotheses to try
4. Human provides new direction -> restart from Phase 1 with new info
```

This is NOT failure -- it is efficient escalation. The human gets a structured
briefing instead of "still broken," and the reproducing test survives as
permanent regression coverage.

## Integration with Existing Skills

```
systematic-debugging   Phase 1 (investigate root cause)
         |
         v
test-driven-development   Phase 2 (write failing test)
         |
         v
ralph-loop               Phase 3 (self-correct until green)
         |
         v
verification             Phase 4 (full suite + cleanup)
```

Each phase uses the corresponding skill's methodology. Vibe Debug adds:
- The **orchestration** (phase sequencing with gates)
- The **instrumentation toolkit** (structured probes)
- The **attempt history** (prevents repeating failed fixes)
- The **escalation protocol** (graceful human handoff when stuck)

## Usage Examples

### Example 1: Function returns wrong value

```
Phase 1: "calculateTax() returns 0 for valid inputs because the tax rate
         lookup falls through to default case (missing 'CA' in state map)"
Phase 2: test('calculateTax returns correct tax for CA', () => {
           expect(calculateTax(100, 'CA')).toBe(7.25);
         });
         // FAILS: Expected 7.25, Received 0
Phase 3: Iteration 1 - Add 'CA' to state map -> test PASSES
Phase 4: Full suite passes. Scanned for similar: found 'NY' also missing.
         Added test + fix for NY. All green.
```

### Example 2: Race condition in async code

```
Phase 1: "User profile shows stale data after edit because setState is
         called before the API response resolves (missing await)"
Phase 2: test('profile updates after edit', async () => {
           await editProfile({ name: 'New' });
           expect(screen.getByText('New')).toBeInTheDocument();
         });
         // FAILS: Expected element with text 'New', not found
Phase 3: Iteration 1 - Add await -> test still fails (wrong await location)
         Iteration 2 - Move await to correct promise -> test PASSES
Phase 4: Full suite passes. No similar patterns found.
```

## Metrics

Track these to measure Vibe Debug effectiveness:

| Metric | Target | Meaning |
|--------|--------|---------|
| Iterations to fix | <= 3 | Most bugs should resolve in 1-3 loops |
| Phase 1 accuracy | > 80% | Root cause hypothesis correct on first try |
| Escalation rate | < 10% | Most bugs resolved without human re-entry |
| Regression rate | 0% | Phase 4 catches any regressions |
| Test survival rate | 100% | All reproducing tests kept as permanent coverage |
