'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';

export type Locale = 'en' | 'zh';

const messages: Record<Locale, Record<string, string>> = { en, zh };

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nCtx>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => k,
});

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('ocf-lang');
  if (saved === 'zh' || saved === 'en') return saved;
  return navigator.language.startsWith('zh') ? 'zh' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('ocf-lang', l);
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    let str = messages[locale]?.[key] || messages.en[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
      style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
      title={locale === 'en' ? 'Switch to Chinese' : '切换到英文'}
    >
      {locale === 'en' ? '中文' : 'EN'}
    </button>
  );
}
