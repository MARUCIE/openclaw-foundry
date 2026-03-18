# OpenClaw Foundry — Design Document

> AI-driven one-click OpenClaw deployment service

## Overview

Foundry is a Client-Server system that analyzes user needs via AI and deploys
a fully customized OpenClaw environment on any machine (Mac, Windows, Linux).

## Architecture

```
Client (any terminal)              VPS (Foundry Server)
─────────────────────              ────────────────────
curl foundry.sh | bash
  → Interactive wizard (local)
  → POST /api/analyze  ──────→    Express HTTP server
                                    → AI analysis (Gemini API)
                                    → Skills catalog lookup
                                    → Blueprint JSON generation
  ← Blueprint received  ←──────
  → Execute locally
    (OpenClaw + skills + config)
```

## Core Abstraction: Blueprint

A Blueprint is a JSON document that fully describes a customized OpenClaw setup.
It is the contract between client and server, and can be saved, shared, versioned.

```json
{
  "version": "1.0",
  "meta": { "name", "os", "created", "profile", "description" },
  "openclaw": { "version", "installMethod" },
  "identity": { "role", "soulTemplate" },
  "skills": { "fromAifleet": [], "fromClawhub": [], "custom": [] },
  "agents": [{ "name", "role", "jobs": [] }],
  "config": { "autonomy", "modelRouting", "memoryChunks" },
  "cron": [{ "schedule", "job", "description" }],
  "mcpServers": [],
  "extensions": []
}
```

## Data Sources

| Source    | Type       | Access                          |
|-----------|------------|--------------------------------|
| AI-Fleet  | Local repo | Scan ~/.../skills/ + SKILL.md  |
| ClawHub   | Remote     | `openclaw skills list --json`  |

## Phases

### P1: Cold Boot (MVP)
- Interactive wizard collects user profile
- AI analysis generates Blueprint
- Executor installs OpenClaw + skills + config + agents
- Client-Server mode: thin shell script + VPS AI backend

### P2: Profile Switching
- Preset profiles (developer, PM, devops, compliance)
- `ocf switch <profile>` for instant reconfiguration
- Blueprint diff for incremental updates

### P3: Client Delivery
- `ocf export` generates .sh (Mac/Linux) or .ps1 (Windows) installer
- Self-contained script with embedded Blueprint
- Windows support via PowerShell + winget

## CLI Commands

| Command                    | Description                    |
|---------------------------|--------------------------------|
| `ocf init`                | Wizard → AI → Install          |
| `ocf init --server <url>` | Wizard locally, AI on VPS      |
| `ocf cast <file>`        | Execute existing Blueprint     |
| `ocf catalog`            | Browse skills catalog          |
| `ocf switch [profile]`   | Switch/list profiles (P2)      |
| `ocf export <file>`      | Export as installer script (P3)|
| `ocf doctor`             | Verify installation            |
| `ocf save <file> <id>`   | Save Blueprint as profile      |

## Server Endpoints

| Endpoint            | Method | Description                |
|--------------------|--------|----------------------------|
| `/api/analyze`     | POST   | AI analysis → Blueprint    |
| `/api/catalog`     | GET    | Skills catalog             |
| `/api/profiles`    | GET    | Preset profiles            |
| `/api/profiles/:id`| GET    | Single profile Blueprint   |
| `/api/health`      | GET    | Health check               |
| `/foundry.sh`      | GET    | Mac/Linux bootstrap script |
| `/foundry.ps1`     | GET    | Windows bootstrap script   |

## Security

- Optional API key via `OCF_API_KEY` env var
- Server-side rate limiting (future)
- No client-side API keys needed
- All AI calls happen server-side

## Tech Stack

- Runtime: Node.js (TypeScript + tsx)
- CLI: commander + @inquirer/prompts
- Server: Express
- AI: Google Generative AI (Gemini 2.5 Flash)
- Validation: zod
- Cross-platform shell: execa

---

Maurice | maurice_wen@proton.me
