import { db } from '@/lib/offline/offline-store';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { ServerIdempotencyPersistence } from './ServerIdempotencyPersistence';

export interface ProcessedEventLog {
    id: string; // `${eventId}_${handlerId}`
    eventId: string;
    handlerId: string;
    eventName: string;
    tenantId?: string;
    processedAt: number;
}

type PersistenceAdapter = {
    get: <T>(path: string) => Promise<T | null>;
    set: <T>(path: string, data: T) => Promise<void>;
};

let _persistenceAdapter: PersistenceAdapter | null = null;

export function setEventBusPersistenceAdapter(adapter: PersistenceAdapter | null): void {
    _persistenceAdapter = adapter;
}

/**
 * 🛡️ IdempotencyGuard - Invariant #1 de la Charte Permanente d'Ingénierie
 *
 * Empêche l'exécution répétée d'un handler sur le même eventId (reconnexion, retry réseau, double-clic).
 * Stocke la trace d'exécution dans le cache mémoire local, la base IndexedDB et Firestore.
 */
export class IdempotencyGuard {
    private static memoryCache = new Set<string>();
    /** Plafond du cache mémoire de dedup — évite la fuite mémoire d'un process long/SSR (audit S5). */
    private static readonly MEMORY_CACHE_MAX = 50_000;

    /** Ajoute une clé au cache borné — éviction FIFO du plus ancien au-delà du plafond. */
    private static rememberInMemory(key: string): void {
        this.memoryCache.add(key);
        if (this.memoryCache.size > this.MEMORY_CACHE_MAX) {
            const overflow = this.memoryCache.size - this.MEMORY_CACHE_MAX;
            let i = 0;
            for (const k of this.memoryCache) {
                if (i++ >= overflow) break;
                this.memoryCache.delete(k); // Set = ordre d'insertion : on évince les plus anciens
            }
        }
    }

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
                    this.rememberInMemory(key);
                    return true;
                }
            } catch {
                // Fallback silencieux
            }
        }

        // 3. Check Nexus / Firestore côté serveur si tenantId fourni
        if (_persistenceAdapter && tenantId) {
            try {
                const record = await _persistenceAdapter.get<ProcessedEventLog>(
                    `tenants/${tenantId}/events_processed_log/${key}`
                );
                if (record) {
                    this.rememberInMemory(key);
                    return true;
                }
            } catch (err) {
                logger.warn(`[IdempotencyGuard] Failed to check processed event in Nexus`, err);
            }
        }

        return false;
    }

    /**
     * Enregistre un événement comme traité
     */
    static async markProcessed(
        eventId: string,
        handlerId: string,
        eventName: string,
        tenantId?: string
    ): Promise<void> {
        if (!eventId) return;
        const key = `${eventId}_${handlerId}`;
        this.rememberInMemory(key);

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

        if (_persistenceAdapter && tenantId) {
            try {
                await _persistenceAdapter.set(`tenants/${tenantId}/events_processed_log/${key}`, record);
            } catch (err) {
                logger.warn(`[IdempotencyGuard] Failed to write processed event to Nexus`, err);
            }
        }
    }

    /**
     * Résout un identifiant d'événement unique et déterministe pour tout type de payload
     * (y compris les événements de vente et opérations n'ayant pas encore migré vers eventId).
     */
    static resolveEventKey(eventName: string, payload: unknown): string | undefined {
        if (!payload || typeof payload !== 'object') return undefined;
        const p = payload as Record<string, unknown>;
        const rawId = p.eventId ?? p.orderId ?? p.transactionId ?? p.invoiceId ?? p.tableId ?? p.reservationId ?? p.planId ?? p.id ?? (p.entry && typeof p.entry === 'object' ? (p.entry as Record<string, unknown>).id : undefined);
        if (rawId !== undefined && rawId !== null && rawId !== '') {
            return `${eventName}:${String(rawId)}`;
        }
        return undefined;
    }

    /**
     * Helper pour enrober un handler de fonction avec la protection d'idempotence automatique.
     */
    static withIdempotencyGuard<T>(
        handlerId: string,
        eventName: string,
        fn: (payload: T) => Promise<void> | void
    ): (payload: T) => Promise<void> {
        return async (payload: T) => {
            const eventKey = IdempotencyGuard.resolveEventKey(eventName, payload);
            const tenantId = (payload as Record<string, unknown>)?.tenantId as string | undefined;

            if (eventKey) {
                const memKey = `${eventKey}_${handlerId}`;
                if (IdempotencyGuard.memoryCache.has(memKey)) {
                    logger.info(`[IdempotencyGuard] Duplicate event detected in memory for ${eventName}#${handlerId} (key: ${eventKey}) — skipping.`);
                    return;
                }

                if (tenantId) {
                    const lease = await ServerIdempotencyPersistence.acquireLease(
                        eventKey,
                        handlerId,
                        eventName,
                        tenantId,
                    );
                    if (!lease.acquired) {
                        logger.info(`[IdempotencyGuard] Lease rejected (${lease.reason}) for ${eventName}#${handlerId} (key: ${eventKey}) — skipping duplicate.`);
                        IdempotencyGuard.rememberInMemory(memKey);
                        return;
                    }
                } else {
                    const duplicate = await IdempotencyGuard.isDuplicate(eventKey, handlerId, tenantId);
                    if (duplicate) {
                        logger.info(`[IdempotencyGuard] Duplicate event detected for ${eventName}#${handlerId} (key: ${eventKey}) — skipping execution.`);
                        return;
                    }
                }
            }

            try {
                await fn(payload);

                if (eventKey) {
                    if (tenantId) {
                        await ServerIdempotencyPersistence.completeLease(eventKey, handlerId, eventName, tenantId);
                    }
                    await IdempotencyGuard.markProcessed(eventKey, handlerId, eventName, tenantId);
                }
            } catch (error) {
                if (eventKey && tenantId) {
                    await ServerIdempotencyPersistence.failLease(eventKey, handlerId, eventName, tenantId, toError(error));
                }
                throw error;
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
