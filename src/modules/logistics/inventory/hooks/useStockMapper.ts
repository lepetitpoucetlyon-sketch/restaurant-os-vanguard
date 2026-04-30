import { useAtom } from 'jotai';
import { stockItemsAtom } from '@modules/logistics/inventory/store/inventoryAtoms';
import { StockEngine } from '@domain/services/StockEngine';
import { logger } from '@/lib/logger';
import { useTenant } from '@/engines/core/NexusCoreProvider';

/**
 * 🛰️ useStockMapper - Grade VI
 * Internal Mapper for secure stock injections and real-time reconciliation.
 */
export const useStockMapper = () => {
    const [inventory] = useAtom(stockItemsAtom);
    const { tenantId } = useTenant();

    const injectQuantities = async (receptionId: string, item: import('@nexus/contracts').Ingredient, data: Parameters<typeof StockEngine.processReception>[1]) => {
        logger.info(`[StockMapper] Injecting reception ${receptionId} into Nexus`);
        try {
            return await StockEngine.processReception(item, data);
        } catch (error) {
            logger.error(`[StockMapper] Injection failed:`, error);
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
