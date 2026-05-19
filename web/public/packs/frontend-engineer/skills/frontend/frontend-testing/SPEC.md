---
name: testing-frontend
description: Validates frontend applications for performance, console errors, responsive design, and E2E functionality. Uses Chrome DevTools and Playwright. Use when testing web apps, checking performance metrics, or validating UI changes.
allowed-tools: Bash, Read, Grep, Glob
---

## 是什么

帮你在 UI 改动上线之前过一遍体检，让你对性能、报错、响应式、关键流程心里有数，避免发版后才被用户反馈"卡""白屏""按钮没反应"。

## 怎么用

1. 把要测的页面地址或本地预览端口告诉它，它会自己起一份验收清单。
2. 它先看接口请求成不成功，再扫一遍浏览器控制台有没有报错和警告。
3. 它会跑一遍核心性能指标（LCP 首屏内容加载、CLS 布局抖动、INP 交互响应），不达标的地方圈出来。
4. 它顺带在不同视口下截图，看看手机、平板、桌面有没有布局塌方。
5. 关键用户路径它会走一遍端到端（E2E，End-to-End）回归，输出一份带截图的报告给你。

## 架构图

```mermaid
flowchart LR
  A[页面地址] --> B[接口与控制台体检]
  B --> C[Core Web Vitals 跑分]
  C --> D[多视口截图]
  D --> E[关键路径 E2E 回归]
  E --> F[体检报告]
```

# Testing Frontend

## Quick Start

Run Lighthouse audit:
```bash
npx lighthouse http://localhost:3000 --output=json --output-path=./report.json
```

## Requirements

```bash
npm install -D playwright @playwright/test lighthouse
npx playwright install
```

## 5-Step Validation Process

Copy and track:
```
Frontend Validation:
- [ ] Step 1: Network requests (API success)
- [ ] Step 2: Console monitoring (zero errors)
- [ ] Step 3: Performance metrics (Core Web Vitals)
- [ ] Step 4: Responsive testing (3 breakpoints)
- [ ] Step 5: E2E functionality (critical paths)
```

## Step 1: Network Requests

**Target**: All API calls return 2xx status

```javascript
// Playwright network monitoring
test('API calls succeed', async ({ page }) => {
  const failedRequests = [];

  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  await page.goto('/');
  expect(failedRequests).toHaveLength(0);
});
```

## Step 2: Console Errors

**Target**: Zero JavaScript errors

```javascript
test('No console errors', async ({ page }) => {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(errors).toHaveLength(0);
});
```

## Step 3: Performance Metrics

**Targets**:
- LCP (Largest Contentful Paint) < 2.5s
- CLS (Cumulative Layout Shift) < 0.1
- FID (First Input Delay) < 100ms

```javascript
test('Core Web Vitals pass', async ({ page }) => {
  await page.goto('/');

  const metrics = await page.evaluate(() => {
    return new Promise(resolve => {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        resolve({
          lcp: entries.find(e => e.entryType === 'largest-contentful-paint')?.startTime,
          cls: entries.find(e => e.entryType === 'layout-shift')?.value
        });
      }).observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
    });
  });

  expect(metrics.lcp).toBeLessThan(2500);
  expect(metrics.cls).toBeLessThan(0.1);
});
```

## Step 4: Responsive Testing

**Breakpoints**:
- Desktop: 1920x1080
- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)

```javascript
const devices = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 }
];

for (const device of devices) {
  test(`Layout on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto('/');
    await page.screenshot({ path: `screenshots/${device.name}.png` });
  });
}
```

## Step 5: E2E Functionality

```javascript
test('Critical user flow', async ({ page }) => {
  // Navigate
  await page.goto('/');

  // Interact
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');

  // Verify
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Output Report

```json
{
  "verdict": "PASS|FAIL",
  "network": { "status": "PASS", "failed_requests": 0 },
  "console": { "status": "PASS", "errors": 0 },
  "performance": {
    "lcp": 1200,
    "cls": 0.05,
    "fid": 50,
    "status": "PASS"
  },
  "responsive": { "status": "PASS", "screenshots": [] },
  "e2e": { "status": "PASS", "tests_passed": 5 }
}
```

## Version History
- v1.0.0 (2025-01): Initial release based on CLAUDE.md requirements
