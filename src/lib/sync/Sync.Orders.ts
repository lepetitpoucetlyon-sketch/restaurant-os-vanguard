// @ts-nocheck
// @ts-nocheck
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { db } from "@/lib/offline/offline-store";
import { 
    ordersNodeAtom, 
    tablesNodeAtom, 
    reservationsNodeAtom, 
    groupsNodeAtom, 
    updateNexusNode 
} from '@/store/operationalAtoms';

export const SyncOrders = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: any) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    logger.debug(`[Sync.Orders] Initializing for ${tenantId}...`);

    await this.hydrate(store);

    this.private_listeners.orders = Nexus.adapter.onSnapshot(
      path('orders'),
      async (data: any[]) => {
        store.set(ordersNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
        await db.orders.bulkPut(data as any);
      },
      {
        orderBy: { field: 'updatedAt', direction: 'desc' },
        onError: (error: any) => {
          logger.error('[Sync.Orders] Orders Sync Failed', error);
          store.set(ordersNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.tables = Nexus.adapter.onSnapshot(
      path('tables'),
      (data: any[]) => {
        store.set(tablesNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Orders] Tables Sync Failed', error);
          store.set(tablesNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.reservations = Nexus.adapter.onSnapshot(
      path('reservations'),
      (data: any[]) => {
        store.set(reservationsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error) => {
          logger.error('[Sync.Orders] Reservations Sync Failed', error);
          store.set(reservationsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.groups = Nexus.adapter.onSnapshot(
      path('groups'),
      (data: any[]) => {
        store.set(groupsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error) => {
          logger.error('[Sync.Orders] Groups Sync Failed', error);
          store.set(groupsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  async hydrate(store: any) {
    try {
      const orders = await db.orders.toArray();
      if (orders.length > 0) {
        store.set(ordersNodeAtom, (prev: any) => updateNexusNode(prev, { data: orders, loading: false }));
      }
    } catch (error) {
      logger.error('[Sync.Orders] Local Hydration Failed', error);
    }
  },

  stop() {
    Object.values(this.private_listeners).forEach(unsub => unsub());
    this.private_listeners = {};
  }
};
