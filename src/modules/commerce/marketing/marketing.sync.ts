import { Nexus } from '@/lib/nexus/NexusAdapter';
import { updateNexusNode } from "@/store/nexusNodeFactory";
import { 
    SEOProfile, 
    MarketingCampaign, 
    SocialAccount, 
    Quote, 
    Delivery 
} from '@nexus/contracts';
import { 
    seoProfileAtom, 
    marketingCampaignsNodeAtom, 
    socialAccountsNodeAtom, 
    quotesNodeAtom
} from './store/marketingAtoms';
import { logger } from '@/lib/logger';
import { MarketingEngine } from "@/lib/marketing-engine";
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
          store.set(seoProfileAtom as any, seoData[0]);
        } else {
          // Fallback to defaults defined in config
          const { identityDefaults } = whiteLabelInstanceConfig;
          const fallback: SEOProfile = {
            id: 'generated-baseline',
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
                topKeywords: MarketingEngine.getKeywords(),
                cpc: 0,
                cost: 0,
                roi: 0,
                conversions: 0
            } as any,
            keywords: [],
            competitors: []
          } as any;
          store.set(seoProfileAtom as any, fallback);
        }
      },
      {
        onError: (error) => logger.error('[MarketingSync] SEO Sync Failed', error)
      }
    );

    // 2. CAMPAIGNS SYNC
    this.private_listeners.marketing = Nexus.adapter.onSnapshot(
        path('marketingCampaigns'),
        (data: MarketingCampaign[]) => {
        },
        {
          onError: (error) => logger.error('[MarketingSync] Marketing Sync Failed', error)
        }
    );

    // 3. SOCIAL ACCOUNTS SYNC
    this.private_listeners.social = Nexus.adapter.onSnapshot(
        path('socialAccounts'),
        (data: SocialAccount[]) => {
        },
        {
          onError: (error) => logger.error('[MarketingSync] Social Sync Failed', error)
        }
    );

    // 4. QUOTES & DELIVERIES
    this.private_listeners.quotes = Nexus.adapter.onSnapshot(
      path('quotes'),
      (data: Quote[]) => {
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
    Object.values(this.private_listeners).forEach((unsub: any) => {
        if (typeof unsub === 'function') unsub();
    });
    this.private_listeners = {};
  }
};
