// Minimal card component matching Foundry Slate design system

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg p-5 ${className}`}
      style={{ background: 'var(--surface-container-lowest)' }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-3">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>{children}</h3>;
}

export function CardValue({ children, color }: { children: React.ReactNode; color?: string }) {
  return <p className="text-3xl font-bold mt-1" style={{ color: color || 'var(--on-surface)' }}>{children}</p>;
}
