import { Nexus } from '@/lib/nexus/NexusAdapter';
import { 
  fiscalLedgerNodeAtom, 
  shiftLogsNodeAtom, 
  activeShiftsNodeAtom, 
  leaveRequestsNodeAtom, 
  leaveBalancesNodeAtom,
  shiftsNodeAtom, 
  hygieneLabelsNodeAtom, 
  maintenanceLogsNodeAtom, 
  deliveriesNodeAtom, 
  seoProfileAtom, 
  marketingCampaignsNodeAtom, 
  socialAccountsNodeAtom, 
  quotesNodeAtom, 
  updateNexusNode
} from '@/store/operationalAtoms';
import { logger } from '@/lib/logger';
import { db } from "@/lib/offline/offline-store";
import { MarketingEngine } from "@/lib/marketing-engine";
import { whiteLabelInstanceConfig } from '@/config/instance';

/**
 * 🛡️ Sync.Compliance - Restaurant OS
 * Manages real-time sync for Fiscal, HR, Guard, and Marketing data.
 */
export const SyncCompliance = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: any) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    logger.debug(`[Sync.Compliance] Initializing for ${tenantId}...`);

    await this.hydrate(store);

    // 1. FISCAL SYNC
    this.private_listeners.fiscal = Nexus.adapter.onSnapshot(
      path('fiscalLedger'),
      async (data: any[]) => {
        store.set(fiscalLedgerNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
        await db.fiscalSeals.bulkPut(data as any);
      },
      {
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 50,
        onError: (error: any) => {
          logger.error('[Sync.Compliance] Fiscal Sync Failed', error);
          store.set(fiscalLedgerNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 2. HR SYNC (Shifts & Entries)
    this.private_listeners.hr = Nexus.adapter.onSnapshot(
      path('shiftEntries'),
      (data: any[]) => {
        const entries = Array.isArray(data) ? data : [];
        store.set(shiftLogsNodeAtom, (prev: any) => updateNexusNode(prev, { data: entries, loading: false }));
        
        const activeMap = new Map();
        [...entries].reverse().forEach((entry: any) => {
          if (entry.type === 'CLOCK_IN') activeMap.set(entry.userId, entry);
          else if (entry.type === 'CLOCK_OUT') activeMap.delete(entry.userId);
        });
        store.set(activeShiftsNodeAtom, (prev: any) => updateNexusNode(prev, { data: Array.from(activeMap.values()), loading: false }));
      },
      {
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 100,
        onError: (error: any) => {
          logger.error('[Sync.Compliance] HR Sync Failed', error);
          store.set(shiftLogsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.planned_shifts = Nexus.adapter.onSnapshot(
      path('shifts'),
      (data: any[]) => {
        store.set(shiftsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Compliance] Planned Shifts Sync Failed', error);
          store.set(shiftsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 3. LEAVES SYNC
    this.private_listeners.leaves = Nexus.adapter.onSnapshot(
      path('leaveRequests'),
      (data: any[]) => {
        store.set(leaveRequestsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Compliance] Leaves Sync Failed', error);
          store.set(leaveRequestsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.balances = Nexus.adapter.onSnapshot(
      path('leaveBalances'),
      (data: any[]) => {
        store.set(leaveBalancesNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Compliance] Balances Sync Failed', error);
          store.set(leaveBalancesNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 4. GUARD SYNC (HACCP)
    this.private_listeners.guard = Nexus.adapter.onSnapshot(
      path('hygieneLabels'),
      (data: any[]) => {
        store.set(hygieneLabelsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 100,
        onError: (error: any) => {
          logger.error('[Sync.Compliance] Guard Sync Failed', error);
          store.set(hygieneLabelsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.maintenance = Nexus.adapter.onSnapshot(
      path('maintenanceLogs'),
      (data: any[]) => {
        store.set(maintenanceLogsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'date', direction: 'desc' },
        limit: 100,
        onError: (error: any) => {
          logger.error('[Sync.Compliance] Maintenance Sync Failed', error);
          store.set(maintenanceLogsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 5. SEO & MARKETING
    this.private_listeners.seo = Nexus.adapter.onSnapshot(
      path('seoProfiles'),
      (data: any[]) => {
        const seoData = Array.isArray(data) ? data : [];
        if (seoData.length > 0) {
          store.set(seoProfileAtom, seoData[0]);
        } else {
          const { identityDefaults } = whiteLabelInstanceConfig;
          store.set(seoProfileAtom, {
            id: 'generated-baseline',
            name: identityDefaults.name,
            isVerified: true,
            rating: 4.8,
            analytics: { impressions: 1240, clicks: 342, ctr: 27.5, avgPosition: 3.2, topKeywords: MarketingEngine.getKeywords() }
          });
        }
      },
      {
        onError: (error) => logger.error('[Sync.Compliance] SEO Sync Failed', error)
      }
    );

    this.private_listeners.marketing = Nexus.adapter.onSnapshot(
        path('marketingCampaigns'),
        (data: any[]) => {
          store.set(marketingCampaignsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
        },
        {
          onError: (error) => logger.error('[Sync.Compliance] Marketing Sync Failed', error)
        }
    );

    this.private_listeners.social = Nexus.adapter.onSnapshot(
        path('socialAccounts'),
        (data: any[]) => {
          store.set(socialAccountsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
        },
        {
          onError: (error) => logger.error('[Sync.Compliance] Social Sync Failed', error)
        }
    );

    // 6. QUOTES & DELIVERIES
    this.private_listeners.quotes = Nexus.adapter.onSnapshot(
      path('quotes'),
      (data: any[]) => {
        store.set(quotesNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'updatedAt', direction: 'desc' },
        limit: 100,
        onError: (error: any) => {
          logger.error('[Sync.Compliance] Quotes Sync Failed', error);
          store.set(quotesNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.deliveries = Nexus.adapter.onSnapshot(
      path('deliveries'),
      (data: any[]) => {
        store.set(deliveriesNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'time', direction: 'desc' },
        limit: 50,
        onError: (error: any) => {
          logger.error('[Sync.Compliance] Deliveries Sync Failed', error);
          store.set(deliveriesNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  async hydrate(store: any) {
    try {
      const seals = await db.fiscalSeals.toArray();
      if (seals.length > 0) {
        store.set(fiscalLedgerNodeAtom, (prev: any) => updateNexusNode(prev, { data: seals, loading: false }));
      }
    } catch (error) {
      logger.error('[Sync.Compliance] Local Hydration Failed', error);
    }
  },

  stop() {
    Object.values(this.private_listeners).forEach(unsub => unsub());
    this.private_listeners = {};
  }
};
