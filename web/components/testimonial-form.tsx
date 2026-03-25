'use client';

import { useState, useCallback } from 'react';
import { submitEvent } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export function TestimonialForm({ skillId, onDone }: { skillId: string; onDone: () => void }) {
  const { t } = useI18n();
  const [problem, setProblem] = useState('');
  const [timeBefore, setTimeBefore] = useState('');
  const [timeAfter, setTimeAfter] = useState('');
  const [isUp, setIsUp] = useState(true);
  const [sending, setSending] = useState(false);

  const submit = useCallback(async () => {
    if (!problem.trim() || sending) return;
    setSending(true);
    try {
      await submitEvent(skillId, isUp ? 'review_up' : 'review_down', {
        problem: problem.trim(),
        time_before: timeBefore.trim(),
        time_after: timeAfter.trim(),
      });
      onDone();
    } catch { /* best-effort */ } finally {
      setSending(false);
    }
  }, [skillId, problem, timeBefore, timeAfter, isUp, sending, onDone]);

  const inputStyle = {
    background: 'var(--surface-container-low)',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
  };

  return (
    <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--surface-container-low)' }}>
      <input placeholder={t('skill.solvedProblem')} value={problem} onChange={e => setProblem(e.target.value)} style={inputStyle} />
      <div className="flex gap-3">
        <input placeholder={t('skill.timeBefore')} value={timeBefore} onChange={e => setTimeBefore(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <input placeholder={t('skill.timeAfter')} value={timeAfter} onChange={e => setTimeAfter(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {([true, false] as const).map(up => (
            <button
              key={String(up)}
              onClick={() => setIsUp(up)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: isUp === up ? (up ? '#dcfce7' : '#fee2e2') : 'var(--surface-container)',
                color: isUp === up ? (up ? '#166534' : '#991b1b') : 'var(--on-surface-variant)',
              }}
            >
              <span className="material-symbols-outlined text-base">{up ? 'thumb_up' : 'thumb_down'}</span>
              {up ? t('skill.recommend') : t('skill.notRecommend')}
            </button>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={!problem.trim() || sending}
          className="px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          {sending ? t('skill.submitting') : t('skill.submitRecord2')}
        </button>
      </div>
    </div>
  );
}
