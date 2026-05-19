---
name: perf-profile
description: "Structured performance profiling workflow. Identifies bottlenecks, measures against budgets, and generates optimization recommendations with priority rankings."
argument-hint: "[system-name or 'full']"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

## 是什么

帮你把"系统好像有点卡"这种模糊感受转成一份带预算、带热点、带优先级的性能体检报告，让接口、数据库、前端在面对真实请求量时仍能稳定在性能预算内，而不是上线后再被告警追着跑。

## 怎么用

1. 把要分析的范围交给本技能（单一系统名 或 `full` 全量），让它先把性能预算（帧时间、内存、加载时长、QPS（每秒请求数））从设计文档里找出来作为基线。
2. 让本技能从代码里扫出常见瓶颈候选：热点循环、每帧分配、N+1 查询、未加索引的搜索、过度同步 I/O（输入输出）等。
3. 让本技能把每个热点按 影响 × 修复成本 排序，并标注属于 CPU 受限、GPU 受限、还是 I/O 受限，避免对错对象下药。
4. 拿到报告后，先做"小时级"快赢项，再排期"周级"重构项，并明确每条优化的预期收益与回归风险。
5. 修完后再跑一次本技能，对照前后预算余量，确认确实有改善而不是把问题挪了个位置。

## 架构图

```mermaid
flowchart LR
  A[性能预算] --> B[静态扫描热点]
  B --> C[影响与成本排序]
  C --> D[快赢与重构方案]
  D --> E[落地与回归]
  E --> F[复测预算余量]
```

When this skill is invoked:

1. **Determine scope** from the argument:
   - If a system name: focus profiling on that specific system
   - If `full`: run a comprehensive profile across all systems

2. **Read performance budgets** — Check for existing performance targets in design docs or CLAUDE.md:
   - Target FPS (e.g., 60fps = 16.67ms frame budget)
   - Memory budget (total and per-system)
   - Load time targets
   - Draw call budgets
   - Network bandwidth limits (if multiplayer)

3. **Analyze the codebase** for common performance issues:

   **CPU Profiling Targets**:
   - `_process()` / `Update()` / `Tick()` functions — list all and estimate cost
   - Nested loops over large collections
   - String operations in hot paths
   - Allocation patterns in per-frame code
   - Unoptimized search/sort over game entities
   - Expensive physics queries (raycasts, overlaps) every frame

   **Memory Profiling Targets**:
   - Large data structures and their growth patterns
   - Texture/asset memory footprint estimates
   - Object pool vs instantiate/destroy patterns
   - Leaked references (objects that should be freed but aren't)
   - Cache sizes and eviction policies

   **Rendering Targets** (if applicable):
   - Draw call estimates
   - Overdraw from overlapping transparent objects
   - Shader complexity
   - Unoptimized particle systems
   - Missing LODs or occlusion culling

   **I/O Targets**:
   - Save/load performance
   - Asset loading patterns (sync vs async)
   - Network message frequency and size

4. **Generate the profiling report**:

   ```markdown
   ## Performance Profile: [System or Full]
   Generated: [Date]

   ### Performance Budgets
   | Metric | Budget | Estimated Current | Status |
   |--------|--------|-------------------|--------|
   | Frame time | [16.67ms] | [estimate] | [OK/WARNING/OVER] |
   | Memory | [target] | [estimate] | [OK/WARNING/OVER] |
   | Load time | [target] | [estimate] | [OK/WARNING/OVER] |
   | Draw calls | [target] | [estimate] | [OK/WARNING/OVER] |

   ### Hotspots Identified
   | # | Location | Issue | Estimated Impact | Fix Effort |
   |---|----------|-------|------------------|------------|
   | 1 | [file:line] | [description] | [High/Med/Low] | [S/M/L] |
   | 2 | [file:line] | [description] | [High/Med/Low] | [S/M/L] |

   ### Optimization Recommendations (Priority Order)
   1. **[Title]** — [Description of the optimization]
      - Location: [file:line]
      - Expected gain: [estimate]
      - Risk: [Low/Med/High]
      - Approach: [How to implement]

   ### Quick Wins (< 1 hour each)
   - [Simple optimization 1]
   - [Simple optimization 2]

   ### Requires Investigation
   - [Area that needs actual runtime profiling to determine impact]
   ```

5. **Output the report** with a summary: top 3 hotspots, estimated headroom vs budget, and recommended next action.

### Rules
- Never optimize without measuring first — gut feelings about performance are unreliable
- Recommendations must include estimated impact — "make it faster" is not actionable
- Profile on target hardware, not just development machines
- Distinguish between CPU-bound, GPU-bound, and I/O-bound bottlenecks
- Consider worst-case scenarios (maximum entities, lowest spec hardware, worst network conditions)
- Static analysis (this skill) identifies candidates; runtime profiling confirms
