import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/footer';
import { I18nProvider } from '@/lib/i18n';
import { SITE_URL, SITE_NAME, SITE_TAGLINE, OG_IMAGE } from '@/lib/page-metadata';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

const ROOT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
const ROOT_DESCRIPTION =
  'Curated AI agent skills, locally verified. S/A/B/C quality ratings. Copy install command to any platform in one click. Workshop-ready toolkit.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: ROOT_TITLE,
    template: '%s · Agent Foundry',
  },
  description: ROOT_DESCRIPTION,
  alternates: { canonical: '/' },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: '/',
    title: ROOT_TITLE,
    description: ROOT_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: ROOT_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: ROOT_TITLE,
    description: ROOT_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap"
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
