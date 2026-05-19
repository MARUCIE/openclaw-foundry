---
name: api-design-reviewer
description: "Review REST/GraphQL API designs for consistency, security, and usability. Use when: 'review API', endpoint design, API versioning, error handling patterns. NOT for: implementation (use new-api-endpoint)."
source: "https://github.com/alirezarezvani/claude-skills"
---

## 是什么

帮你把"接口设计"这件事从一个人拍脑袋升级成一份可审计的契约，让前端、后端、移动端、外部合作方对同一个 URL（统一资源定位符）和返回值的理解保持一致，避免上线后再返工。

## 怎么用

1. 把待评审的接口草稿（路径、方法、入参、返回结构、错误码）整理成一份 API 契约（接口约定），交给本技能做一次结构化体检。
2. 让本技能逐条核对资源命名、HTTP 方法语义、错误响应结构、分页策略、版本切分是否符合 REST（表述性状态转移）约定，把不一致点列出来。
3. 针对每个不一致点，请本技能给出最小修改建议，并说明这条规则不遵守时会让谁踩坑（前端、外部合作方还是未来的自己）。
4. 把审核结论同步进 API 契约文档与下游消费方的对接文档，作为上线前的硬性门禁。
5. 实现完成后，再跑一次本技能对照实际接口产出与契约的差异，确认没有偷偷改约定。

## 架构图

```mermaid
flowchart LR
  A[接口草稿] --> B[契约结构化]
  B --> C[规则对照审核]
  C --> D[不一致点清单]
  D --> E[修订与落档]
  E --> F[上线前复核]
```

name: api-design-reviewer

# API Design Reviewer

Review API contracts for RESTful consistency, error handling, and developer experience.

## Constraints
1. Resources are nouns (plural): /users, /orders — never verbs (/getUser)
2. HTTP methods match semantics: GET=read, POST=create, PUT=replace, PATCH=update, DELETE=remove
3. Error responses: {error: {code, message, details}} — never plain strings
4. Pagination: cursor-based for real-time data, offset-based for static lists
5. Versioning: URL path (/v2/) for breaking changes, headers for minor versions

## Source

GitHub: https://github.com/alirezarezvani/claude-skills
