'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listCustomers, updateCustomerTier, deleteCustomer, type Customer } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { ErrorState } from '@/components/ui/states';

const fetcher = () => listCustomers();

export default function AdminCustomersPage() {
  const { t } = useI18n();
  const { data, isLoading, error, mutate } = useSWR('customers', fetcher);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleTierChange = async (id: string, tier: string) => {
    setUpdatingId(id);
    try {
      await updateCustomerTier(id, tier);
      await mutate();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this customer?')) return;
    setUpdatingId(id);
    try {
      await deleteCustomer(id);
      await mutate();
    } finally {
      setUpdatingId(null);
    }
  };

  const customers = data?.customers || [];

  return (
    <div className="page-shell py-12 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-3xl font-extrabold text-balance" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: 'var(--on-surface)' }}>Customer Management</h1>
          <p className="text-sm mt-1 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>Managed LLM Proxy Subscribers</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface-container)' }} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          icon="cloud_off"
          title="Failed to load customers"
          description={error.message}
          action={{ label: "Retry", onClick: () => mutate() }}
        />
      ) : (
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--outline-variant)', background: 'var(--surface-container-lowest)' }}>
          <table className="min-w-full divide-y divide-[var(--outline-variant)]">
            <thead style={{ background: 'var(--surface-container-low)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Tier</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Token</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline-variant)]">
              {customers.map(c => (
                <tr key={c.id} className={updatingId === c.id ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-sm" style={{ color: 'var(--on-surface)' }}>{c.name}</div>
                    <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>ID: {c.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={c.tier}
                      onChange={(e) => handleTierChange(c.id, e.target.value)}
                      className="bg-transparent text-xs font-bold border rounded px-2 py-1 outline-none"
                      style={{ borderColor: 'var(--outline-variant)', color: 'var(--primary)' }}
                      disabled={updatingId === c.id}
                    >
                      <option value="basic">BASIC</option>
                      <option value="pro">PRO</option>
                      <option value="enterprise">ENTERPRISE</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-[var(--af-fs-meta)] font-black uppercase" style={{
                      background: c.active ? 'var(--tertiary-container)' : 'var(--error-container)',
                      color: c.active ? 'var(--on-tertiary-container)' : 'var(--on-error-container)'
                    }}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-[var(--af-fs-meta)]" style={{ color: 'var(--on-surface-variant)' }}>
                    {c.token}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs font-bold transition-colors hover:text-[var(--error)]"
                      style={{ color: 'var(--on-surface-variant)' }}
                      disabled={updatingId === c.id || !c.active}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
