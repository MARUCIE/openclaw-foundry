---
name: design-review
description: "Reviews a game design document for completeness, internal consistency, implementability, and adherence to project design standards. Run this before handing a design document to programmers."
argument-hint: "[path-to-design-doc]"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

## 是什么

帮你在把设计文档（PRD/PRP/GDD 等产品需求与设计稿）交给研发之前，先做一次八维度体检：完整性、内一致性、可实现性、是否符合团队规范。把"模糊的设计稿"变成"工程师拿到就能动手的交付物"。

## 怎么用

1. 在每次评审会前，把待审的设计文档路径喂给这个技能，让它先跑一遍自动体检。
2. 拿到八个维度的红黄绿评分后，先看红灯项，那是工程师最容易卡住的地方。
3. 把"内一致性问题"清单贴到评审会议纪要里，逐条和设计、研发对齐口径。
4. 修订完文档后，再跑一次，确保所有红灯转绿，再走交付流程。
5. 把发现的高频缺漏沉淀到团队的设计文档模板里，让下一次起草时就不再犯。

## 架构图

```mermaid
flowchart LR
  A[设计文档草稿] --> B[八维度体检]
  B --> C[内一致性检查]
  C --> D[红黄绿评分]
  D --> E[交付前评审报告]
```

When this skill is invoked:

1. **Read the target design document** in full.

2. **Read the master CLAUDE.md** to understand project context and standards.

3. **Read related design documents** referenced or implied by the target doc
   (check `design/gdd/` for related systems).

4. **Evaluate against the Design Document Standard checklist**:
   - [ ] Has Overview section (one-paragraph summary)
   - [ ] Has Player Fantasy section (intended feeling)
   - [ ] Has Detailed Rules section (unambiguous mechanics)
   - [ ] Has Formulas section (all math defined with variables)
   - [ ] Has Edge Cases section (unusual situations handled)
   - [ ] Has Dependencies section (other systems listed)
   - [ ] Has Tuning Knobs section (configurable values identified)
   - [ ] Has Acceptance Criteria section (testable success conditions)

5. **Check for internal consistency**:
   - Do the formulas produce values that match the described behavior?
   - Do edge cases contradict the main rules?
   - Are dependencies bidirectional (does the other system know about this one)?

6. **Check for implementability**:
   - Are the rules precise enough for a programmer to implement without guessing?
   - Are there any "hand-wave" sections where details are missing?
   - Are performance implications considered?

7. **Check for cross-system consistency**:
   - Does this conflict with any existing mechanic?
   - Does this create unintended interactions with other systems?
   - Is this consistent with the game's established tone and pillars?

8. **Output the review** in this format:

```
## Design Review: [Document Title]

### Completeness: [X/8 sections present]
[List missing sections]

### Consistency Issues
[List any internal or cross-system contradictions]

### Implementability Concerns
[List any vague or unimplementable sections]

### Balance Concerns
[List any obvious balance risks]

### Recommendations
[Prioritized list of improvements]

### Verdict: [APPROVED / NEEDS REVISION / MAJOR REVISION NEEDED]
```

9. **Contextual next step recommendations**:
   - If the document being reviewed is `game-concept.md` or `game-pillars.md`:
     - Check if `design/gdd/systems-index.md` exists
     - If it does NOT exist, add to Recommendations:
       > "This concept is ready for systems decomposition. Run `/map-systems`
       > to break it down into individual systems with dependencies and priorities,
       > then write per-system GDDs."
   - If the document is an individual system GDD:
     - Check if the systems index references this system
     - If verdict is APPROVED: suggest "Update the systems index status for
       this system to 'Approved'."
     - If verdict is NEEDS REVISION or MAJOR REVISION NEEDED: suggest "Update
       the systems index status for this system to 'In Review'."
     - Note: This skill is read-only. The user (or `/design-system`) must
       perform the actual status update in the systems index.
