<p align="center">
  <img src="https://img.shields.io/badge/skills-37%2C000%2B-blue?style=for-the-badge" alt="Skills" />
  <img src="https://img.shields.io/badge/MCP_servers-4%2C200%2B-purple?style=for-the-badge" alt="MCP" />
  <img src="https://img.shields.io/badge/platforms-12-green?style=for-the-badge" alt="Platforms" />
  <img src="https://img.shields.io/badge/license-MIT-orange?style=for-the-badge" alt="License" />
</p>

# OpenClaw Foundry

> **The curated AI Agent skill marketplace.** 37,000+ vetted skills. S/A/B/C quality ratings. Deploy anywhere.

OpenClaw Foundry aggregates skills from multiple sources (ClawHub, MCP Registry), rates them with a percentile-based S/A/B/C system, and lets you browse, search, and install them to any AI agent platform in one click.

**Live site:** [openclaw-foundry.pages.dev](https://openclaw-foundry.pages.dev)

---

## Why OpenClaw Foundry?

- **37,296 skills** from ClawHub API + MCP Registry, deduplicated and unified
- **Quality ratings** — S (top 5%) / A (top 26%) / B (top 58%) / C / D based on downloads, stars, and metadata
- **23 categories** with fuzzy search (supports Chinese synonyms)
- **12 platforms** organized by 3 automation tiers (Full Auto / Semi Auto / Guided)
- **Zero VPS** — runs entirely on Cloudflare (Pages + Workers + D1 + R2)
- **Daily auto-sync** — GitHub Actions cron scrapes and updates every day at 06:00 UTC
- **Bilingual** — English and Chinese with one-click language switching

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│   CF Pages (Next.js)│────▶│  CF Workers (Hono)   │
│   Static Export     │     │  REST API            │
└─────────────────────┘     └──────────┬───────────┘
                                       │
                            ┌──────────▼───────────┐
                            │    Cloudflare D1      │
                            │    (SQLite)           │
                            └──────────────────────┘
                                       │
┌─────────────────────┐     ┌──────────▼───────────┐
│  GitHub Actions      │────▶│  Data Pipeline       │
│  Daily Cron (06:00)  │     │  Scrape → Rate →     │
│  + Push Deploy       │     │  Categorize → Seed   │
└─────────────────────┘     └──────────────────────┘
```

## Quick Start

### Option 1: Use the live site

Visit [openclaw-foundry.pages.dev](https://openclaw-foundry.pages.dev) — no setup needed.

### Option 2: Self-host (< 5 minutes)

**Prerequisites:** Node.js 20+, a free [Cloudflare account](https://dash.cloudflare.com/sign-up)

```bash
# Clone
git clone https://github.com/MARUCIE/openclaw-foundry.git
cd openclaw-foundry

# Install all dependencies
npm install
cd web && npm install && cd ..
cd worker && npm install && cd ..

# Configure Cloudflare bindings
cp worker/wrangler.toml.example worker/wrangler.toml
# Edit wrangler.toml with your D1 database ID and KV namespace ID

# Create D1 database
npx wrangler d1 create openclaw-foundry

# Seed the database
node scripts/generate-seed-sql.mjs
cd worker && npx wrangler d1 execute openclaw-foundry --local --file=src/seed.sql && cd ..

# Run locally
cd web && npm run dev     # Frontend at http://localhost:3200
cd worker && npm run dev  # API at http://localhost:8787
```

### Option 3: Deploy to Cloudflare

1. Fork this repo
2. Add GitHub Secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
3. Push to `main` — GitHub Actions deploys automatically

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS v4 |
| Backend | Hono (Cloudflare Workers) |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Cache | Cloudflare KV |
| CI/CD | GitHub Actions |
| Design | Azure Foundry design system (MD3 tokens) |

## Data Pipeline

The pipeline runs daily via GitHub Actions:

1. **Scrape** — Fetch from ClawHub API (33K+ skills) and MCP Registry (11K+ servers)
2. **Merge** — Cross-source deduplication, unified schema
3. **Rate** — Percentile-based scoring: S (top 5%), A, B, C, D
4. **Categorize** — 23 categories with keyword + fuzzy matching
5. **Seed** — Generate SQL and batch-insert into D1

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with stats, platforms, trending skills |
| `/explore/skills` | Skill marketplace with search, categories, ratings, install modal |
| `/explore/mcp` | MCP Server directory with featured + full catalog |
| `/explore/platforms` | 12 platforms by automation tier |
| `/deploy` | Step-by-step deploy wizard |
| `/arena` | Multi-platform comparison battle |
| `/pricing` | Platform pricing comparison table |
| `/news` | News center with version tracking |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE) -- Maurice Wen

---

<p align="center">
  <sub>Built with Cloudflare Workers, Next.js, and Hono</sub>
</p>
