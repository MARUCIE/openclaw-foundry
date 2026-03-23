import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'OpenClaw Foundry — 中国 OpenClaw 生态一站式门户',
  description: '一键部署 AI Agent，12 大平台，一个入口。Skills 市场、MCP 目录、资讯中心。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <TopNav />
        <main className="pt-20 min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
