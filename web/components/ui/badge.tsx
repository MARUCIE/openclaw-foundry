// Status and type badges matching Foundry Slate design system

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  desktop: { bg: 'var(--primary-fixed)', text: 'var(--surface-tint)' },
  saas: { bg: 'var(--secondary-fixed)', text: 'var(--secondary)' },
  cloud: { bg: '#fff3e0', text: '#e65100' },
  mobile: { bg: 'var(--tertiary-fixed)', text: '#005236' },
  remote: { bg: '#f5f5f5', text: '#616161' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  stable: { bg: 'var(--tertiary-fixed)', text: '#005236' },
  beta: { bg: '#fff8e1', text: '#f57f17' },
  preview: { bg: '#f5f5f5', text: '#616161' },
  // Deploy status
  success: { bg: 'var(--tertiary-fixed)', text: '#005236' },
  running: { bg: 'var(--primary-fixed)', text: 'var(--surface-tint)' },
  pending: { bg: '#f5f5f5', text: '#616161' },
  failed: { bg: 'var(--error-container)', text: 'var(--error)' },
  cancelled: { bg: '#f5f5f5', text: '#616161' },
  done: { bg: 'var(--tertiary-fixed)', text: '#005236' },
  error: { bg: 'var(--error-container)', text: 'var(--error)' },
};

const TYPE_LABELS: Record<string, string> = {
  desktop: '桌面端',
  saas: 'SaaS',
  cloud: '云端',
  mobile: '移动',
  remote: '远程',
};

const STATUS_LABELS: Record<string, string> = {
  stable: '稳定',
  beta: '测试',
  preview: '预览',
  success: '成功',
  running: '进行中',
  pending: '等待中',
  failed: '失败',
  cancelled: '已取消',
  done: '完成',
  error: '错误',
  deploying: '部署中',
  testing: '测试中',
};

export function TypeBadge({ type }: { type: string }) {
  const colors = TYPE_COLORS[type] || TYPE_COLORS.remote;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
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
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: colors.bg, color: colors.text }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
