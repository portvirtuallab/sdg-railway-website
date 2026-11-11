import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { SimulationNotice } from '@/components/SimulationNotice';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getNavigation } from '@/lib/site-map';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description:
    'SDG Railway is the simulated rail freight operator of Port Virtual Lab, developed by Escola Europea – Intermodal Transport for education and professional training.',
  openGraph: { siteName: SITE_NAME, type: 'website', locale: 'en_GB' },
  // Preview builds must not be indexed until the owner approves the production transition.
  robots:
    process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#062659' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white font-sans antialiased">
        <a
          href="#main-content"
          className="text-railway-blue-900 sr-only z-50 bg-white px-4 py-2 font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          Skip to main content
        </a>
        <SiteHeader navigation={getNavigation()} />
        <SimulationNotice />
        <main id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
