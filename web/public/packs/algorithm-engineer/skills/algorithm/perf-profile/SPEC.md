---
name: perf-profile
description: "Structured performance profiling workflow. Identifies bottlenecks, measures against budgets, and generates optimization recommendations with priority rankings."
argument-hint: "[system-name or 'full']"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

## 是什么

把性能调优从"凭直觉改代码"升级成"先量预算、再找热点、再排优先级"的结构化流程，帮你把"模型/系统跑得慢"翻译成"哪一段超了多少预算、改什么收益最大、风险多大"，让性能优化每一步都有可对照的目标和可量化的收益。

## 怎么用

1. 先把性能预算写清楚：帧时间（如 16.67ms = 60fps）、内存上限、加载时长、Draw Call（绘制调用）、网络带宽，让"快不快"有可量化的判定线。
2. 再扫描 CPU 热点：每帧循环、嵌套大集合、热路径字符串拼接、物理射线查询，列出最贵的前几个函数，让优化对象不再凭感觉拍。
3. 同步扫描内存与渲染：大对象增长曲线、纹理占用、对象池 vs 频繁创建销毁、Overdraw（过度绘制）、缺失 LOD（多层细节）/Occlusion Culling（遮挡剔除），让 GPU/内存瓶颈一并暴露。
4. 把结果写成"预算表 + 热点表 + 优先级表"三张表，让业务方一眼看到现状对预算超了多少、改哪几条收益最大。
5. 给出 Quick Wins（1 小时内可做完的小优化）和"需要 runtime profiling（运行时分析）才能定量"的待办，让团队既有立即能动的清单，也有下一步深入方向。

## 架构图

```mermaid
flowchart LR
    A[性能预算] --> B[静态扫描]
    B --> C[CPU/内存/渲染热点]
    C --> D[优先级排序]
    D --> E[Quick Wins + 深入项]
    E --> F[运行时验证]
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
