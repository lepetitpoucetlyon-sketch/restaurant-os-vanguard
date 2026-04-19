import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { db } from "@/lib/offline/offline-store";
import { 
    stockItemsNodeAtom, 
    categoriesNodeAtom, 
    recipesNodeAtom, 
    updateNexusNode 
} from '@/store/operationalAtoms';

export const SyncStocks = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: any) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    logger.debug(`[Sync.Stocks] Initializing for ${tenantId}...`);

    await this.hydrate(store);

    this.private_listeners.stock = Nexus.adapter.onSnapshot(
      path('stockItems'),
      async (data: any[]) => {
        store.set(stockItemsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
        await db.stockItems.bulkPut(data as any);
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Stocks] Stock Sync Failed', error);
          store.set(stockItemsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.categories = Nexus.adapter.onSnapshot(
      path('categories'),
      (data: any[]) => {
        store.set(categoriesNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Stocks] Categories Sync Failed', error);
          store.set(categoriesNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.recipes = Nexus.adapter.onSnapshot(
      path('recipes'),
      (data: any[]) => {
        store.set(recipesNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Stocks] Recipes Sync Failed', error);
          store.set(recipesNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  async hydrate(store: any) {
    try {
      const stock = await db.stockItems.toArray();
      if (stock.length > 0) {
        store.set(stockItemsNodeAtom, (prev: any) => updateNexusNode(prev, { data: stock, loading: false }));
      }
    } catch (error) {
      logger.error('[Sync.Stocks] Local Hydration Failed', error);
    }
  },

  stop() {
    Object.values(this.private_listeners).forEach(unsub => unsub());
    this.private_listeners = {};
  }
};
