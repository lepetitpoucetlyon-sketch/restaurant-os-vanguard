import { Nexus } from '@/lib/nexus/NexusAdapter';
import { HygieneLabel, MaintenanceLog } from '@nexus/contracts';


import { logger } from '@/lib/logger';
import { getDefaultStore } from 'jotai';

type JotaiStore = ReturnType<typeof getDefaultStore>;

/**
 * 🛡️ HACCP Sovereign Sync Service
 * Handles real-time synchronization for the Hygiene and Maintenance domain.
 */
export const HACCPSyncService = {
  private_listeners: {} as Record<string, () => void>,

  init(tenantId: string, _store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    
    // 1. HYGIENE LABELS SYNC
    this.private_listeners.hygiene = Nexus.adapter.onSnapshot(
      path('hygieneLabels'),
      (_data: HygieneLabel[]) => {
      },
      {
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[HACCPSync] Hygiene Labels Sync Failed', error);
        }
      }
    );

    // 2. MAINTENANCE LOGS SYNC
    this.private_listeners.maintenance = Nexus.adapter.onSnapshot(
      path('maintenanceLogs'),
      (_data: MaintenanceLog[]) => {
      },
      {
        orderBy: { field: 'date', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[HACCPSync] Maintenance Logs Sync Failed', error);
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
