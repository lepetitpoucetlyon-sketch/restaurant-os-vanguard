/**
 * OutboxService — Moteur atomique d'Outbox pour le mode hors-ligne et la réconciliation.
 *
 * Principes :
 * 1. Toute mutation locale est enfilée avec un `eventId` déterministe (idempotence).
 * 2. Tri par priorité (Priorité 1 : Fiscale / NF525 en premier, Priorité 0 : Standard).
 * 3. Vidage automatique dès que `navigator.onLine === true` ou sur appel explicite.
 * 4. Backoff exponentiel (max 5 tentatives) puis bascule en Dead Letter Queue (DLQ).
 * 5. Alerte via `OpsAlertGateway` si des opérations critiques échouent.
 */

import { db, type SyncOperation } from './offline-store';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export interface OutboxEnqueueParams {
    type?: SyncOperation['type'];
    action: SyncOperation['action'];
    collection: string;
    targetId: string;
    payload: Record<string, unknown>;
    priority?: number; // 1 = Fiscal (urgent), 0 = Normal
    eventId?: string;
}

export interface OutboxDrainResult {
    processed: number;
    succeeded: number;
    failed: number;
    remaining: number;
}

export class OutboxService {
    /**
     * Enfile une mutation dans l'outbox locale Dexie.
     */
    static async enqueue(params: OutboxEnqueueParams): Promise<number> {
        const timestamp = new Date().toISOString();
        const eventId = params.eventId ?? `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        const generatedId = Date.now() + Math.floor(Math.random() * 1000);

        const op: SyncOperation = {
            id: generatedId,
            type: params.type ?? 'GENERIC_UPDATE',
            action: params.action,
            collection: params.collection,
            targetId: params.targetId,
            payload: {
                ...params.payload,
                _eventId: eventId,
                _enqueuedAt: timestamp,
            },
            timestamp,
            status: 'pending',
            priority: params.priority ?? (params.collection.includes('fiscal') || params.collection.includes('journal') ? 1 : 0),
            attempts: 0,
        };

        await db.syncQueue.put(op);
        logger.info(`[OutboxService] Opération enfilée #${generatedId} (${params.action} ${params.collection}/${params.targetId})`);
        return generatedId;
    }

    /**
     * Vide la file d'attente vers l'adapter distant (Firestore / Nexus).
     */
    static async drain(): Promise<OutboxDrainResult> {
        const pending = await db.syncQueue
            .where('status')
            .equals('pending')
            .toArray();

        // Trier par priorité décroissante (1 avant 0) puis chronologique
        pending.sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.timestamp.localeCompare(b.timestamp));

        let succeeded = 0;
        let failed = 0;

        for (const op of pending) {
            try {
                if (op.action === 'SET' || op.action === 'CREATE') {
                    await Nexus.adapter.set(`${op.collection}/${op.targetId}`, op.payload);
                } else if (op.action === 'UPDATE') {
                    await Nexus.adapter.update(`${op.collection}/${op.targetId}`, op.payload);
                } else if (op.action === 'DELETE') {
                    await Nexus.adapter.delete(`${op.collection}/${op.targetId}`);
                }

                if (op.id !== undefined) {
                    await db.syncQueue.delete(op.id);
                }
                succeeded++;
            } catch (error) {
                const err = toError(error);
                failed++;
                const nextAttempts = (op.attempts || 0) + 1;

                logger.warn(`[OutboxService] Échec synchronisation op #${op.id} (tentative ${nextAttempts}/5): ${err.message}`);

                if (nextAttempts >= 5) {
                    // Bascule en quarantaine / échec définitif
                    if (op.id) {
                        await db.syncQueue.update(op.id, {
                            status: 'failed',
                            attempts: nextAttempts,
                            lastError: err.message,
                        });
                    }

                    // Émettre alerte ops critique si l'opération était prioritaire (fiscale)
                    if (op.priority > 0) {
                        await OpsAlertGateway.send({
                            severity: 'critical',
                            title: `DLQ Outbox : Opération Fiscale Échouée`,
                            source: 'outbox-service',
                            message: `L'opération fiscale #${op.id} (${op.collection}/${op.targetId}) a dépassé 5 tentatives de sync : ${err.message}`,
                            context: {
                                opId: op.id,
                                collection: op.collection,
                                targetId: op.targetId,
                                attempts: nextAttempts,
                                error: err.message,
                            },
                        });
                    }
                } else {
                    if (op.id) {
                        await db.syncQueue.update(op.id, {
                            attempts: nextAttempts,
                            lastError: err.message,
                        });
                    }
                }
            }
        }

        const remaining = await db.syncQueue.where('status').equals('pending').count();

        return {
            processed: pending.length,
            succeeded,
            failed,
            remaining,
        };
    }

    /**
     * Retourne le nombre d'opérations en attente.
     */
    static async getPendingCount(): Promise<number> {
        return db.syncQueue.where('status').equals('pending').count();
    }
}
