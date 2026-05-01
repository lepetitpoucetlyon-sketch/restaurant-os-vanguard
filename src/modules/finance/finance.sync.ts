import { Nexus } from '@/lib/nexus/NexusAdapter';
import { updateNexusNode } from "@/store/nexusNodeFactory";
import { FiscalSeal, JournalEntry } from '@nexus/contracts';
import { 
    fiscalLedgerNodeAtom 
} from '@/store/operationalAtoms';
import { logger } from '@/lib/logger';
import { db } from "@/lib/offline/offline-store";
import { getDefaultStore } from 'jotai';

type JotaiStore = ReturnType<typeof getDefaultStore>;

/**
 * 🏛️ Finance Sovereign Sync Service
 * Handles real-time synchronization for the Fiscal Ledger and Journal Entries.
 * Includes local hydration from Dexie for offline integrity.
 */
export const FinanceSyncService = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    
    // 0. HYDRATE FROM LOCAL DB (Zero-latency first paint)
    await this.hydrate(store);

    // 1. FISCAL LEDGER SYNC
    this.private_listeners.fiscal = Nexus.adapter.onSnapshot(
      path('fiscalLedger'),
      async (data: FiscalSeal[]) => {
        // Secure in local storage
        await db.fiscalSeals.bulkPut(data);
      },
      {
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 50,
        onError: (error: Error) => {
          logger.error('[FinanceSync] Fiscal Sync Failed', error);
        }
      }
    );
  },

  async hydrate(store: JotaiStore) {
    try {
      const seals = await db.fiscalSeals.toArray();
      if (seals.length > 0) {
      }
    } catch (error) {
      logger.error('[FinanceSync] Local Hydration Failed', error);
    }
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub: any) => {
        if (typeof unsub === 'function') unsub();
    });
    this.private_listeners = {};
  }
};
