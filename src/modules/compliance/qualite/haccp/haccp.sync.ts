import { Nexus } from '@/lib/nexus/NexusAdapter';
import { HygieneLabel, MaintenanceLog } from '@nexus/contracts';
import type { PlatformVariant } from '@nexus/contracts';


import { logger } from '@/lib/logger';
import { getDefaultStore } from 'jotai';

type JotaiStore = ReturnType<typeof getDefaultStore>;

import { updateNexusNode } from '@/store/nexusNodeFactory';
import { hygieneLabelsNodeAtom, maintenanceLogsNodeAtom } from './store/complianceAtoms';
import { usesCulinaryStock } from '@/verticals/_shared/culinaryProfile';

/**
 * 🛡️ HACCP Sovereign Sync Service
 * Handles real-time synchronization for the Hygiene and Maintenance domain.
 *
 * §8.6 Vague 1 — gate culinaire : les collections `hygieneLabels` et
 * `maintenanceLogs` sont propres au métier alimentaire (chaîne du froid,
 * relevés de température, nettoyage cuisine). Pour une verticale
 * non-culinaire (garage/salon/retail non-food/clinic), ces abonnements
 * Firestore sont inertes. On les gate ici — la surface UI est de son côté
 * gatée par `capabilities.mod_haccp` dans le DNA de chaque verticale.
 */
export const HACCPSyncService = {
  private_listeners: {} as Record<string, () => void>,

  init(tenantId: string, store: JotaiStore, variant: PlatformVariant = 'restaurant') {
    if (!usesCulinaryStock(variant)) {
      // Verticale non-culinaire : rien à synchroniser côté HACCP alimentaire.
      return;
    }
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);

    // 1. HYGIENE LABELS SYNC
    this.private_listeners.hygiene = Nexus.adapter.onSnapshot(
      path('hygieneLabels'),
      (data: HygieneLabel[]) => {
        if (store) store.set(hygieneLabelsNodeAtom, (prev) => updateNexusNode(prev, { data: data || [], loading: false }));
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
      (data: MaintenanceLog[]) => {
        if (store) store.set(maintenanceLogsNodeAtom, (prev) => updateNexusNode(prev, { data: data || [], loading: false }));
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
