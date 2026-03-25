import { SEVERITY_STYLES } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';

export interface PermItem {
  icon: string;
  label: string;
  detail: string;
  severity: 'safe' | 'warn' | 'danger';
}

export function parsePermissions(pm: Record<string, unknown>, t: (k: string) => string): PermItem[] {
  const items: PermItem[] = [];
  const net = pm.network_access as string | undefined;
  if (net === 'full') items.push({ icon: 'language', label: t('skill.perm.networkAccess'), detail: t('skill.perm.fullNetwork'), severity: 'danger' });
  else if (net === 'outbound_only') items.push({ icon: 'cloud_upload', label: t('skill.perm.networkAccess'), detail: t('skill.perm.outboundOnly'), severity: 'warn' });
  else if (net) items.push({ icon: 'lock', label: t('skill.perm.networkAccess'), detail: String(net), severity: 'safe' });

  const fs = pm.filesystem_access as string | undefined;
  if (fs === 'write') items.push({ icon: 'edit_document', label: t('skill.perm.filesystem'), detail: t('skill.perm.readWrite'), severity: 'danger' });
  else if (fs === 'read') items.push({ icon: 'folder_open', label: t('skill.perm.filesystem'), detail: t('skill.perm.readOnly'), severity: 'warn' });
  else items.push({ icon: 'folder_off', label: t('skill.perm.filesystem'), detail: t('skill.perm.noAccess'), severity: 'safe' });

  if (pm.shell_execution) items.push({ icon: 'terminal', label: t('skill.perm.shellExec'), detail: t('skill.perm.canExecShell'), severity: 'danger' });

  const sens = pm.data_sensitivity as string | undefined;
  if (sens === 'confidential') items.push({ icon: 'shield', label: t('skill.perm.dataSensitivity'), detail: t('skill.perm.confidential'), severity: 'danger' });
  else if (sens === 'internal') items.push({ icon: 'shield', label: t('skill.perm.dataSensitivity'), detail: t('skill.perm.internal'), severity: 'warn' });
  else if (sens) items.push({ icon: 'verified_user', label: t('skill.perm.dataSensitivity'), detail: t('skill.perm.publicOnly'), severity: 'safe' });

  return items;
}

export function PermissionDisplay({ permItems }: { permItems: PermItem[] }) {
  const { t } = useI18n();

  if (permItems.length === 0) {
    return (
      <div className="py-6 text-center rounded-2xl" style={{ background: 'var(--surface-container-low)' }}>
        <span className="material-symbols-outlined text-2xl mb-2 block" style={{ color: 'var(--outline)' }}>info</span>
        <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.permissionsEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {permItems.map((item, i) => {
        const sty = SEVERITY_STYLES[item.severity];
        return (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: sty.bg }}>
            <span className="material-symbols-outlined text-xl" style={{ color: sty.color }}>{item.icon}</span>
            <div>
              <div className="text-sm font-bold" style={{ color: sty.color }}>{item.label}</div>
              <div className="text-xs" style={{ color: sty.color, opacity: 0.8 }}>{item.detail}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
