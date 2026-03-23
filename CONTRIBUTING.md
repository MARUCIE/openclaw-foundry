# Contributing to OpenClaw Foundry

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up) (for Workers/D1)

### Local Development

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/openclaw-foundry.git
cd openclaw-foundry

# Install dependencies
npm install
cd web && npm install && cd ..
cd worker && npm install && cd ..

# Set up Cloudflare bindings
cp worker/wrangler.toml.example worker/wrangler.toml
# Edit with your D1/KV IDs (see README for setup)

# Start frontend (http://localhost:3200)
cd web && npm run dev

# Start API (http://localhost:8787) — in another terminal
cd worker && npm run dev
```

### Project Structure

```
openclaw-foundry/
├── web/                 # Next.js 15 frontend (CF Pages)
│   ├── app/             # App Router pages
│   ├── components/      # Shared components
│   ├── lib/             # API client, i18n
│   └── messages/        # en.json, zh.json (translations)
├── worker/              # Hono API (CF Workers)
│   └── src/             # Routes, handlers
├── scripts/             # Data pipeline scripts
├── data/                # Processed data (prebuild JSON)
└── .github/workflows/   # CI/CD
```

## How to Contribute

### Adding Translations

1. Edit `web/messages/en.json` and `web/messages/zh.json`
2. Use the `t('key')` function from `useI18n()` hook in components
3. Follow existing key naming: `page.section.element`

### Improving the Data Pipeline

Scripts in `scripts/` handle scraping and processing:
- `scrape-clawhub-api.mjs` — ClawHub API fetcher
- `scrape-mcp-registry.mjs` — MCP Registry fetcher
- `sync-clawhub-skills.mjs` — Rating + categorization
- `merge-all-sources.mjs` — Cross-source deduplication

### Adding New Features

1. Open an issue describing the feature
2. Fork the repo and create a feature branch
3. Make your changes with clear commit messages
4. Submit a PR referencing the issue

## Code Style

- TypeScript strict mode
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Tailwind CSS for styling (no custom CSS classes unless necessary)
- Prefer `const` over `let`, arrow functions, early returns

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(skills): add filter by author
fix(deploy): correct platform selection state
docs: update README with new architecture diagram
chore(ci): upgrade Node.js to v22
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
