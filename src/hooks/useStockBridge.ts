import { useAtom } from 'jotai';
import { inventoryAtoms } from '@/store/inventoryAtoms';
import { StockEngine } from '@/domain/services/StockEngine';
import { logger } from '@/lib/logger';
import { useSettings } from './useSettings';

/**
 * 🛰️ useStockBridge - Grade VI
 * Bridge for secure stock injections and real-time reconciliation.
 */
export const useStockBridge = () => {
    const [inventory] = useAtom(inventoryAtoms);
    const { tenantId } = useSettings();

    const injectQuantities = async (receptionId: string, items: any[]) => {
        logger.info(`[StockBridge] Injecting reception ${receptionId} into Nexus`);
        try {
            return await StockEngine.processReception(receptionId, items, tenantId);
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
