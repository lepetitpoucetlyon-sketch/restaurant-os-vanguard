import { useAtom } from 'jotai';
import { stockItemsAtom } from '../store/inventoryAtoms';
import { StockEngine } from '../../../services/StockEngine';
import { logger } from '@/lib/logger';
import { useTenant } from '@/shared/hooks';

/**
 * 🛰️ useStockMapper - Grade VI
 * Internal Mapper for secure stock injections and real-time reconciliation.
 */
export const useStockMapper = () => {
    const [inventory] = useAtom(stockItemsAtom);
    const { tenantId: _tenantId } = useTenant();

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
