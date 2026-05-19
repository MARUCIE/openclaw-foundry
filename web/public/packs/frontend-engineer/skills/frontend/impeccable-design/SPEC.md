---
name: impeccable-design
description: "[PLANNED] Placeholder - not yet implemented"
status: planned
---

## 是什么

为后续上线的"无瑕打磨"模式留的占位入口，未来会帮你把已经上线的页面做最后一公里的细节抛光，让产品从"看着不错"升到"挑不出毛病"。

## 怎么用

1. 当前是占位状态，还不能直接调用，建议先用 design-taste-frontend 或 redesign-existing-projects 顶上。
2. 上线后，把你想抛光的页面地址发给它，告诉它最在意的体感问题。
3. 它会按像素级清单逐项核查：对齐、间距、字重、动效曲线、边界状态。
4. 它一次只交付一份"无瑕修改单"，避免一锅端的大改动难以评审。
5. 你可以选择全收、部分回滚，它都记录在案以便后续追溯。

## 架构图

```mermaid
flowchart LR
  A[已上线页面] --> B[像素级核查]
  B --> C[无瑕修改单]
  C --> D[选择性回滚]
  D --> E[抛光后版本]
```

# impeccable-design

This skill is referenced in skill-groups.json but not yet implemented.
Status: PLANNED for Phase 4 (Conductor orchestration framework).
