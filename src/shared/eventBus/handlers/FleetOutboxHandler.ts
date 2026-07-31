import { NexusEventBus, NexusEventPayload, NexusEventName } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * Gère la remontée des événements critiques vers le tableau de bord global MCC.
 * Implémente le pattern Outbox pour la synchronisation asynchrone des tenants vers la flotte.
 */
export class FleetOutboxHandler {
  static register() {
    // On écoute les paiements échoués et autres événements critiques pour la flotte
    return NexusEventBus.on('finance.payment_failed', async (payload: NexusEventPayload<'finance.payment_failed'>) => {
      if (payload.isSimulation) return;
      await FleetOutboxHandler.queueEvent('finance.payment_failed', payload);
    }, { id: 'fleet-outbox-finance', priority: 'BACKGROUND' });
  }

  static async queueEvent<T extends NexusEventName>(eventName: T, payload: NexusEventPayload<T>) {
    try {
      const outboxId = `outbox_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // On écrit dans une collection outbox du tenant, qui sera lue par le MCC
      await Nexus.adapter.update(`tenants/${payload.tenantId}/mcc_outbox/${outboxId}`, {
        eventName,
        payload,
        status: 'pending',
        createdAt: Date.now()
      });
      
      logger.info(`[FleetOutboxHandler] Événement ${eventName} placé dans l'outbox MCC du tenant ${payload.tenantId}`);
    } catch (err) {
      logger.error(`[FleetOutboxHandler] Erreur lors de l'outboxing de ${eventName}`, String(err));
    }
  }
}
