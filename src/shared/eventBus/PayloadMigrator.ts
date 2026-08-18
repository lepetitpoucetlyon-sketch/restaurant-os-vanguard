import type { NexusEventName, NexusEventPayload } from './NexusEventBus';
import { logger } from '@/lib/logger';

/**
 * 🛠️ PayloadMigrator
 * 
 * Permet de migrer les anciens payloads (ex: ceux persistés hors-ligne dans la BusOutbox)
 * vers le schéma en vigueur dans NexusEvents, notamment l'ajout du `v: 1`.
 */
export const PayloadMigrator = {
  migrate<E extends NexusEventName>(eventName: E, rawPayload: Record<string, unknown>): NexusEventPayload<E> {
    if (!rawPayload) return rawPayload;

    // Clone pour éviter les mutations
    const payload = { ...rawPayload };

    // Si le payload n'a pas de version, on le monte en v1 par défaut
    if (!payload.v) {
      payload.v = 1;
      logger.info(`[PayloadMigrator] Upgraded legacy payload for ${eventName} to v: 1`);
    }

    return payload as NexusEventPayload<E>;
  }
};
