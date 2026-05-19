'use client';

import type { ConfigPack } from '@/lib/api';
import type { Locale } from '@/lib/i18n';

export interface LocalizedPackPreview {
  name: string;
  description: string;
  line: string;
  fileCount: number;
}

export function localizePackPreview(pack: ConfigPack, locale: Locale): LocalizedPackPreview {
  return {
    name: locale === 'zh' ? pack.nameZh : pack.name,
    description: locale === 'zh' ? pack.descriptionZh : pack.description,
    line: locale === 'zh' ? pack.lineZh : pack.line,
    fileCount: pack.files?.length || 0,
  };
}
