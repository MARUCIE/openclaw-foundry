'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '仪表盘', icon: 'dashboard' },
  { href: '/catalog', label: '平台目录', icon: 'subscriptions' },
  { href: '/deploy', label: '部署', icon: 'rocket_launch' },
  { href: '/arena', label: '竞技场', icon: 'swords' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 flex flex-col h-screen w-64 z-50"
      style={{ background: 'var(--surface-container-low)', borderRight: '1px solid var(--outline-variant)', borderRightColor: 'transparent' }}>
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--on-surface)', fontFamily: 'Manrope, sans-serif' }}>
          OpenClaw Foundry
        </h1>
        <p className="text-xs font-medium mt-1" style={{ color: 'var(--on-surface-variant)', opacity: 0.6 }}>
          v3.0 Console
        </p>
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: isActive ? 'var(--surface-tint)' : 'var(--on-surface-variant)',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {isActive && (
                <span
                  className="absolute left-0 h-5 w-0.5 rounded-r-full"
                  style={{ background: 'var(--surface-tint)' }}
                />
              )}
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4" style={{ background: 'var(--surface-container)', borderTop: '1px solid var(--outline-variant)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--surface-tint)' }}
          >
            OC
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate" style={{ color: 'var(--on-surface)' }}>Admin User</p>
            <p className="text-[10px] truncate" style={{ color: 'var(--outline)' }}>admin@openclaw.io</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
