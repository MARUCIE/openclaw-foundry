---
name: prototype
description: "Rapid prototyping workflow. Skips normal standards to quickly validate a game concept or mechanic. Produces throwaway code and a structured prototype report."
argument-hint: "[concept-description]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

## 是什么

帮你在拍板做一个新概念之前，用最低成本造一个能跑的原型来回答"这个想法到底成不成立"。它不追求工程质量，追求的是"一次性回答一个具体问题"，并出一份结构化的原型小结。

## 怎么用

1. 用一句话写清楚这次原型要回答的核心问题，不要写成需求清单。
2. 让它扫一眼当前的技术栈与已有素材，确认原型用什么底子搭最快。
3. 给它定一个明确的时间盒（比如半天、一天），别让原型滑成小项目。
4. 跑完原型后，让它输出一份结构化小结：核心问题、答案、证据、下一步建议。
5. 如果结论是"成立"，再决定要不要立项；如果结论是"不成立"，把这份小结归档进决策日志。

## 架构图

```mermaid
flowchart LR
  A[一个核心问题] --> B[最小可行原型方案]
  B --> C[时间盒内搭建]
  C --> D[原型验证结果]
  D --> E[结构化决策小结]
```

When this skill is invoked:

1. **Read the concept description** from the argument. Identify the core
   question this prototype must answer. If the concept is vague, state the
   question explicitly before proceeding.

2. **Read CLAUDE.md** for project context and the current tech stack. Understand
   what engine, language, and frameworks are in use so the prototype is built
   with compatible tooling.

3. **Create a prototype plan**: Define in 3-5 bullet points what the minimum
   viable prototype looks like. What is the core question? What is the absolute
   minimum code needed to answer it? What can be skipped?

4. **Create the prototype directory**: `prototypes/[concept-name]/` where
   `[concept-name]` is a short, kebab-case identifier derived from the concept.

5. **Implement the prototype** in the isolated directory. Every file must begin
   with:
   ```
   // PROTOTYPE - NOT FOR PRODUCTION
   // Question: [Core question being tested]
   // Date: [Current date]
   ```
   Standards are intentionally relaxed:
   - Hardcode values freely
   - Use placeholder assets
   - Skip error handling
   - Use the simplest approach that works
   - Copy code rather than importing from production

6. **Test the concept**: Run the prototype. Observe behavior. Collect any
   measurable data (frame times, interaction counts, feel assessments).

7. **Generate the Prototype Report** and save it to
   `prototypes/[concept-name]/REPORT.md`:

```markdown
## Prototype Report: [Concept Name]

### Hypothesis
[What we expected to be true -- the question we set out to answer]

### Approach
[What we built, how long it took, what shortcuts we took]

### Result
[What actually happened -- specific observations, not opinions]

### Metrics
[Any measurable data collected during testing]
- Frame time: [if relevant]
- Feel assessment: [subjective but specific -- "response felt sluggish at
  200ms delay" not "felt bad"]
- Player action counts: [if relevant]
- Iteration count: [how many attempts to get it working]

### Recommendation: [PROCEED / PIVOT / KILL]

[One paragraph explaining the recommendation with evidence]

### If Proceeding
[What needs to change for a production-quality implementation]
- Architecture requirements
- Performance targets
- Scope adjustments from the original design
- Estimated production effort

### If Pivoting
[What alternative direction the results suggest]

### If Killing
[Why this concept does not work and what we should do instead]

### Lessons Learned
[Discoveries that affect other systems or future work]
```

8. **Output a summary** to the user with: the core question, the result, and
   the recommendation. Link to the full report at
   `prototypes/[concept-name]/REPORT.md`.

### Important Constraints

- Prototype code must NEVER import from production source files
- Production code must NEVER import from prototype directories
- If the recommendation is PROCEED, the production implementation must be
  written from scratch -- prototype code is not refactored into production
- Total prototype effort should be timeboxed to 1-3 days equivalent of work
- If the prototype scope starts growing, stop and reassess whether the
  question can be simplified
