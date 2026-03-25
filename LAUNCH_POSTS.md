# OpenClaw Foundry Launch Posts

Copy-paste ready for each platform.

---

## X/Twitter Thread (7 tweets)

### Tweet 1 (hook — post this first)

```
The OpenClaw ecosystem has 250K stars and just had a malicious skill crisis.

I built the curated alternative. 37,000+ vetted AI agent skills. S/A/B/C quality ratings. Zero VPS — runs on Cloudflare free tier. MIT.

GitHub: github.com/MARUCIE/openclaw-foundry
Live: openclaw-foundry.pages.dev

Thread below with details:
```

### Tweet 2 (reply to Tweet 1)

```
OpenClaw Foundry is a skill marketplace — 37,000+ AI agent skills from ClawHub and MCP Registry, rated S/A/B/C by quality before they go live.

Not "all skills." Vetted skills.

That is the whole idea.
```

### Tweet 3 (reply to Tweet 2)

```
Architecture decision: zero VPS.

- Cloudflare Pages (frontend, Next.js 15)
- Cloudflare Workers + Hono (API)
- Cloudflare D1 (SQLite at the edge)
- GitHub Actions daily auto-sync

Free tier covers all of it. No server to maintain.
```

### Tweet 4 (reply to Tweet 3)

```
23 skill categories. 12 deployment platforms.

S/A/B/C quality ratings — S means production-ready, tested, safe dependencies. C means it exists and probably works.

You can filter by both. Deploy in one click.
```

### Tweet 5 (reply to Tweet 4)

```
The security crisis in the OpenClaw ecosystem was a real problem.

Malicious skills designed to look legitimate. Users had no way to tell the difference without reading source.

Foundry's job is to read it so you do not have to.
```

### Tweet 6 (reply to Tweet 5)

```
Bilingual — English and Chinese — because most of the OpenClaw ecosystem is Chinese-first and the tooling usually is not.

Daily sync means skills added upstream today show up here tomorrow.
```

### Tweet 7 (reply to Tweet 6)

```
github.com/MARUCIE/openclaw-foundry
Live: openclaw-foundry.pages.dev

MIT. Self-hostable on any Cloudflare account.
The rating rubric is in the repo. Disagree with a rating? Open a PR.
```

---

## Hacker News

### Title

```
Show HN: OpenClaw Foundry - Curated AI agent skill marketplace on Cloudflare (zero VPS)
```

### Body

```
After the OpenClaw security incident earlier this year, I wanted a place where I could find agent skills without wondering if something was going to exfiltrate my tokens. Nothing existed, so I built it.

OpenClaw Foundry is a curated, rated index of 37,000+ skills from ClawHub and MCP Registry. Every skill gets an S/A/B/C quality rating before it goes in. The goal is not to be comprehensive - it is to be trustworthy.

Technical decisions I made and why:

- Zero VPS. Runs entirely on Cloudflare Pages, Workers, and D1. The free tier covers the whole thing. I did not want to maintain infrastructure for a side project.
- Daily auto-sync via GitHub Actions. New skills from ClawHub and MCP Registry are pulled, reviewed against the rating rubric, and pushed to D1 every 24 hours.
- Hono on Workers for the API. Lightweight, TypeScript-native, deploys in under 10 seconds.
- Next.js 15 + React 19 + Tailwind v4 on Pages. Bilingual - English and Chinese - because the OpenClaw ecosystem skews heavily toward Chinese developers.
- 23 categories, 12 supported deployment platforms.

What I am still figuring out: the rating rubric is manual right now. I want to automate the B/C tier scoring using static analysis and dependency scanning, but I have not gotten there yet. Pull requests welcome.

GitHub: https://github.com/MARUCIE/openclaw-foundry
Live: https://openclaw-foundry.pages.dev
MIT license.
```

---

## Reddit r/selfhosted

### Title

```
I built a self-hosted AI agent skill marketplace that runs entirely on Cloudflare free tier - no VPS required
```

### Body

```
This community cares about running things yourself without depending on someone else's server. OpenClaw Foundry is built around that constraint.

**What it is**

A curated marketplace for AI agent skills — tools that extend what LLM agents can do. Pulls from ClawHub and MCP Registry (37,000+ skills total), rates each one S/A/B/C for quality, and lets you browse by category or deployment platform.

**Why zero VPS matters here**

I wanted something I could hand off to anyone in this community and have them running their own instance in under 10 minutes. VPS means a monthly bill, a server to patch, and a single point of failure. Cloudflare free tier means none of that.

The full stack:

- Cloudflare Pages for the Next.js 15 frontend
- Cloudflare Workers + Hono for the API layer
- Cloudflare D1 for the SQLite database at the edge
- GitHub Actions for the daily sync pipeline

**Self-hosting your own instance**

Fork the repo, add your Cloudflare account ID and API token to GitHub secrets, and push. GitHub Actions deploys Pages and Workers automatically. The D1 database is provisioned by the deploy script. Daily sync runs via a cron action.

No Docker. No compose file. No ports to open. The CF free tier limits are not close to being hit at 37,000 records.

**Why I built it**

The OpenClaw ecosystem had a security incident — malicious skills were found in the wild, designed to look legitimate. I wanted a vetted alternative where every skill has been looked at before it goes in.

**Links**

- GitHub: https://github.com/MARUCIE/openclaw-foundry (MIT)
- Live demo: https://openclaw-foundry.pages.dev

The rating rubric is documented in the repo. Happy to answer questions about the Cloudflare architecture.
```

---

## Reddit r/LocalLLaMA

### Title

```
Built a curated MCP skill marketplace after the OpenClaw security incident - 37K skills rated S/A/B/C, runs on CF free tier
```

### Body

```
If you have been building local LLM pipelines with tool use, you have probably run into OpenClaw or MCP Registry. The ecosystem is huge — 250K stars — but the security incident a few months back raised a real question: how do you know a skill is safe before you give it access to your local environment?

OpenClaw Foundry is my answer to that.

**What it does**

Aggregates skills from ClawHub and MCP Registry, runs them through a quality rubric, assigns S/A/B/C ratings, and makes them browsable by category and deployment platform. 37,000+ skills across 23 categories, 12 supported platforms.

**MCP integration**

Skills in the MCP category are tagged and filterable. If you are running a local agent stack with MCP tooling — Ollama, LM Studio, anything with an MCP client — you can filter to your platform and get a list of vetted, rated options. No more grepping through the ClawHub registry hoping nothing is malicious.

**The rating system**

- S: Production-ready. Clean dependencies, tested, no suspicious network calls.
- A: Solid. Minor issues, still safe to use.
- B: Functional. Use with awareness of limitations.
- C: Exists. Probably works. Review before production.

The rubric is in the repo. The goal is not to be exhaustive — it is to give you a starting signal so you are not reading source code for every skill you want to try.

**Tech for the curious**

Zero VPS: Cloudflare Pages + Workers + D1 + GitHub Actions. Daily auto-sync from upstream registries. The whole thing costs nothing to run.

**Links**

- GitHub: https://github.com/MARUCIE/openclaw-foundry (MIT)
- Live: https://openclaw-foundry.pages.dev

Would genuinely welcome feedback from people doing serious local agent work on whether the rating categories map to how you actually evaluate skills.
```

---

## Product Hunt Tagline

```
Curated AI agent skills — vetted, rated, zero VPS.
```
