import { NexusEventBus, NexusEventName, NexusEventPayload } from '@/shared/eventBus/NexusEventBus';
import { registerServerNexusHandlers } from './registerHandlers';

let serverInitialized = false;

/**
 * ServerEventBus — In-Memory Event Dispatcher pour le serveur Node.js (API routes / Next.js SSR)
 *
 * Résout le problème des API routes qui émettent des événements côté serveur Node.js :
 * Enregistre automatiquement la grille de handlers au premier appel serveur,
 * puis émet l'événement sur le bus.
 */
export async function dispatchServerEvent<E extends NexusEventName>(
  event: E,
  payload: NexusEventPayload<E>
): Promise<void> {
  if (!serverInitialized) {
    registerServerNexusHandlers();
    serverInitialized = true;
  }
  await NexusEventBus.emit(event, payload);
}
