// Card components matching Foundry Slate design system (Stitch-aligned)

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{
        background: 'var(--surface-container-lowest)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(198, 198, 205, 0.1)',
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4" style={{ borderBottom: '1px solid var(--surface-container-low)', paddingBottom: '12px' }}>
      <div>{children}</div>
      {action}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-lg font-bold tracking-tight"
      style={{ color: 'var(--on-surface)', fontFamily: 'Manrope, sans-serif' }}
    >
      {children}
    </h3>
  );
}

export function CardValue({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-3xl font-extrabold mt-1"
      style={{ color: color || 'var(--on-surface)', fontFamily: 'Manrope, sans-serif' }}
    >
      {children}
    </p>
  );
}
