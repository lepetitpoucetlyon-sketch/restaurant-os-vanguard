import { getDefaultStore } from 'jotai';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { db } from "@/lib/offline/offline-store";
import { 
    StockItem,
    Category,
    Recipe
} from '@/types';
import { 
    stockItemsNodeAtom, 
    categoriesNodeAtom, 
    recipesNodeAtom, 
    updateNexusNode 
} from '@/store/operationalAtoms';

type JotaiStore = ReturnType<typeof getDefaultStore>;

export const SyncStocks = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    logger.debug(`[Sync.Stocks] Initializing for ${tenantId}...`);

    await this.hydrate(store);

    this.private_listeners.stock = Nexus.adapter.onSnapshot(
      path('stockItems'),
      async (data: StockItem[]) => {
        store.set(stockItemsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
        await db.stockItems.bulkPut(data);
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Stocks] Stock Sync Failed', error);
          store.set(stockItemsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.categories = Nexus.adapter.onSnapshot(
      path('categories'),
      (data: Category[]) => {
        store.set(categoriesNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Stocks] Categories Sync Failed', error);
          store.set(categoriesNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.recipes = Nexus.adapter.onSnapshot(
      path('recipes'),
      (data: Recipe[]) => {
        store.set(recipesNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Stocks] Recipes Sync Failed', error);
          store.set(recipesNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  async hydrate(store: JotaiStore) {
    try {
      const stock = await db.stockItems.toArray();
      if (stock.length > 0) {
        store.set(stockItemsNodeAtom, (prev) => updateNexusNode(prev, { data: stock as StockItem[], loading: false }));
      }
    } catch (error) {
      logger.error('[Sync.Stocks] Local Hydration Failed', error);
    }
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub) => {
      if (typeof unsub === 'function') unsub();
    });
    this.private_listeners = {};
  }

};
