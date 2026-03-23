'use client';

import Link from 'next/link';

export function TopBar() {
  return (
    <header
      className="fixed top-0 right-0 left-64 h-16 flex justify-between items-center px-8 z-40"
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(198, 198, 205, 0.3)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: 'var(--outline)' }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="搜索 AI 代理或平台..."
            className="w-full rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all"
            style={{
              background: 'var(--surface-container-low)',
              border: 'none',
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4" style={{ color: 'var(--outline)' }}>
          <button className="transition-colors hover:text-[var(--surface-tint)]">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="transition-colors hover:text-[var(--surface-tint)]">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="transition-colors hover:text-[var(--surface-tint)]">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>

        <div className="h-8 w-px" style={{ background: 'var(--outline-variant)' }} />

        <Link
          href="/deploy"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--surface-tint)' }}
        >
          <span className="material-symbols-outlined text-sm">add</span>
          新建部署
        </Link>
      </div>
    </header>
  );
}
