import { Nexus } from '@/lib/nexus/NexusAdapter';
import { 
    Campaign, 
    SocialAccount, 
    Quote 
} from '@nexus/contracts';
import { SEOProfile } from './seo.types';
import { updateNexusNode } from '@/store/nexusNodeFactory';
import { 
    seoProfileAtom,
    marketingCampaignsNodeAtom,
    socialAccountsNodeAtom,
    quotesNodeAtom
} from './store/marketingAtoms';
import { logger } from '@/lib/logger';
import { MarketingEngine } from './marketing-engine';
import { whiteLabelInstanceConfig } from '@/config/instance';
import { getDefaultStore } from 'jotai';

type JotaiStore = ReturnType<typeof getDefaultStore>;

/**
 * 📢 Marketing Sovereign Sync Service
 * Handles real-time synchronization for SEO Profiles, Campaigns, Social, and CRM.
 */
export const MarketingSyncService = {
  private_listeners: {} as Record<string, () => void>,

  init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    
    // 1. SEO & IDENTITY SYNC
    this.private_listeners.seo = Nexus.adapter.onSnapshot(
      path('seoProfiles'),
      (data: SEOProfile[]) => {
        const seoData = Array.isArray(data) ? data : [];
        if (seoData.length > 0) {
          store.set(seoProfileAtom, seoData[0]);
        } else {
          // Fallback to defaults defined in config
          const { identityDefaults } = whiteLabelInstanceConfig;
          const fallback: SEOProfile = {
            id: 'generated-baseline',
            establishmentId: 'DEFAULT',
            name: identityDefaults.name,
            isVerified: true,
            rating: 4.8,
            analytics: { 
                connected: true, 
                provider: 'nexus', 
                impressions: 1240, 
                clicks: 342, 
                ctr: 27.5, 
                avgPosition: 3.2, 
                topKeywords: MarketingEngine.getKeywords ? MarketingEngine.getKeywords() : [],
                conversions: 0
            },
            site: {
                title: identityDefaults.name,
                titleTemplate: `%s | ${identityDefaults.name}`,
                description: "Sovereign Restaurant Experience",
                keywords: [],
                language: 'fr',
                locale: 'fr_FR'
            },
            organization: {
                name: identityDefaults.name,
                description: "Sovereign Restaurant",
                logo: '',
                logoSquare: '',
                contact: { telephone: '', email: '' },
                address: { street: '', city: '', postalCode: '', country: 'France' },
                geo: { latitude: 0, longitude: 0 },
                socialProfiles: {}
            },
            restaurant: {
                cuisineTypes: [],
                priceRange: '€€',
                acceptsReservations: true,
                openingHours: [],
                services: { dineIn: true, takeaway: true, delivery: false, outdoorSeating: false, wifi: true, parking: false, wheelchairAccessible: true }
            },
            technical: {
                canonicalDomain: '',
                trailingSlash: true,
                robots: { index: true, follow: true },
                sitemap: { enabled: true, frequency: 'weekly' }
            },
            integrations: {
                googleAnalytics: { measurementId: '' },
                googleTagManager: { containerId: '' },
                googleSearchConsole: { verified: false },
                googleBusinessProfile: { linked: false },
                facebookPixel: { pixelId: '' }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          store.set(seoProfileAtom, fallback);
        }
      },
      {
        onError: (error: Error) => logger.error('[MarketingSync] SEO Sync Failed', error)
      }
    );

    // 2. CAMPAIGNS SYNC
    this.private_listeners.marketing = Nexus.adapter.onSnapshot(
        path('marketingCampaigns'),
        (data: Campaign[]) => {
          if (store) store.set(marketingCampaignsNodeAtom, (prev) => updateNexusNode(prev, { data: (data as any) || [], loading: false }));
        },
        {
          onError: (error: Error) => logger.error('[MarketingSync] Marketing Sync Failed', error)
        }
    );

    // 3. SOCIAL ACCOUNTS SYNC
    this.private_listeners.social = Nexus.adapter.onSnapshot(
        path('socialAccounts'),
        (data: SocialAccount[]) => {
          if (store) store.set(socialAccountsNodeAtom, (prev) => updateNexusNode(prev, { data: (data as any) || [], loading: false }));
        },
        {
          onError: (error: Error) => logger.error('[MarketingSync] Social Sync Failed', error)
        }
    );

    // 4. QUOTES & DELIVERIES
    this.private_listeners.quotes = Nexus.adapter.onSnapshot(
      path('quotes'),
      (data: Quote[]) => {
        if (store) store.set(quotesNodeAtom, (prev) => updateNexusNode(prev, { data: (data as any) || [], loading: false }));
      },
      {
        orderBy: { field: 'updatedAt', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[MarketingSync] Quotes Sync Failed', error);
        }
      }
    );
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub: unknown) => {
        if (typeof unsub === 'function') unsub();
    });
    this.private_listeners = {};
  }
};
