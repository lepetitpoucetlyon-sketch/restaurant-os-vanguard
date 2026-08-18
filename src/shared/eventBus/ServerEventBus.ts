import { NexusEventBus, NexusEventName, NexusEventPayload } from './NexusEventBus';
import { registerServerNexusHandlers } from './registerHandlers';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

let serverInitialized = false;

/**
 * ServerEventBus — In-Memory Event Dispatcher pour le serveur Node.js (API routes / Next.js SSR)
 *
 * Résout le problème des API routes qui émettent des événements côté serveur Node.js :
 * Enregistre automatiquement la grille de handlers au premier appel serveur,
 * normalise l'eventId et persiste dans la DLQ serveur en cas d'échec critique (V3-BUS-07).
 */
export async function dispatchServerEvent<E extends NexusEventName>(
  event: E,
  payload: NexusEventPayload<E>
): Promise<void> {
  if (!serverInitialized) {
    registerServerNexusHandlers();
    serverInitialized = true;
  }

  const rawPayload = (payload || {}) as Record<string, unknown>;
  const tenantId = (rawPayload.tenantId as string) || 'global';
  const eventId = String(rawPayload.eventId || rawPayload.id || crypto.randomUUID());
  if (payload && typeof payload === 'object' && !rawPayload.eventId) {
    rawPayload.eventId = eventId;
  }

  try {
    await NexusEventBus.emit(event, payload);
  } catch (err) {
    logger.error(`[ServerEventBus] Error dispatching server event "${event}" (${eventId})`, err);
    // V3-BUS-07: Persistance DLQ serveur dans Nexus
    if (tenantId) {
      try {
        const dlqEntry = {
          id: `dlq_${eventId}_${Date.now()}`,
          eventId,
          eventName: event,
          payload,
          error: err instanceof Error ? err.message : String(err),
          failedAt: Date.now(),
          attempts: 1,
          status: 'pending_retry',
        };
        await Nexus.adapter.set(`tenants/${tenantId}/dead_letter_events/${dlqEntry.id}`, dlqEntry);
      } catch (dlqErr) {
        logger.error(`[ServerEventBus] Failed to persist server DLQ entry`, dlqErr);
      }
    }
    throw err;
  }
}
