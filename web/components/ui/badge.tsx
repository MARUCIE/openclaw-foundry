// Status and type badges matching Foundry Slate design system (Stitch-aligned)

// All hex literals consolidated into globals.css. Two color channels coexist
// intentionally: TYPE_COLORS / STATUS_COLORS use MD3 system role tokens
// (--primary-fixed, --error-container, etc.) for status/type badges tied to
// the design-system palette; the .tag-* utilities in globals.css use semantic
// per-tag bg/fg pairs (amber/mint/violet/...) for content-tag pills. The two
// scopes do not overlap. Reviewer-attributed: Hara R2 P2 (deferred to R3 polish).
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  desktop: { bg: 'var(--primary-fixed)', text: 'var(--on-primary-fixed-variant)' },
  saas: { bg: 'var(--secondary-fixed)', text: 'var(--on-secondary-fixed-variant)' },
  cloud: { bg: 'var(--af-grey-soft)', text: 'var(--af-grey-mid)' },
  mobile: { bg: 'var(--tertiary-fixed)', text: 'var(--on-tertiary-fixed-variant)' },
  remote: { bg: 'var(--af-grey-soft)', text: 'var(--af-grey-mid)' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  stable: { bg: 'var(--tertiary-fixed)', text: 'var(--on-tertiary-fixed-variant)' },
  beta: { bg: 'var(--af-grey-soft)', text: 'var(--af-grey-mid)' },
  preview: { bg: 'var(--af-grey-soft)', text: 'var(--af-grey-mid)' },
  success: { bg: 'var(--tertiary-fixed)', text: 'var(--on-tertiary-fixed-variant)' },
  running: { bg: 'var(--primary-fixed)', text: 'var(--on-primary-fixed-variant)' },
  pending: { bg: 'var(--af-grey-soft)', text: 'var(--af-grey-mid)' },
  failed: { bg: 'var(--error-container)', text: 'var(--error)' },
  cancelled: { bg: 'var(--af-grey-soft)', text: 'var(--af-grey-mid)' },
  done: { bg: 'var(--tertiary-fixed)', text: 'var(--on-tertiary-fixed-variant)' },
  error: { bg: 'var(--error-container)', text: 'var(--error)' },
  deploying: { bg: 'var(--primary-fixed)', text: 'var(--on-primary-fixed-variant)' },
  testing: { bg: 'var(--secondary-fixed)', text: 'var(--on-secondary-fixed-variant)' },
  completed: { bg: 'var(--tertiary-fixed)', text: 'var(--on-tertiary-fixed-variant)' },
};

const TYPE_LABELS: Record<string, string> = {
  desktop: '桌面端', saas: 'SaaS', cloud: '云端', mobile: '移动', remote: '远程',
};

const STATUS_LABELS: Record<string, string> = {
  stable: '稳定', beta: '测试', preview: '预览',
  success: '成功', running: '进行中', pending: '等待中',
  failed: '失败', cancelled: '已取消', done: '完成', error: '错误',
  deploying: '部署中', testing: '测试中', completed: '完成',
};

export function TypeBadge({ type }: { type: string }) {
  const colors = TYPE_COLORS[type] || TYPE_COLORS.remote;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[var(--af-fs-meta)] font-bold"
      style={{ background: colors.bg, color: colors.text }}
    >
      {TYPE_LABELS[type] || type}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[var(--af-fs-meta)] font-bold"
      style={{ background: colors.bg, color: colors.text }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
