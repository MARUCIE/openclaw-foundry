---
name: impeccable-design
description: "[PLANNED] Placeholder - not yet implemented"
status: planned
---

## 是什么

帮你把一个已经做完功能的界面，打磨到"挑不出毛病"的程度——把对齐、留白、文案、状态、边界等容易在细节上掉链子的地方，一项一项过一遍。它的目标是让发布前的最后一公里不留遗憾。

## 怎么用

1. 把准备上线的页面交给它，让它先把所有可见状态截一遍（空、加载、出错、超长内容、极端权限）。
2. 让它按"对齐 - 留白 - 字号层级 - 文案口径 - 极端状态"这五项依次扫一遍。
3. 拿到的问题清单按"必修 / 选修"分两栏，先把必修项发给前端排进当前迭代。
4. 修完一轮再让它复扫一次，确认没有新引入的回归。
5. 把这次的修订要点沉淀成团队的"上线前自检清单"，下次直接照着跑。

## 架构图

```mermaid
flowchart LR
  A[功能完成的界面] --> B[多状态截图]
  B --> C[五项细节扫描]
  C --> D[必修与选修分级]
  D --> E[挑不出毛病的发布版]
```

# impeccable-design

This skill is referenced in skill-groups.json but not yet implemented.
Status: PLANNED for Phase 4 (Conductor orchestration framework).
