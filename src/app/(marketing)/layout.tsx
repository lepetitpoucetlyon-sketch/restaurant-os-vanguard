import { Suspense, type ReactNode } from 'react';
import type { Metadata } from 'next';
import { MarketingHeader } from './components/MarketingHeader';
import { MarketingFooter } from './components/MarketingFooter';
import { AnalyticsProvider } from './components/AnalyticsProvider';

export const metadata: Metadata = {
  title: {
    default: 'Restaurant OS — Le système d\'exploitation des commerces indépendants',
    template: '%s | Restaurant OS',
  },
  description: 'Logiciel de caisse certifié NF525. POS tactile, analytics temps réel, mode hors ligne. Pour restaurants, boulangeries, salons, hôtels et plus.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://restaurant-os.fr'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Restaurant OS',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-min-h-[100dvh] bg-[#0A0A0F] text-white font-sans antialiased">
      <Suspense fallback={null}>
        <AnalyticsProvider>
          <MarketingHeader />
          <main>{children}</main>
          <MarketingFooter />
        </AnalyticsProvider>
      </Suspense>
    </div>
  );
}
