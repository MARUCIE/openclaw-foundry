// Shared empty / error / loading states for API-driven pages

interface StateProps {
  icon: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-xl" style={{ background: 'var(--surface-container-lowest)' }}>
      <span className="material-symbols-outlined text-5xl mb-4" style={{ color: 'var(--outline)' }}>{icon}</span>
      <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{title}</p>
      {description && <p className="text-xs mt-1" style={{ color: 'var(--outline)' }}>{description}</p>}
    </div>
  );
}

export function ErrorState({ icon, title, description, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 rounded-xl" style={{ background: 'var(--surface-container-lowest)', border: '1px dashed var(--error, #dc2626)' }}>
      <span className="material-symbols-outlined text-4xl mb-3" style={{ color: 'var(--error, #dc2626)' }}>{icon}</span>
      <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>{title}</p>
      {description && <p className="text-xs mb-4" style={{ color: 'var(--on-surface-variant)' }}>{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function SkeletonGrid({ count = 6, height = 'h-44' }: { count?: number; height?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} rounded-xl skeleton-shimmer`} />
      ))}
    </div>
  );
}
