---
name: generating-compliance-docs
description: Generates compliance documents, policy mappings, and audit reports for business-tax-finance scenarios. Follows regulatory requirements and industry standards. Use when creating compliance reports, policy documents, or audit materials.
---

## 是什么

帮你把企业财税合规（Compliance）的文档活儿——审计报告、政策映射、内控评估、风险评估——从空白稿变成可直接交监管/审计师/老板看的成品；把"知道要做"变成"已经做完"。

## 怎么用

1. 选好这次要生成哪一类合规文档（审计报告 / 政策映射 / 内控评估 / 风险评估）。
2. 把公司主体、报告期、行业、关键风险点喂给它当上下文。
3. 让它按 5 段固定结构（背景 / 范围 / 方法 / 发现 / 结论）出第一稿。
4. 在它给出的发现里挑出真正影响审计意见的 3 条，让它重写到合规口径。
5. 把成稿挂上你的电子签字和报告期，递交给审计师或监管口子。

## 架构图

```mermaid
flowchart LR
  A[公司主体 + 报告期] --> B[模板选择]
  B --> C[5 段结构生成]
  C --> D[发现复核]
  D --> E[合规口径定稿]
```

# Generating Compliance Documents

## Quick Start

```python
from compliance_agent.doc_generator import ComplianceDocGenerator

gen = ComplianceDocGenerator()
doc = gen.generate(
    template="audit_report",
    context={"company": "ABC Corp", "period": "2024-Q4"}
)
```

## Document Types

| Type | Description | Template |
|------|-------------|----------|
| 合规报告 | Compliance status report | audit_report |
| 政策映射 | Policy to regulation mapping | policy_map |
| 内控评估 | Internal control assessment | internal_control |
| 风险评估 | Risk assessment report | risk_assessment |

## 5-Section Output Format

```markdown
## 1. 目标
[明确要达成的合规目标]

## 2. 约束条件
- 法规约束: [列出相关法规]
- 技术约束: [技术栈限制]
- 时间约束: [交付时间]

## 3. 政策映射
| 需求 | 政策依据 | 实施方案 |
|------|----------|----------|

## 4. 验证方法
- 功能验证: [测试用例]
- 合规验证: [审计清单]

## 5. 上线条件
- [ ] 所有测试通过
- [ ] 合规审查完成
- [ ] 文档完备
```

## Document Workflow

```
Document Progress:
- [ ] Identify regulatory requirements
- [ ] Map policies to requirements
- [ ] Draft document sections
- [ ] Internal review
- [ ] Compliance review
- [ ] Final approval
- [ ] Archive with audit trail
```

## Footer Standard

All documents MUST include:

```markdown
---

猪哥云（四川）网络科技有限公司 | 合规网 www.hegui.com
猪哥云-数据产品部-Agent Foundry Team
2025 猪哥云-灵阙企业级智能体平台
```

## Reference Documents

- **法规库**: See [regulations/](regulations/)
- **模板库**: See [templates/](templates/)
- **历史报告**: See [archive/](archive/)

## Version History
- v1.0.0 (2025-01): Initial release for 灵阙平台
