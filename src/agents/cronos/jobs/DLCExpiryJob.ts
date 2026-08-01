import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

/**
 * 📦 DLCExpiryJob - Grade X
 * Vérifie quotidiennement les DLC (Date Limite de Consommation) des articles en stock.
 */
export const DLCExpiryJob = {
    name: 'DLCExpiryJob',
    schedule: '0 0 * * *', // Tous les jours à minuit
    
    async execute(tenantIds: string[]) {
        try {
            let expiredCount = 0;
            const now = new Date().toISOString();

            for (const tenantId of tenantIds) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const stockItems = await Nexus.adapter.query<any>(`tenants/${tenantId}/stockItems`, { limit: 5000 });
                
                for (const item of stockItems) {
                    if (item.expiryDate && item.expiryDate < now && item.quantity > 0) {
                        NexusEventBus.emit('dlc.expired', {
                            v: 1,
                            tenantId,
                            itemId: item.id || item.itemId,
                            batchNumber: item.batchNumber || 'unknown',
                            quantity: item.quantity
                        });
                        expiredCount++;
                    }
                }
            }
            
            logger.info(`[DLCExpiryJob] Exécution terminée. ${expiredCount} articles périmés détectés.`);
            return { success: true, expiredCount };
        } catch (error) {
            logger.error(`[DLCExpiryJob] Erreur:`, String(error));
            throw error;
        }
    }
};
