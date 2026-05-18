
'use client';

import { useState, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://openclaw-foundry-api.maoyuan-wen-683.workers.dev';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  auth: boolean;
  tier?: string;
  desc: string;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  example?: string;
  response?: string;
}

const SECTIONS: { title: string; desc: string; endpoints: Endpoint[] }[] = [
  {
    title: 'Skills (Public)',
    desc: 'Browse, search, and filter the curated skill catalog. No authentication required.',
    endpoints: [
      {
        method: 'GET', path: '/api/skills', auth: false,
        desc: 'Search and browse skills with pagination, category/rating filters, and fuzzy search.',
        params: [
          { name: 'search', type: 'string', required: false, desc: 'Fuzzy text search (name, description, author)' },
          { name: 'category', type: 'string', required: false, desc: 'Filter by category (e.g. "Agent 基建")' },
          { name: 'rating', type: 'S|A|B|C|D', required: false, desc: 'Filter by quality rating' },
          { name: 'limit', type: 'number', required: false, desc: 'Page size (1-100, default 50)' },
          { name: 'offset', type: 'number', required: false, desc: 'Pagination offset' },
        ],
        example: `curl '${API_BASE}/api/skills?search=browser&rating=S&limit=5'`,
        response: '{ "meta": {...}, "total": 42, "skills": [{ "name": "...", "rating": "S", "deploySuccessRate": 0.95, "permissionManifest": {...} }] }',
      },
      {
        method: 'GET', path: '/api/skills/categories', auth: false,
        desc: 'Get all categories with skill counts.',
        example: `curl '${API_BASE}/api/skills/categories'`,
        response: '{ "categories": { "Agent 基建": 1649, "搜索与研究": 2440, ... } }',
      },
    ],
  },
  {
    title: 'Deploy Feedback (Public)',
    desc: 'Submit anonymous deployment feedback. Powers the R1 quality flywheel — your feedback directly improves ratings.',
    endpoints: [
      {
        method: 'POST', path: '/api/feedback', auth: false,
        desc: 'Submit deployment feedback for a skill. Anonymous (fingerprint-based dedup). Immediately updates the skill\'s deploy success rate.',
        params: [
          { name: 'skill_id', type: 'string', required: true, desc: 'Skill ID (e.g. "author/skill-name")' },
          { name: 'provider_id', type: 'string', required: false, desc: 'Which platform you deployed on' },
          { name: 'outcome', type: 'success|fail|not_tried', required: true, desc: 'Deployment result' },
          { name: 'comment', type: 'string', required: false, desc: 'One-line feedback' },
        ],
        example: `curl -X POST '${API_BASE}/api/feedback' -H 'Content-Type: application/json' -d '{"skill_id":"pskoett/self-improving-agent","outcome":"success"}'`,
        response: '{ "ok": true }',
      },
      {
        method: 'GET', path: '/api/feedback/stats', auth: false,
        desc: 'Get feedback statistics for a specific skill.',
        params: [
          { name: 'skill_id', type: 'string', required: true, desc: 'Skill ID (query param)' },
        ],
        example: `curl '${API_BASE}/api/feedback/stats?skill_id=pskoett/self-improving-agent'`,
        response: '{ "skillId": "...", "stats": { "success": 12, "fail": 2, "not_tried": 5 }, "total": 19, "successRate": 0.857 }',
      },
    ],
  },
  {
    title: 'Providers & Stats (Public)',
    desc: 'Platform information and aggregate statistics.',
    endpoints: [
      {
        method: 'GET', path: '/api/providers', auth: false,
        desc: 'List all 12 AI agent platforms with metadata.',
        example: `curl '${API_BASE}/api/providers'`,
      },
      {
        method: 'GET', path: '/api/stats', auth: false,
        desc: 'Dashboard aggregate statistics.',
        example: `curl '${API_BASE}/api/stats'`,
      },
      {
        method: 'GET', path: '/api/arena/history', auth: false,
        desc: 'Recent arena comparison results.',
        example: `curl '${API_BASE}/api/arena/history'`,
      },
    ],
  },
  {
    title: 'Tenant Registration',
    desc: 'Register to get an API key for Arsenal API access.',
    endpoints: [
      {
        method: 'POST', path: '/api/tenants/register', auth: false,
        desc: 'Register a new tenant and receive an API key. Free tier: 100 requests/day.',
        params: [
          { name: 'name', type: 'string', required: true, desc: 'Your name or organization' },
          { name: 'email', type: 'string', required: false, desc: 'Contact email' },
        ],
        example: `curl -X POST '${API_BASE}/api/tenants/register' -H 'Content-Type: application/json' -d '{"name":"my-app","email":"dev@example.com"}'`,
        response: '{ "tenant": { "id": "ten_...", "tier": "free" }, "api_key": "ocf_..." }',
      },
    ],
  },
  {
    title: 'Arsenal API (Authenticated)',
    desc: 'Advanced features for power users. Requires Bearer token from tenant registration.',
    endpoints: [
      {
        method: 'GET', path: '/api/arsenal/search', auth: true, tier: 'Free+',
        desc: 'Advanced skill search with permission filtering, success rate thresholds, and stale exclusion.',
        params: [
          { name: 'q', type: 'string', required: false, desc: 'Search query' },
          { name: 'category', type: 'string', required: false, desc: 'Category filter' },
          { name: 'rating', type: 'S|A|B|C|D', required: false, desc: 'Rating filter' },
          { name: 'min_success_rate', type: 'number', required: false, desc: 'Minimum deploy success rate (0.0-1.0)' },
          { name: 'exclude_stale', type: 'true', required: false, desc: 'Exclude stale skills' },
          { name: 'limit', type: 'number', required: false, desc: 'Page size (max 100)' },
        ],
        example: `curl -H 'Authorization: Bearer ocf_YOUR_KEY' '${API_BASE}/api/arsenal/search?q=browser&min_success_rate=0.8&exclude_stale=true'`,
      },
      {
        method: 'GET', path: '/api/arsenal/compare', auth: true, tier: 'Free+',
        desc: 'Skill x Provider compatibility matrix. Shows success/fail rates per platform.',
        params: [
          { name: 'skills', type: 'string', required: true, desc: 'Comma-separated skill IDs' },
        ],
        example: `curl -H 'Authorization: Bearer ocf_YOUR_KEY' '${API_BASE}/api/arsenal/compare?skills=pskoett/self-improving-agent,steipete/Obsidian'`,
        response: '{ "matrix": { "pskoett/self-improving-agent": { "openclaw": { "success": 10, "fail": 1, "rate": 0.91 } } } }',
      },
      {
        method: 'GET', path: '/api/tenants/me', auth: true,
        desc: 'Get your tenant profile and usage stats.',
        example: `curl -H 'Authorization: Bearer ocf_YOUR_KEY' '${API_BASE}/api/tenants/me'`,
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={copy}
      className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-lg text-[var(--af-fs-meta)] font-black uppercase tracking-widest transition-all"
      style={{
        background: copied ? 'var(--tertiary)' : 'var(--surface-container-high)',
        color: copied ? 'white' : 'var(--on-surface-variant)',
      }}
    >
      <span className="material-symbols-outlined text-[var(--af-fs-caption)] font-black">{copied ? 'check' : 'content_copy'}</span>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function ApiDocsPage() {
  const [expandedSection, setExpandedSection] = useState<number>(0);

  return (
    <div className="page-shell py-12 space-y-16">
      {/* Hero */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-2 h-12 rounded-full" style={{ background: 'var(--primary)' }} />
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
              Arsenal API
            </h1>
            <p className="text-lg font-medium opacity-60 max-w-3xl leading-relaxed mt-1 text-pretty">
              Programmatic access to the curated Maurice-verified skill catalog with quality ratings, permission manifests, and deploy feedback.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['REST API', 'JSON responses', 'Rate limited', 'OpenAPI 3.0'].map(tag => (
            <span key={tag} className="px-4 py-1.5 rounded-full text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <aside className="hidden lg:block space-y-8 sticky top-28 self-start">
          <div className="space-y-1">
            <h3 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] mb-4 opacity-40 text-balance">Documentation</h3>
            {SECTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => setExpandedSection(i)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${expandedSection === i ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-sm' : 'opacity-60 hover:opacity-100 hover:bg-[var(--surface-container-low)]'}`}
              >
                {s.title}
              </button>
            ))}
          </div>
          
          <div className="p-6 rounded-[2rem] bg-[var(--surface-container-low)] border border-[var(--outline-variant)] space-y-4">
            <span className="material-symbols-outlined font-black text-[var(--primary)]">support_agent</span>
            <p className="text-xs font-bold leading-relaxed text-pretty">Need help with implementation? Contact our developer support team.</p>
            <a href="#" className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest text-[var(--primary)] hover:underline">Get Support →</a>
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3 space-y-12">
          {/* Quick start */}
          <section className="p-10 rounded-[2.5rem] bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined font-black text-[var(--primary)]">bolt</span>
              <h2 className="text-xl font-black uppercase tracking-widest text-balance">Quick Start</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest opacity-40 text-pretty">1. Register for an API key</p>
                <div className="relative group">
                  <pre className="text-[var(--af-fs-meta)] font-bold overflow-x-auto rounded-2xl p-5 shadow-inner text-pretty" style={{ background: 'var(--af-code-bg-dark)', color: 'var(--af-code-text)' }}>
                    {`curl -X POST '${API_BASE}/api/tenants/register' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"name":"my-app"}'`}
                  </pre>
                  <div className="absolute top-4 right-4"><CopyButton text={`curl -X POST '${API_BASE}/api/tenants/register' -H 'Content-Type: application/json' -d '{"name":"my-app"}'`} /></div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest opacity-40 text-pretty">2. Use the API key to search skills</p>
                <div className="relative group">
                  <pre className="text-[var(--af-fs-meta)] font-bold overflow-x-auto rounded-2xl p-5 shadow-inner text-pretty" style={{ background: 'var(--af-code-bg-dark)', color: 'var(--af-code-text)' }}>
                    {`curl -H 'Authorization: Bearer ocf_YOUR_KEY' \\\n  '${API_BASE}/api/arsenal/search?q=browser&rating=S'`}
                  </pre>
                  <div className="absolute top-4 right-4"><CopyButton text={`curl -H 'Authorization: Bearer ocf_YOUR_KEY' '${API_BASE}/api/arsenal/search?q=browser&rating=S'`} /></div>
                </div>
              </div>
            </div>
          </section>

          {/* Endpoint blocks */}
          <div className="space-y-6">
            {SECTIONS[expandedSection]?.endpoints.map((ep, ei) => (
              <div
                key={ei}
                className="rounded-[2rem] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] shadow-sm overflow-hidden"
              >
                <div className="p-8 space-y-6">
                  {/* Method + Path */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <span
                      className="px-3 py-1 rounded-lg text-[var(--af-fs-meta)] font-black uppercase tracking-widest"
                      style={{
                        background: ep.method === 'POST' ? 'var(--primary-container)' : 'var(--tertiary-container)',
                        color: ep.method === 'POST' ? 'var(--on-primary-container)' : 'var(--on-tertiary-container)',
                      }}
                    >
                      {ep.method}
                    </span>
                    <code className="text-base font-black tracking-tight" style={{ color: 'var(--on-surface)' }}>{ep.path}</code>
                    {ep.auth && (
                      <span className="px-2.5 py-1 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-widest bg-amber-100 text-amber-800 shadow-sm">
                        AUTH {ep.tier || ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-relaxed opacity-70 text-pretty">{ep.desc}</p>

                  {/* Parameters Table */}
                  {ep.params && ep.params.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 text-balance">Parameters</h4>
                      <div className="rounded-2xl border border-[var(--outline-variant)] overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[var(--surface-container-low)]">
                            <tr>
                              <th className="p-4 font-black uppercase tracking-widest opacity-60">Name</th>
                              <th className="p-4 font-black uppercase tracking-widest opacity-60">Type</th>
                              <th className="p-4 font-black uppercase tracking-widest opacity-60">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--outline-variant)] font-medium">
                            {ep.params.map(p => (
                              <tr key={p.name} className="hover:bg-black/5 transition-colors">
                                <td className="p-4"><code className="font-black text-[var(--primary)]">{p.name}</code> {p.required && <span className="ml-1 text-[var(--af-fs-micro)] font-black text-[var(--error)] uppercase">Req</span>}</td>
                                <td className="p-4"><span className="px-2 py-0.5 rounded-md bg-[var(--surface-container-high)] opacity-60 font-black">{p.type}</span></td>
                                <td className="p-4 opacity-70">{p.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Example + Response Tabs */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 text-balance">Request Example</h4>
                      {ep.example && <CopyButton text={ep.example} />}
                    </div>
                    <pre className="text-[var(--af-fs-meta)] font-bold overflow-x-auto rounded-2xl p-5 shadow-inner text-pretty" style={{ background: 'var(--af-code-bg-dark)', color: 'var(--af-code-text)' }}>
                      {ep.example}
                    </pre>
                    
                    {ep.response && (
                      <div className="space-y-4 mt-6">
                        <h4 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 text-balance">Response</h4>
                        <pre className="text-[var(--af-fs-meta)] font-bold overflow-x-auto rounded-2xl p-5 shadow-inner text-pretty" style={{ background: 'var(--af-code-bg-dark)', color: 'var(--af-mint-bg)' }}>
                          {ep.response}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Grid */}
          <section className="space-y-8">
            <h2 className="text-xl font-black uppercase tracking-widest text-center text-balance">API Tiers & Quotas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Free', price: '$0', limit: '100 req/day', color: 'var(--on-surface-variant)' },
                { name: 'Arsenal', price: '$19/mo', limit: '1,000 req/day', color: 'var(--primary)', popular: true },
                { name: 'Arsenal Pro', price: '$49/mo', limit: '10,000 req/day', color: 'var(--secondary)' },
              ].map(tier => (
                <div key={tier.name} className={`p-8 rounded-[2.5rem] text-center border-2 transition-all ${tier.popular ? 'border-[var(--primary)] shadow-xl scale-105 relative' : 'border-[var(--outline-variant)] opacity-80 hover:opacity-100'}`}>
                  {tier.popular && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-[0.2em] bg-[var(--primary)] text-white shadow-lg">Most Popular</span>}
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-40 text-balance">{tier.name}</h3>
                  <p className="text-4xl font-black my-4 text-pretty" style={{ color: tier.color }}>{tier.price}</p>
                  <p className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-60 mb-6 text-pretty">{tier.limit}</p>
                  <button className="w-full py-3 rounded-xl text-[var(--af-fs-meta)] font-black uppercase tracking-widest border border-[var(--outline-variant)] transition-all hover:bg-[var(--surface-container-high)]">Select Plan</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
