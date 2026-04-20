import { Nexus } from '@/lib/nexus/NexusAdapter';
import { HygieneLabel, MaintenanceLog } from '@/types';
import { 
    hygieneLabelsNodeAtom, 
    maintenanceLogsNodeAtom, 
    updateNexusNode 
} from '@/store/operationalAtoms';
import { logger } from '@/lib/logger';
import { getDefaultStore } from 'jotai';

type JotaiStore = ReturnType<typeof getDefaultStore>;

/**
 * 🛡️ HACCP Sovereign Sync Service
 * Handles real-time synchronization for the Hygiene and Maintenance domain.
 */
export const HACCPSyncService = {
  private_listeners: {} as Record<string, () => void>,

  init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    
    // 1. HYGIENE LABELS SYNC
    this.private_listeners.hygiene = Nexus.adapter.onSnapshot(
      path('hygieneLabels'),
      (data: HygieneLabel[]) => {
        store.set(hygieneLabelsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[HACCPSync] Hygiene Labels Sync Failed', error);
          store.set(hygieneLabelsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 2. MAINTENANCE LOGS SYNC
    this.private_listeners.maintenance = Nexus.adapter.onSnapshot(
      path('maintenanceLogs'),
      (data: MaintenanceLog[]) => {
        store.set(maintenanceLogsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        orderBy: { field: 'date', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[HACCPSync] Maintenance Logs Sync Failed', error);
          store.set(maintenanceLogsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub) => unsub());
    this.private_listeners = {};
  }
};
