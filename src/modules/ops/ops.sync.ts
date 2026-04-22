import { Nexus } from '@/lib/nexus/NexusAdapter';
import { updateNexusNode } from "@/store/nexusNodeFactory";
import { Order, Table, Reservation, GroupEvent } from '@/types';
import { 
    ordersNodeAtom, 
    tablesNodeAtom
} from './store/orderAtoms';
import { reservationsNodeAtom, groupsNodeAtom } from './store/reservationAtoms';
import { logger } from '@/lib/logger';
import { db } from "@/lib/offline/offline-store";
import { getDefaultStore } from 'jotai';

type JotaiStore = ReturnType<typeof getDefaultStore>;

/**
 * 🍱 Ops Sovereign Sync Service
 * Handles real-time synchronization for Tables, Orders, and Reservations.
 * Critical path for floor and kitchen operations.
 */
export const OpsSyncService = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    
    // Hydrate for zero-latency start in POS/KDS
    await this.hydrate(store);

    // 1. ORDERS SYNC
    this.private_listeners.orders = Nexus.adapter.onSnapshot(
      path('orders'),
      async (data: Order[]) => {
        await db.orders.bulkPut(data);
        store.set(ordersNodeAtom, (prev) => updateNexusNode(prev, {
          data,
          loading: false,
          error: null
        }));
      },
      {
        orderBy: { field: 'updatedAt', direction: 'desc' },
        onError: (error: Error) => {
          logger.error('[OpsSync] Orders Sync Failed', error);
        }
      }
    );

    // 2. TABLES SYNC
    this.private_listeners.tables = Nexus.adapter.onSnapshot(
      path('tables'),
      (data: Table[]) => {
        store.set(tablesNodeAtom, (prev) => updateNexusNode(prev, {
          data,
          loading: false,
          error: null
        }));
      },
      {
        onError: (error: Error) => {
          logger.error('[OpsSync] Tables Sync Failed', error);
        }
      }
    );

    // 3. RESERVATIONS SYNC
    this.private_listeners.reservations = Nexus.adapter.onSnapshot(
      path('reservations'),
      (data: Reservation[]) => {
        store.set(reservationsNodeAtom, (prev) => updateNexusNode(prev, {
          data,
          loading: false,
          error: null
        }));
      },
      {
        onError: (error: Error) => {
          logger.error('[OpsSync] Reservations Sync Failed', error);
        }
      }
    );

    // 4. GROUPS SYNC
    this.private_listeners.groups = Nexus.adapter.onSnapshot(
      path('groups'),
      (data: GroupEvent[]) => {
        store.set(groupsNodeAtom, (prev) => updateNexusNode(prev, {
          data,
          loading: false,
          error: null
        }));
      },
      {
        onError: (error: Error) => {
          logger.error('[OpsSync] Groups Sync Failed', error);
        }
      }
    );
  },

  async hydrate(store: JotaiStore) {
    try {
      const orders = await db.orders.toArray();
      if (orders.length > 0) {
        store.set(ordersNodeAtom, (prev) => updateNexusNode(prev, {
          data: orders,
          loading: false,
          error: null
        }));
      }
    } catch (error) {
      logger.error('[OpsSync] Local Hydration Failed', error);
    }
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub: any) => unsub());
    this.private_listeners = {};
  }
};
