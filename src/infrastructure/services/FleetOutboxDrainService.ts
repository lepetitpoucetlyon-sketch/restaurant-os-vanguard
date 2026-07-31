import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class FleetOutboxDrainService {
    /**
     * Draine l'outbox d'un tenant spécifique et propage les événements
     * vers la file globale de la flotte (MCC).
     */
    static async drainTenant(tenantId: string): Promise<number> {
        let count = 0;
        try {
            // Note: with NexusAdapter, we query the tenant's collection directly
            const pendingEvents = await Nexus.adapter.query<{ id: string; type: string; payload: any; timestamp: string }>(`tenants/${tenantId}/mcc_outbox`, {
                where: [
                    { field: 'status', operator: '==', value: 'pending' }
                ],
                limit: 50
            });

            for (const event of pendingEvents) {
                // 1. Inscrire dans la file globale MCC
                await Nexus.adapter.create('mcc/globalEvents', {
                    tenantId,
                    eventType: event.type,
                    payload: event.payload,
                    sourceTimestamp: event.timestamp,
                    dispatchedAt: new Date().toISOString()
                });

                // 2. Marquer l'événement comme dispatché dans l'outbox locale
                await Nexus.adapter.update(`tenants/${tenantId}/mcc_outbox/${event.id}`, {
                    status: 'dispatched',
                    dispatchedAt: Date.now()
                });

                count++;
            }
            
            if (count > 0) {
                logger.info(`[FleetOutboxDrain] Successfully drained ${count} events for tenant ${tenantId}`);
            }
        } catch (error) {
            logger.error(`[FleetOutboxDrain] Error draining outbox for tenant ${tenantId}`, String(error));
        }
        return count;
    }
}
