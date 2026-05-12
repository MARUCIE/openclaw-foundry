---
name: paper-write
description: 本科与硕士学位论文全流程撰写辅助。支持大纲审核（理工科/文科）、结构仿写（通用章节/实验章节/绪论/摘要）、参考文献获取、融合、润色、缩写、扩写、防 AIGC、中英互译、结构化信息提取。当用户提到论文撰写、大纲审核、论文章节仿写、参考文献、论文润色、防 AIGC、论文翻译时使用。
---

# 本科&硕士学位论文撰写

## 使用时机

- 用户需要审核/优化论文大纲
- 用户需要仿写论文章节（绪论、摘要、实验章节等）
- 用户需要参考文献匹配与 GB/T 7714 格式
- 用户需要润色、缩写、扩写、去 AI 化
- 用户需要中英互译
- 用户需要从论文中提取结构化信息（用于答辩 PPT 等）

## Step 1：识别任务类型

根据用户需求选择对应 reference 文件执行：


| 任务         | 文件                                                                               |
| ---------- | -------------------------------------------------------------------------------- |
| 大纲审核（理工科）  | [outline-review-science.md](reference/outline-review-science.md)                 |
| 大纲审核（文科）   | [outline-review-liberal.md](reference/outline-review-liberal.md)                 |
| 结构仿写（通用章节） | [structure-imitate-general.md](reference/structure-imitate-general.md)           |
| 结构仿写（实验章节） | [structure-imitate-experiment.md](reference/structure-imitate-experiment.md)     |
| 结构仿写（绪论章节） | [structure-imitate-introduction.md](reference/structure-imitate-introduction.md) |
| 结构仿写（摘要部分） | [structure-imitate-abstract.md](reference/structure-imitate-abstract.md)         |
| 参考文献获取     | [references.md](reference/references.md)                                         |
| 融合         | [merge.md](reference/merge.md)                                                   |
| 润色         | [polish.md](reference/polish.md)                                                 |
| 实验章节润色     | [polish-experiment.md](reference/polish-experiment.md)                           |
| 缩写         | [abbreviate.md](reference/abbreviate.md)                                         |
| 扩写         | [expand.md](reference/expand.md)                                                 |
| 防 AIGC     | [anti-aigc.md](reference/anti-aigc.md)                                           |
| 中转英        | [zh-to-en.md](reference/zh-to-en.md)                                             |
| 英转中        | [en-to-zh.md](reference/en-to-zh.md)                                             |
| 结构化信息提取    | [extract-structured.md](reference/extract-structured.md)（完成后询问是否串联答辩 PPT 生成）     |


## Step 2：收集输入

- **多输入任务**（如绪论仿写需【参考范文】【论文大纲】【个人草稿】）：解析用户消息中的【】标记、追问缺失项、或读取用户指定的工作区文件，收齐后再执行。
- **单输入任务**：直接从用户消息或粘贴内容提取。

## Step 3：执行并输出

读取对应 reference 中的 Prompt，按其中 Role/Task/Constraints/Output Format 执行，输出符合要求的正文或结构化结果。

## 注意事项

- **Word 适配**：严禁 Markdown，中文与英文/数字/公式之间加空格，全角中文标点。
- **去 AI 化**：避免「显著提升」「极大增强」「卓越表现」「不仅如此」等。
- **信息零丢失**：严禁删除实验参数、数据、核心论点。
- **撰写顺序**：先做后写、由内向外——先完成方法章与实验，再写绪论与摘要。