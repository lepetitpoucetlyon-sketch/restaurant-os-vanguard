import { useAtom } from 'jotai';
import { stockItemsAtom } from '@/modules/inventory/store/inventoryAtoms';
import { StockEngine } from '@/domain/services/StockEngine';
import { logger } from '@/lib/logger';
import { useTenant } from '@/engines/core/NexusCoreProvider';

/**
 * 🛰️ useStockBridge - Grade VI
 * Bridge for secure stock injections and real-time reconciliation.
 */
export const useStockBridge = () => {
    const [inventory] = useAtom(stockItemsAtom);
    const { tenantId } = useTenant();

    const injectQuantities = async (receptionId: string, item: import('@/types').Ingredient, data: Parameters<typeof StockEngine.processReception>[1]) => {
        logger.info(`[StockBridge] Injecting reception ${receptionId} into Nexus`);
        try {
            return await StockEngine.processReception(item, data);
        } catch (error) {
            logger.error(`[StockBridge] Injection failed:`, error);
            throw error;
        }
    };

    return {
        inventory,
        actions: {
            injectQuantities
        }
    };
};
