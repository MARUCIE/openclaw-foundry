---
name: create-prd
description: "Create a Product Requirements Document using a comprehensive 8-section template covering problem, objectives, segments, value propositions, solution, and release planning. Use when writing a PRD, documenting product requirements, preparing a feature spec, or reviewing an existing PRD."
---

## 是什么

帮你把脑子里那份"我们要做的产品"翻译成一份八段式产品需求文档（PRD，Product Requirements Document），让工程、设计、业务、老板看完之后对"为什么做、做给谁、做成什么样"有一致的理解。

## 怎么用

1. 先把问题陈述写透，把"我们到底在解决谁的什么痛"说成一句话，避免方案先行。
2. 顺着目标、客户细分、价值主张三段对齐"做这件事的理由"。
3. 在解决方案段落里只写必要的功能范围，把"可有可无"的需求挪到后续版本。
4. 用发布计划段落把首版范围和上线节奏定下来，让工程能据此排期。
5. 写完后做一遍同行评审，把每段读不通顺的地方改清楚，再交给跨职能干系人对齐。

## 架构图

```mermaid
flowchart LR
  A[问题陈述] --> B[目标与客户细分]
  B --> C[价值主张]
  C --> D[解决方案范围]
  D --> E[发布计划]
  E --> F[同行评审与对齐]
```


# Create a Product Requirements Document

## Purpose

You are an experienced product manager responsible for creating a comprehensive Product Requirements Document (PRD) for $ARGUMENTS. This document will serve as the authoritative specification for your product or feature, aligning stakeholders and guiding development.

## Context

A well-structured PRD clearly communicates the what, why, and how of your product initiative. This skill uses an 8-section template proven to communicate product vision effectively to engineers, designers, leadership, and stakeholders.

## Instructions

1. **Gather Information**: If the user provides files, read them carefully. If they mention research, URLs, or customer data, use web search to gather additional context and market insights.

2. **Think Step by Step**: Before writing, analyze:
   - What problem are we solving?
   - Who are we solving it for?
   - How will we measure success?
   - What are our constraints and assumptions?

3. **Apply the PRD Template**: Create a document with these 8 sections:

   **1. Summary** (2-3 sentences)
   - What is this document about?

   **2. Contacts**
   - Name, role, and comment for key stakeholders

   **3. Background**
   - Context: What is this initiative about?
   - Why now? Has something changed?
   - Is this something that just recently became possible?

   **4. Objective**
   - What's the objective? Why does it matter?
   - How will it benefit the company and customers?
   - How does it align with vision and strategy?
   - Key Results: How will you measure success? (Use SMART OKR format)

   **5. Market Segment(s)**
   - For whom are we building this?
   - What constraints exist?
   - Note: Markets are defined by people's problems/jobs, not demographics

   **6. Value Proposition(s)**
   - What customer jobs/needs are we addressing?
   - What will customers gain?
   - Which pains will they avoid?
   - Which problems do we solve better than competitors?
   - Consider the Value Curve framework

   **7. Solution**
   - 7.1 UX/Prototypes (wireframes, user flows)
   - 7.2 Key Features (detailed feature descriptions)
   - 7.3 Technology (optional, only if relevant)
   - 7.4 Assumptions (what we believe but haven't proven)

   **8. Release**
   - How long could it take?
   - What goes in the first version vs. future versions?
   - Avoid exact dates; use relative timeframes

4. **Use Accessible Language**: Write for a primary school graduate. Avoid jargon. Use clear, short sentences.

5. **Structure Output**: Present the PRD as a well-formatted markdown document with clear headings and sections.

6. **Save the Output**: If the PRD is substantial (which it will be), save it as a markdown document in the format: `PRD-[product-name].md`

## Notes

- Be specific and data-driven where possible
- Link each section back to the overall strategy
- Flag assumptions clearly so the team can validate them
- Keep the document concise but complete

---

### Further Reading

- [How to Write a Product Requirements Document? The Best PRD Template.](https://www.productcompass.pm/p/prd-template)
- [A Proven AI PRD Template by Miqdad Jaffer (Product Lead @ OpenAI)](https://www.productcompass.pm/p/ai-prd-template)
