import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenClaw Foundry Console',
  description: 'Universal AI Agent Deployment Platform — 13 Platforms, One Blueprint',
};

const NAV_ITEMS = [
  { href: '/', label: '仪表盘', icon: '◆' },
  { href: '/catalog', label: '平台目录', icon: '▤' },
  { href: '/deploy', label: '部署', icon: '▶' },
  { href: '/arena', label: '竞技场', icon: '⚔' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 flex flex-col" style={{ background: 'var(--surface-container-low)' }}>
          <div className="p-5 pb-8">
            <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>
              OpenClaw Foundry
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>v3.0 Console</p>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--primary-fixed)]"
                style={{ color: 'var(--on-surface)' }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 text-xs" style={{ color: 'var(--outline)' }}>
            13 platforms / 7 IM channels
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
