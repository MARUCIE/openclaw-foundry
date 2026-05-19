---
name: test-runner
description: "Run tests across any framework (Jest, PyTest, Mocha, Go test, RSpec) with unified interface. Use when: 'run tests', 'test this', test failure analysis, CI debugging. NOT for: writing new tests (use test-driven-development skill)."
source: "https://github.com/firstloophq/claude-code-test-runner"
---

## 是什么

这是一个统一的测试执行能力，自动识别 Jest、PyTest、Mocha、Go test、RSpec、Vitest 等主流测试框架并以一致命令跑起来，让团队成员不必为"这个项目用哪个框架、命令是什么"反复查文档。

## 怎么用

1. 进入项目根目录后直接调用 test-runner，由工具自动根据 jest.config、pytest.ini、Gemfile 等标记文件识别框架。
2. 让工具按识别结果执行测试，统一以"通过 / 失败 / 跳过 / 耗时"四项摘要输出，团队对每次运行的解读方式保持一致。
3. 测试失败时把失败用例与堆栈完整保留，禁止只看"X 个失败"就拍脑袋决定要不要修复，避免遗漏边缘场景。
4. 在 CI（持续集成）流水线里调用同一接口，确保本地、预发、CI 三个环境的测试命令完全一致，杜绝"本地能过 CI 不能过"。
5. 用同一工具跨多个仓库统计通过率与运行时长，作为团队测试基础设施健康度的长期趋势数据。

## 架构图

```mermaid
flowchart LR
    A[项目根目录] --> B[识别框架标记文件]
    B --> C[选择对应执行命令]
    C --> D[运行测试套件]
    D --> E[统一摘要输出]
    E --> F[失败用例完整堆栈]
```

name: test-runner

# Test Runner

Unified test execution interface. Auto-detects framework from project files and runs appropriate test commands.

## Framework Detection
| File | Framework | Command |
|------|-----------|---------|
| jest.config.* / package.json (jest) | Jest | npx jest |
| pytest.ini / pyproject.toml [tool.pytest] | PyTest | python -m pytest |
| .mocharc.* | Mocha | npx mocha |
| *_test.go | Go test | go test ./... |
| Gemfile (rspec) | RSpec | bundle exec rspec |
| vitest.config.* | Vitest | npx vitest run |

## Constraints
1. Always run tests in the project root (not subdirectories) unless user specifies
2. Show only failing tests by default; use --verbose for full output
3. Parse exit codes: 0=pass, 1=failures, 2=errors/config issues
4. For large test suites, run changed-file tests first (--changed-since=HEAD~1)

## Gotchas
**1. Jest --watchAll hangs in CI.** Always pass --ci or --watchAll=false in non-interactive environments.
**2. PyTest discovers tests by naming convention.** Files must start with test_ or end with _test.py. Classes must start with Test.

## Source

GitHub: https://github.com/firstloophq/claude-code-test-runner
