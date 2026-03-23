'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

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
      className="shrink-0 px-2 py-1 rounded text-[10px] font-bold transition-all"
      style={{
        background: copied ? '#22c55e' : 'var(--surface-container)',
        color: copied ? '#fff' : 'var(--on-surface-variant)',
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function ApiDocsPage() {
  const { t } = useI18n();
  const [expandedSection, setExpandedSection] = useState<number>(0);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 pb-20">
      {/* Hero */}
      <div className="pt-8 pb-10 space-y-4">
        <h1
          className="text-4xl font-extrabold"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
        >
          Arsenal API
        </h1>
        <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
          Programmatic access to 37,000+ curated skills with quality ratings, permission manifests, and deploy feedback.
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)' }}>
            REST API
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed)' }}>
            JSON responses
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed-variant)' }}>
            Free tier: 100 req/day
          </span>
        </div>
      </div>

      {/* Quick start */}
      <div
        className="p-6 rounded-2xl mb-10"
        style={{ background: 'var(--surface-container-low)', border: '1px solid rgba(195, 198, 215, 0.3)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--on-surface)' }}>Quick Start</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--on-surface-variant)' }}>1. Register for an API key (free)</p>
            <div className="flex items-center gap-2">
              <pre className="flex-1 text-xs overflow-x-auto rounded-lg p-3" style={{ background: '#1e1e2e', color: '#cdd6f4' }}>
                {`curl -X POST '${API_BASE}/api/tenants/register' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"name":"my-app"}'`}
              </pre>
              <CopyButton text={`curl -X POST '${API_BASE}/api/tenants/register' -H 'Content-Type: application/json' -d '{"name":"my-app"}'`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--on-surface-variant)' }}>2. Use the API key to search skills</p>
            <div className="flex items-center gap-2">
              <pre className="flex-1 text-xs overflow-x-auto rounded-lg p-3" style={{ background: '#1e1e2e', color: '#cdd6f4' }}>
                {`curl -H 'Authorization: Bearer ocf_YOUR_KEY' \\\n  '${API_BASE}/api/arsenal/search?q=browser&rating=S'`}
              </pre>
              <CopyButton text={`curl -H 'Authorization: Bearer ocf_YOUR_KEY' '${API_BASE}/api/arsenal/search?q=browser&rating=S'`} />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { name: 'Free', price: '$0', limit: '100 req/day', features: ['Public endpoints', 'Arsenal search', 'Compatibility matrix'] },
          { name: 'Arsenal', price: '$19/mo', limit: '1,000 req/day', features: ['Everything in Free', 'Change alerts email', 'Bulk export', 'Priority support'], popular: true },
          { name: 'Arsenal Pro', price: '$49/mo', limit: '10,000 req/day', features: ['Everything in Arsenal', 'Blueprint AI generation', 'Arena battles', 'Custom webhooks'] },
        ].map(tier => (
          <div
            key={tier.name}
            className="p-5 rounded-2xl relative"
            style={{
              background: tier.popular ? 'var(--primary-fixed)' : 'var(--surface-container-lowest)',
              border: tier.popular ? '2px solid var(--primary)' : '1px solid rgba(195, 198, 215, 0.3)',
            }}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold"
                style={{ background: 'var(--primary)', color: 'white' }}>
                POPULAR
              </span>
            )}
            <h3 className="font-bold text-lg" style={{ color: 'var(--on-surface)' }}>{tier.name}</h3>
            <p className="text-2xl font-extrabold mt-1" style={{ color: 'var(--primary)' }}>{tier.price}</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--on-surface-variant)' }}>{tier.limit}</p>
            <ul className="space-y-2">
              {tier.features.map(f => (
                <li key={f} className="text-sm flex items-center gap-2" style={{ color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)' }}>check</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Endpoint sections */}
      {SECTIONS.map((section, si) => (
        <div key={si} className="mb-8">
          <button
            onClick={() => setExpandedSection(expandedSection === si ? -1 : si)}
            className="w-full flex items-center justify-between py-4 border-b"
            style={{ borderColor: 'var(--outline-variant)' }}
          >
            <div className="text-left">
              <h2 className="font-bold text-lg" style={{ color: 'var(--on-surface)' }}>{section.title}</h2>
              <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{section.desc}</p>
            </div>
            <span
              className="material-symbols-outlined transition-transform"
              style={{ color: 'var(--on-surface-variant)', transform: expandedSection === si ? 'rotate(180deg)' : '' }}
            >
              expand_more
            </span>
          </button>

          {expandedSection === si && (
            <div className="space-y-6 pt-4">
              {section.endpoints.map((ep, ei) => (
                <div
                  key={ei}
                  className="rounded-xl p-5"
                  style={{ background: 'var(--surface-container-lowest)', border: '1px solid rgba(195, 198, 215, 0.2)' }}
                >
                  {/* Method + Path */}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        background: ep.method === 'POST' ? '#dbeafe' : '#dcfce7',
                        color: ep.method === 'POST' ? '#1d4ed8' : '#166534',
                      }}
                    >
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono font-bold" style={{ color: 'var(--on-surface)' }}>{ep.path}</code>
                    {ep.auth && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: '#fef3c7', color: '#92400e' }}>
                        AUTH {ep.tier || ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--on-surface-variant)' }}>{ep.desc}</p>

                  {/* Parameters */}
                  {ep.params && ep.params.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--on-surface-variant)' }}>Parameters</h4>
                      <div className="space-y-1">
                        {ep.params.map(p => (
                          <div key={p.name} className="flex items-start gap-2 text-xs">
                            <code className="font-mono font-bold shrink-0" style={{ color: 'var(--primary)' }}>{p.name}</code>
                            <span className="shrink-0 px-1 py-0.5 rounded" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)', fontSize: '10px' }}>{p.type}</span>
                            {p.required && <span className="shrink-0 text-[10px] font-bold" style={{ color: '#dc2626' }}>required</span>}
                            <span style={{ color: 'var(--on-surface-variant)' }}>{p.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example */}
                  {ep.example && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Example</h4>
                        <CopyButton text={ep.example} />
                      </div>
                      <pre className="text-xs overflow-x-auto rounded-lg p-3" style={{ background: '#1e1e2e', color: '#cdd6f4' }}>
                        {ep.example}
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                  {ep.response && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--on-surface-variant)' }}>Response</h4>
                      <pre className="text-xs overflow-x-auto rounded-lg p-3" style={{ background: '#1e1e2e', color: '#a6e3a1' }}>
                        {ep.response}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Rate limits */}
      <div className="p-6 rounded-2xl mt-8" style={{ background: 'var(--surface-container-low)', border: '1px solid rgba(195, 198, 215, 0.3)' }}>
        <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--on-surface)' }}>Rate Limits</h2>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--on-surface-variant)' }}>
              <th className="text-left py-2 font-medium">Tier</th>
              <th className="text-left py-2 font-medium">Daily Limit</th>
              <th className="text-left py-2 font-medium">Reset</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--on-surface)' }}>
            <tr className="border-t" style={{ borderColor: 'rgba(195, 198, 215, 0.2)' }}>
              <td className="py-2">Public (no auth)</td>
              <td>Unlimited</td>
              <td>--</td>
            </tr>
            <tr className="border-t" style={{ borderColor: 'rgba(195, 198, 215, 0.2)' }}>
              <td className="py-2">Free</td>
              <td>100 requests</td>
              <td>00:00 UTC</td>
            </tr>
            <tr className="border-t" style={{ borderColor: 'rgba(195, 198, 215, 0.2)' }}>
              <td className="py-2">Arsenal ($19/mo)</td>
              <td>1,000 requests</td>
              <td>00:00 UTC</td>
            </tr>
            <tr className="border-t" style={{ borderColor: 'rgba(195, 198, 215, 0.2)' }}>
              <td className="py-2">Arsenal Pro ($49/mo)</td>
              <td>10,000 requests</td>
              <td>00:00 UTC</td>
            </tr>
            <tr className="border-t" style={{ borderColor: 'rgba(195, 198, 215, 0.2)' }}>
              <td className="py-2">Partner</td>
              <td>Unlimited</td>
              <td>--</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
