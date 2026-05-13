---
name: generating-compliance-docs
description: Generates compliance documents, policy mappings, and audit reports for business-tax-finance scenarios. Follows regulatory requirements and industry standards. Use when creating compliance reports, policy documents, or audit materials.
---

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
猪哥云-数据产品部-Maurice | maurice_wen@proton.me
2025 猪哥云-灵阙企业级智能体平台
```

## Reference Documents

- **法规库**: See [regulations/](regulations/)
- **模板库**: See [templates/](templates/)
- **历史报告**: See [archive/](archive/)

## Version History
- v1.0.0 (2025-01): Initial release for 灵阙平台
