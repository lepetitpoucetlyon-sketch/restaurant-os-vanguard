import { db } from '@/lib/offline/offline-store';
import { logger } from '@/lib/logger';

export interface ProcessedEventLog {
    id: string; // `${eventId}_${handlerId}`
    eventId: string;
    handlerId: string;
    eventName: string;
    tenantId?: string;
    processedAt: number;
}

async function getNexus() {
    const { Nexus } = await import('@/lib/nexus/NexusAdapter');
    return Nexus;
}

/**
 * 🛡️ IdempotencyGuard - Invariant #1 de la Charte Permanente d'Ingénierie
 *
 * Empêche l'exécution répétée d'un handler sur le même eventId (reconnexion, retry réseau, double-clic).
 * Stocke la trace d'exécution dans le cache mémoire local, la base IndexedDB et Firestore.
 */
export class IdempotencyGuard {
    private static memoryCache = new Set<string>();

    /**
     * Vérifie si un événement a déjà été traité par un handler donné.
     * Renvoie true si c'est un doublon (déjà exécuté), false sinon.
     */
    static async isDuplicate(eventId: string, handlerId: string, tenantId?: string): Promise<boolean> {
        if (!eventId) return false;
        const key = `${eventId}_${handlerId}`;

        // 1. Check rapide en cache mémoire
        if (this.memoryCache.has(key)) {
            return true;
        }

        // 2. Check IndexedDB côté client
        if (typeof window !== 'undefined' && db?.processedEvents) {
            try {
                const existing = await db.processedEvents.get(key);
                if (existing) {
                    this.memoryCache.add(key);
                    return true;
                }
            } catch {
                // Fallback silencieux
            }
        }

        // 3. Check Nexus / Firestore côté serveur si tenantId fourni
        if (tenantId) {
            try {
                const Nexus = await getNexus();
                const doc = await Nexus.adapter.get<ProcessedEventLog>(`tenants/${tenantId}/events_processed_log/${key}`);
                if (doc) {
                    this.memoryCache.add(key);
                    return true;
                }
            } catch {
                // Ignore
            }
        }

        return false;
    }

    /**
     * Enregistre un événement comme traité de manière atomique.
     */
    static async markProcessed(
        eventId: string,
        handlerId: string,
        eventName: string,
        tenantId?: string
    ): Promise<void> {
        if (!eventId) return;
        const key = `${eventId}_${handlerId}`;
        this.memoryCache.add(key);

        const record: ProcessedEventLog = {
            id: key,
            eventId,
            handlerId,
            eventName,
            tenantId,
            processedAt: Date.now(),
        };

        if (typeof window !== 'undefined' && db?.processedEvents) {
            try {
                await db.processedEvents.put(record);
            } catch (err) {
                logger.warn(`[IdempotencyGuard] Failed to write processed event to Dexie`, err);
            }
        }

        if (tenantId) {
            try {
                const Nexus = await getNexus();
                await Nexus.adapter.set(`tenants/${tenantId}/events_processed_log/${key}`, record);
            } catch (err) {
                logger.warn(`[IdempotencyGuard] Failed to write processed event to Nexus`, err);
            }
        }
    }

    /**
     * Helper pour enrober un handler de fonction avec la protection d'idempotence automatique.
     */
    static withIdempotencyGuard<T extends { eventId?: string; tenantId?: string }>(
        handlerId: string,
        eventName: string,
        fn: (payload: T) => Promise<void> | void
    ): (payload: T) => Promise<void> {
        return async (payload: T) => {
            const eventId = payload?.eventId;
            const tenantId = payload?.tenantId;

            if (eventId) {
                const duplicate = await IdempotencyGuard.isDuplicate(eventId, handlerId, tenantId);
                if (duplicate) {
                    logger.info(`[IdempotencyGuard] Duplicate event detected for ${eventName}#${handlerId} (eventId: ${eventId}) — skipping execution.`);
                    return;
                }
            }

            await fn(payload);

            if (eventId) {
                await IdempotencyGuard.markProcessed(eventId, handlerId, eventName, tenantId);
            }
        };
    }

    /**
     * Efface le cache mémoire (utile pour les tests unitaires)
     */
    static clearMemoryCache(): void {
        this.memoryCache.clear();
    }
}
