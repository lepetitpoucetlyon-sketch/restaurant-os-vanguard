import { Nexus } from '@/lib/nexus/NexusAdapter';
import { updateNexusNode } from "@/store/nexusNodeFactory";
import { StockItem, Category, Recipe } from '@/types';
import { 
    stockItemsNodeAtom, 
    categoriesNodeAtom, 
    recipesNodeAtom 
} from './store/inventoryAtoms';
import { logger } from '@/lib/logger';
import { db } from "@/lib/offline/offline-store";
import { getDefaultStore } from 'jotai';

type JotaiStore = ReturnType<typeof getDefaultStore>;

/**
 * 📦 Inventory Sovereign Sync Service
 * Handles real-time synchronization for Stock Items, Categories, and Recipes.
 * Ensures the warehouse and cost-control systems are reactive.
 */
export const InventorySyncService = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    
    // Hydrate for zero-latency start in warehouse views
    await this.hydrate(store);

    // 1. STOCK ITEMS SYNC
    this.private_listeners.stock = Nexus.adapter.onSnapshot(
      path('stockItems'),
      async (data: StockItem[]) => {
        await db.stockItems.bulkPut(data);
      },
      {
        onError: (error: Error) => {
          logger.error('[InventorySync] Stock Sync Failed', error);
        }
      }
    );

    // 2. CATEGORIES SYNC
    this.private_listeners.categories = Nexus.adapter.onSnapshot(
      path('categories'),
      (data: Category[]) => {
      },
      {
        onError: (error: Error) => {
          logger.error('[InventorySync] Categories Sync Failed', error);
        }
      }
    );

    // 3. RECIPES SYNC
    this.private_listeners.recipes = Nexus.adapter.onSnapshot(
      path('recipes'),
      (data: Recipe[]) => {
      },
      {
        onError: (error: Error) => {
          logger.error('[InventorySync] Recipes Sync Failed', error);
        }
      }
    );
  },

  async hydrate(store: JotaiStore) {
    try {
      const stock = await db.stockItems.toArray();
      if (stock.length > 0) {
      }
    } catch (error) {
      logger.error('[InventorySync] Local Hydration Failed', error);
    }
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub) => unsub());
    this.private_listeners = {};
  }
};
