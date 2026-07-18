import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' wall page (also covers wall/detail).
export const metadata: Metadata = pageMetadata({
  title: 'Skill Wall',
  description: '卡点墙：匿名登记你在 AI 工作流里遇到的卡点，工作坊战友可以公开回复；解决后会自动汇入蜕变墙。',
  path: '/wall',
});

export default function WallLayout({ children }: { children: React.ReactNode }) {
  return children;
}
