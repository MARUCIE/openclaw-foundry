import type { Metadata } from 'next';

// Server layout co-located with the 'use client' auth/wechat-landing page.
export const metadata: Metadata = { title: 'WeChat Sign-In' };

export default function WechatLandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
