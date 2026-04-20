import { getDefaultStore } from 'jotai';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { 
    FiscalSeal,
    ShiftLog,
    Shift,
    LeaveRequest,
    LeaveBalance,
    HygieneLabel,
    MaintenanceLog,
    Delivery,
    SEOProfile,
    MarketingCampaign,
    SocialAccount,
    Quote,
    JournalEntry
} from '@/types';
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

type JotaiStore = ReturnType<typeof getDefaultStore>;

/**
 * 🛡️ Sync.Compliance - Restaurant OS
 * Manages real-time sync for Fiscal, HR, Guard, and Marketing data.
 */
export const SyncCompliance = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    logger.debug(`[Sync.Compliance] Initializing for ${tenantId}...`);

    await this.hydrate(store);

    // 1. FISCAL SYNC
    this.private_listeners.fiscal = Nexus.adapter.onSnapshot(
      path('fiscalLedger'),
      async (data: FiscalSeal[]) => {
        store.set(fiscalLedgerNodeAtom, (prev) => updateNexusNode(prev, { data: data as unknown as JournalEntry[], loading: false }));
        await db.fiscalSeals.bulkPut(data);
      },
      {
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 50,
        onError: (error: Error) => {
          logger.error('[Sync.Compliance] Fiscal Sync Failed', error);
          store.set(fiscalLedgerNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 2. HR SYNC (Shifts & Entries)
    this.private_listeners.hr = Nexus.adapter.onSnapshot(
      path('shiftEntries'),
      (data: ShiftLog[]) => {
        const entries = Array.isArray(data) ? data : [];
        store.set(shiftLogsNodeAtom, (prev) => updateNexusNode(prev, { data: entries, loading: false }));
        
        const activeMap = new Map<string, ShiftLog>();
        [...entries].reverse().forEach((entry) => {
          if (entry.type === 'clock_in') activeMap.set(entry.userId, entry);
          else if (entry.type === 'clock_out') activeMap.delete(entry.userId);
        });
        store.set(activeShiftsNodeAtom, (prev) => updateNexusNode(prev, { data: Array.from(activeMap.values()) as any, loading: false }));
      },
      {
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[Sync.Compliance] HR Sync Failed', error);
          store.set(shiftLogsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.planned_shifts = Nexus.adapter.onSnapshot(
      path('shifts'),
      (data: Shift[]) => {
        store.set(shiftsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Compliance] Planned Shifts Sync Failed', error);
          store.set(shiftsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 3. LEAVES SYNC
    this.private_listeners.leaves = Nexus.adapter.onSnapshot(
      path('leaveRequests'),
      (data: LeaveRequest[]) => {
        store.set(leaveRequestsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Compliance] Leaves Sync Failed', error);
          store.set(leaveRequestsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.balances = Nexus.adapter.onSnapshot(
      path('leaveBalances'),
      (data: LeaveBalance[]) => {
        store.set(leaveBalancesNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Compliance] Balances Sync Failed', error);
          store.set(leaveBalancesNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 4. GUARD SYNC (HACCP)
    this.private_listeners.guard = Nexus.adapter.onSnapshot(
      path('hygieneLabels'),
      (data: HygieneLabel[]) => {
        store.set(hygieneLabelsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[Sync.Compliance] Guard Sync Failed', error);
          store.set(hygieneLabelsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.maintenance = Nexus.adapter.onSnapshot(
      path('maintenanceLogs'),
      (data: MaintenanceLog[]) => {
        store.set(maintenanceLogsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'date', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[Sync.Compliance] Maintenance Sync Failed', error);
          store.set(maintenanceLogsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 5. SEO & MARKETING
    this.private_listeners.seo = Nexus.adapter.onSnapshot(
      path('seoProfiles'),
      (data: SEOProfile[]) => {
        const seoData = Array.isArray(data) ? data : [];
        if (seoData.length > 0) {
          store.set(seoProfileAtom, seoData[0] as any);
        } else {
          const { identityDefaults } = whiteLabelInstanceConfig;
          store.set(seoProfileAtom, {
            id: 'generated-baseline',
            name: identityDefaults.name,
            isVerified: true,
            rating: 4.8,
            analytics: { connected: true, provider: 'nexus', impressions: 1240, clicks: 342, ctr: 27.5, avgPosition: 3.2, topKeywords: MarketingEngine.getKeywords() }
          } as any);
        }
      },
      {
        onError: (error) => logger.error('[Sync.Compliance] SEO Sync Failed', error)
      }
    );

    this.private_listeners.marketing = Nexus.adapter.onSnapshot(
        path('marketingCampaigns'),
        (data: MarketingCampaign[]) => {
          store.set(marketingCampaignsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
        },
        {
          onError: (error) => logger.error('[Sync.Compliance] Marketing Sync Failed', error)
        }
    );

    this.private_listeners.social = Nexus.adapter.onSnapshot(
        path('socialAccounts'),
        (data: SocialAccount[]) => {
          store.set(socialAccountsNodeAtom, (prev) => updateNexusNode(prev, { data: data as unknown as Record<string, unknown>[], loading: false }));
        },
        {
          onError: (error) => logger.error('[Sync.Compliance] Social Sync Failed', error)
        }
    );

    // 6. QUOTES & DELIVERIES
    this.private_listeners.quotes = Nexus.adapter.onSnapshot(
      path('quotes'),
      (data: Quote[]) => {
        store.set(quotesNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'updatedAt', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[Sync.Compliance] Quotes Sync Failed', error);
          store.set(quotesNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.deliveries = Nexus.adapter.onSnapshot(
      path('deliveries'),
      (data: Delivery[]) => {
        store.set(deliveriesNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'time', direction: 'desc' },
        limit: 50,
        onError: (error: Error) => {
          logger.error('[Sync.Compliance] Deliveries Sync Failed', error);
          store.set(deliveriesNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  async hydrate(store: JotaiStore) {
    try {
      const seals = await db.fiscalSeals.toArray();
      if (seals.length > 0) {
        store.set(fiscalLedgerNodeAtom, (prev) => updateNexusNode(prev, { data: seals as unknown as JournalEntry[], loading: false }));
      }
    } catch (error) {
      logger.error('[Sync.Compliance] Local Hydration Failed', error);
    }
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub: any) => {
      if (typeof unsub === 'function') unsub();
    });
    this.private_listeners = {};
  }

};
