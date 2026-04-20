import { useAtom } from 'jotai';
import { stockItemsAtom } from '@/store/inventoryAtoms';
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

    const injectQuantities = async (receptionId: string, item: any, data: any) => {
        logger.info(`[StockBridge] Injecting reception ${receptionId} into Nexus`);
        try {
            return await (StockEngine as any).processReception(item, data);
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
