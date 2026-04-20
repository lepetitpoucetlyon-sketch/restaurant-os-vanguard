import { getDefaultStore } from 'jotai';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { db } from "@/lib/offline/offline-store";
import { 
    Order,
    Table,
    Reservation,
    GroupEvent
} from '@/types';
import { 
    ordersNodeAtom, 
    tablesNodeAtom, 
    reservationsNodeAtom, 
    groupsNodeAtom, 
    updateNexusNode 
} from '@/store/operationalAtoms';

type JotaiStore = ReturnType<typeof getDefaultStore>;

export const SyncOrders = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    logger.debug(`[Sync.Orders] Initializing for ${tenantId}...`);

    await this.hydrate(store);

    this.private_listeners.orders = Nexus.adapter.onSnapshot(
      path('orders'),
      async (data: Order[]) => {
        store.set(ordersNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
        await db.orders.bulkPut(data);
      },
      {
        orderBy: { field: 'updatedAt', direction: 'desc' },
        onError: (error: Error) => {
          logger.error('[Sync.Orders] Orders Sync Failed', error);
          store.set(ordersNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.tables = Nexus.adapter.onSnapshot(
      path('tables'),
      (data: Table[]) => {
        store.set(tablesNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Orders] Tables Sync Failed', error);
          store.set(tablesNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.reservations = Nexus.adapter.onSnapshot(
      path('reservations'),
      (data: Reservation[]) => {
        store.set(reservationsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Orders] Reservations Sync Failed', error);
          store.set(reservationsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.groups = Nexus.adapter.onSnapshot(
      path('groups'),
      (data: GroupEvent[]) => {
        store.set(groupsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Orders] Groups Sync Failed', error);
          store.set(groupsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  async hydrate(store: JotaiStore) {
    try {
      const orders = await db.orders.toArray();
      if (orders.length > 0) {
        store.set(ordersNodeAtom, (prev) => updateNexusNode(prev, { data: orders as Order[], loading: false }));
      }
    } catch (error) {
      logger.error('[Sync.Orders] Local Hydration Failed', error);
    }
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub: any) => {
      if (typeof unsub === 'function') unsub();
    });
    this.private_listeners = {};
  }

};
