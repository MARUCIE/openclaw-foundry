---
name: test-runner
description: "Run tests across any framework (Jest, PyTest, Mocha, Go test, RSpec) with unified interface. Use when: 'run tests', 'test this', test failure analysis, CI debugging. NOT for: writing new tests (use test-driven-development skill)."
source: "https://github.com/firstloophq/claude-code-test-runner"
---
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
