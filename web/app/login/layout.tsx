import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' login page.
export const metadata: Metadata = pageMetadata({
  title: 'Sign In',
  description: '注册 / 登录 Agent Foundry：邮箱免密魔法链接，或微信扫码注册；无需设置密码，链接 15 分钟内一次性有效。',
  path: '/login',
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
