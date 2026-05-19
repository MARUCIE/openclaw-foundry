---
name: pipeline-triage
description: "Diagnose a failed or degraded AI-Fleet pipeline. Use when: a pipeline health check fails, a cron job stops producing output, a LaunchAgent doesn't fire, the user reports 'X pipeline is broken', or you see non-zero exit codes in pipeline logs. Also trigger when ai harness health shows RED/ORANGE status for any pipeline. NOT for writing new pipelines — use sprint-pipeline-v2 for that."
---

## 是什么

AI-Fleet 数据管道的故障排查手册（runbook），把症状 → 定位 → 修复的诊断流程固化成 4 个阶段，让 LaunchAgent（macOS 启动代理）、cron（定时任务）、webhook（回调钩子）三类调度的失败都能按层定位，避免凭直觉乱改而把好的也带坏。

## 怎么用

1. 先在 `configs/pipeline-registry.json` 解析出 pipeline 的 ID、脚本路径、调度方式、`defaultDevice`（默认执行设备），不要用脚本名当 ID 找。
2. 按 5 层依次排查：触发层（调度是否真的触发）→ 环境层（依赖、API key、Tailscale）→ 脚本层（手动跑能否成功）→ 输出层（产物是否生成）→ 投递层（产物是否到达目的地）。
3. 检查 `failoverChain`（故障转移链）是否把任务从 VPS（虚拟专用服务器）静默漂到 mini，错把"在跑"当成"健康"。
4. 健康检查脚本本身可能是坏的，需要交叉看 `outputs/<pipeline-id>/` 实际产物文件大小与时间戳，再下结论。
5. 输出结构化 triage（分诊）报告：Broken Layer、Root Cause、Evidence、Fix、Prevention、Related，关键链路或动到生产数据时必须升级到 HITL（人在回路）。

## 架构图

```mermaid
flowchart LR
  A[症状: 管道无输出] --> B[Phase1 定位 Pipeline ID]
  B --> C[Phase2 5层逐层排查]
  C --> D[Phase3 交叉比对]
  D --> E{是否生产数据}
  E -->|否| F[Phase4 输出报告 + 修复]
  E -->|是| G[升级 HITL 人工审核]
```

# Pipeline Triage Runbook

Symptom in → structured diagnosis out. Do NOT guess fixes before completing Phase 1.

## Gotchas

1. **Pipeline IDs are in configs/pipeline-registry.json, not script names.** The script path and the pipeline ID often differ. Always resolve the pipeline ID first, then find its script, schedule, device, and dependencies.

2. **LaunchAgent vs cron vs webhook — three different failure modes.**
   - LaunchAgent (macOS): check `launchctl list | grep com.ai-fleet`, look at `~/Library/Logs/` for stderr
   - Cron (VPS): `crontab -l` on the correct user, check `/var/log/syslog` or journal
   - Webhook: check the listener process (`lsof -i :19802`), then the request log

3. **Device failover masks the real failure.** Pipeline-registry.json has `failoverChain`. If a pipeline silently failed over from `vps` to `mini`, you'll see it running — but on the wrong device. Check `defaultDevice` vs actual execution host.

4. **OpenClaw cron jobs (71 of 180) run on VPS under the `fleet` user.** SSH as `fleet@100.106.223.39`, not `root`. Their logs are at `/home/fleet/openclaw/logs/`.

5. **Health check commands in the registry can themselves be broken.** A pipeline may report "healthy" because its healthCheck script has a bug. Always also check the actual output files (`outputs/<pipeline-id>/`).

## Triage Flow (4 Phases)

### Phase 1: Identify & Reproduce

```bash
# 1. Resolve pipeline from registry
jq '.pipelines[] | select(.id == "PIPELINE_ID")' configs/pipeline-registry.json

# 2. Check recent execution
ai pipeline history PIPELINE_ID --last 5

# 3. Run health check manually
eval "$(jq -r '.pipelines[] | select(.id == "PIPELINE_ID") | .healthCheck' configs/pipeline-registry.json)"

# 4. Check if pipeline is enabled
jq '.pipelines[] | select(.id == "PIPELINE_ID") | {enabled, critical, defaultDevice, schedule}' configs/pipeline-registry.json
```

### Phase 2: Isolate Layer

```
Layer 1: Trigger     — Is the schedule/LaunchAgent/webhook actually firing?
Layer 2: Environment — Are dependencies (node, python, API keys, Tailscale) available?
Layer 3: Script      — Does the script run manually? What exit code?
Layer 4: Output      — Does it produce expected files/API responses?
Layer 5: Delivery    — Does the output reach its destination (Telegram, CF Pages, etc.)?
```

Check each layer with ONE diagnostic command. Stop at the first broken layer.

### Phase 3: Cross-Reference

- **Recent changes**: `git log --oneline -10 -- scripts/ configs/pipeline-registry.json`
- **Dependency status**: Check if dependent pipelines are also failing (registry `dependencies` field)
- **Device health**: `ai harness health` for local, SSH + `uptime && df -h && free -m` for VPS
- **Similar past failures**: `grep -r "PIPELINE_ID" doc/00_project/ data/sprints/` for prior incidents

### Phase 4: Report

Output a structured triage report:

```markdown
## Pipeline Triage: [PIPELINE_ID]
**Status**: BROKEN / DEGRADED / INTERMITTENT
**Broken Layer**: [1-5]
**Root Cause**: [one sentence]
**Evidence**: [command output that proves it]
**Fix**: [specific action]
**Prevention**: [what to add to health check or monitoring]
**Related**: [other pipelines affected]
```

## Red Flags — Escalate to Human

- Pipeline touches production data (D1/R2/KuzuDB) — do NOT auto-fix
- Multiple unrelated pipelines failing simultaneously — likely infrastructure issue
- Pipeline has `critical: true` in registry — notify user immediately via Telegram
- Fix requires changing credentials or API keys — HITL required
