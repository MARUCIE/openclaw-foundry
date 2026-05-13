---
name: infra-patrol
description: Infrastructure patrol combining CLI tools (trivy, terraform, cloudflared, wrangler) for security scanning, IaC validation, and tunnel health checks. Use when performing infrastructure audits, security scans, or pre-deployment checks.
allowed-tools: Bash, Read, Grep, Glob
---

# Infrastructure Patrol

Multi-CLI infrastructure health check combining security scanning, IaC validation, and network tunnel verification.

## Quick Start

Run full patrol on current project:
```bash
# 1. Security scan (vulnerabilities + secrets)
trivy fs --scanners vuln,secret --format json . | jq '.Results[] | {Target, Vulnerabilities: (.Vulnerabilities // [] | length), Secrets: (.Secrets // [] | length)}'

# 2. Terraform validate (if .tf files exist)
find . -name '*.tf' -maxdepth 3 | head -1 && terraform validate -json || echo '{"valid": true, "note": "no terraform files"}'

# 3. Cloudflare tunnel status
cloudflared tunnel list --output json 2>/dev/null | jq '.[].name' || echo "no tunnels"

# 4. Wrangler deployment status
wrangler deployments list --json 2>/dev/null | jq '.[0] | {id, created_on, strategy}' || echo "no workers"
```

## Patrol Levels

### L1: Quick Scan (< 30s)
- trivy fs (vuln only, skip db update)
- terraform fmt -check
- ai doctor --cli --json

### L2: Standard Patrol (< 2min)
- trivy fs (vuln + secret + config)
- terraform validate + plan (dry-run)
- cloudflared tunnel list
- wrangler deployments list

### L3: Deep Audit (< 10min)
- trivy repo (full repo scan with SBOM)
- terraform plan -detailed-exitcode
- trivy config (IaC misconfig scan on .tf files)
- DNS + SSL certificate checks

## Output Format

```json
{
  "patrol_level": "L2",
  "timestamp": "ISO8601",
  "results": {
    "security": {"vulnerabilities": 0, "secrets": 0, "misconfigs": 0},
    "iac": {"valid": true, "drift": false},
    "network": {"tunnels_active": 1, "workers_deployed": 3},
    "cli_health": {"total": 12, "ok": 10, "missing": 2}
  },
  "verdict": "PASS|WARN|FAIL",
  "actions": ["list of recommended actions if WARN/FAIL"]
}
```

## Integration

- PreToolUse hook: auto-trigger L1 scan before `terraform apply` or `wrangler deploy`
- Cron: weekly L2 patrol on all devices (fleet-cron-drift.sh compatible)
- DNA: security findings auto-create DNA capsules for cross-agent inheritance

## CLI Dependencies

All CLIs from `configs/cli-registry.json`:
- **trivy** (security): vuln + secret + config scanning
- **terraform** (infra): IaC validation and drift detection
- **cloudflared** (network): tunnel health
- **wrangler** (deploy): Worker deployment status
- **ai doctor --cli**: CLI availability baseline
