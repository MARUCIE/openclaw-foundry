import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' breakthroughs page.
export const metadata: Metadata = pageMetadata({
  title: 'Breakthroughs',
  description: '蜕变墙：工作坊战友公开的 AI 工作流蜕变案例，把卡点翻成蜕变；起点是卡点墙，解决后自动汇聚到这里。',
  path: '/breakthroughs',
});

export default function BreakthroughsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
