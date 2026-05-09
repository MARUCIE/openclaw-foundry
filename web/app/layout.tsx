import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/footer';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Agent Foundry — The Curated AI Agent Skill Marketplace',
  description: '37,000+ vetted AI agent skills. S/A/B/C quality ratings. Deploy to any platform in one click. Workshop-ready toolkit.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <I18nProvider>
          <TopNav />
          <main className="pt-20 min-h-dvh">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
