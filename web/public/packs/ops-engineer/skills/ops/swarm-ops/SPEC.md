---
name: swarm-ops
description: Operate the Agent Matrix Swarm -- status, health, discover agents, allocate tasks, circuit breaker. Use when user mentions swarm, hive, pheromone, agent allocation, or 蜂群.
triggers:
  - swarm status
  - swarm health
  - agent discover
  - pheromone
  - 蜂群
  - hive
  - allocate task
  - circuit breaker
---

# Swarm Operations

Operate the Agent Matrix Swarm Intelligence system (233 agents x 9 domains).

## Commands

| Command | Description |
|---------|-------------|
| `ai swarm status` | Show registered agents, idle/busy counts, convergence metrics |
| `ai swarm health` | Run convergence health check (Gini, entropy, load StdDev) |
| `ai swarm init --all` | Initialize all 233 agents into pheromone field |
| `ai swarm init --domain 销售` | Initialize a specific domain |
| `ai swarm allocate` | Run one allocation cycle for pending tasks |
| `ai swarm circuit` | Show circuit breaker state |
| `ai swarm circuit-open` | Emergency: force all tasks to cron fallback |
| `ai swarm circuit-close` | Resume swarm scheduling |
| `ai a2a stats` | Show registry statistics (233 agents, 9 domains) |
| `ai a2a discover "税务 申报"` | Semantic capability search |
| `ai a2a card AG-0042` | View Agent Card details |
| `ai a2a list --domain 销售` | List agents filtered by domain |

## Architecture

```
L4 Control Plane (CLI: ai swarm)
L3 Orchestration (LangGraph DAG + Stigmergy)
L2 Hive Mind (KG + Pheromone Field + Embed-Index)
L1 Agent Registry (A2A Protocol, 233 Agent Cards)
L0 Substrate (9-node Mesh + OpenClaw Runtime)
```

## Key Files

- Engine: `~/Projects/18-agent-matrix/core/swarm/` (6 modules)
- Data: `~/Projects/18-agent-matrix/data/agent_cards.json` (233 cards)
- Pheromone: `~/Projects/18-agent-matrix/data/pheromone.db`
- Architecture: `~/Projects/18-agent-matrix/doc/.../SWARM_UPGRADE_ARCHITECTURE.html`

## When to Use

- User asks about agent status, health, or allocation
- User wants to find an agent with specific capabilities
- User needs to emergency-stop swarm scheduling
- User mentions "蜂群", "信息素", "智能体调度"
