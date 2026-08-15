'use client';

import { db, SyncOperation } from '@/lib/offline/offline-store';
import { SyncManager } from '@/lib/offline/sync-manager';
import { checkOnlineStatus } from '@/lib/offline/connectivity-hooks';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/axiom';
import type { Order } from '@nexus/contracts';

export interface OfflineQueueStats {
    pendingCount: number;
    failedCount: number;
    isOnline: boolean;
    lastSyncTimestamp: number | null;
}

export class OfflineQueueService {
    private static lastSyncTimestamp: number | null = null;

    /**
     * Enregistre une commande encaissée hors-ligne dans la file d'attente sécurisée.
     */
    static async enqueueOfflineOrder(
        tenantId: string,
        order: Order,
        registerId: string = 'pos-main',
        options: { isTrainingMode?: boolean } = {}
    ): Promise<{ queueId: number; status: 'queued' | 'synced' }> {
        // 1. Sauvegarder dans la table locale Dexie des commandes
        await db.orders.put(order);

        // 2. Préparer l'opération de synchronisation fiscale
        const syncPayload = {
            instructions: [
                {
                    method: 'SET',
                    path: `tenants/${tenantId}/orders/${order.id}`,
                    data: order,
                },
                {
                    method: 'SET',
                    path: `tenants/${tenantId}/journalEntries/JE-${order.id}`,
                    data: {
                        id: `JE-${order.id}`,
                        tenantId,
                        orderId: order.id,
                        registerId,
                        totalInMicrounits: order.totalInMicrounits ?? (order.totalInCents ? order.totalInCents * 10000 : 0),
                        createdAt: order.createdAt || new Date().toISOString(),
                        isTrainingMode: options.isTrainingMode ?? false,
                    },
                }
            ]
        };

        const op: Omit<SyncOperation, 'status' | 'attempts' | 'timestamp'> = {
            type: 'NF525_PAYMENT',
            action: 'COMMIT_BATCH',
            collection: `tenants/${tenantId}/orders`,
            targetId: order.id,
            payload: syncPayload,
            priority: 1, // Priorité absolue NF525
        };

        await SyncManager.enqueue(op);

        const isOnline = checkOnlineStatus();
        if (isOnline) {
            this.lastSyncTimestamp = Date.now();
        }

        return {
            queueId: Date.now(),
            status: isOnline ? 'synced' : 'queued',
        };
    }

    /**
     * Récupère les statistiques actuelles de la file hors-ligne.
     */
    static async getStats(): Promise<OfflineQueueStats> {
        try {
            const pendingCount = await db.syncQueue.where('status').equals('pending').count();
            const failedCount = await db.syncQueue.where('status').equals('failed').count();
            const isOnline = checkOnlineStatus();

            return {
                pendingCount,
                failedCount,
                isOnline,
                lastSyncTimestamp: this.lastSyncTimestamp,
            };
        } catch {
            return {
                pendingCount: 0,
                failedCount: 0,
                isOnline: true,
                lastSyncTimestamp: null,
            };
        }
    }

    /**
     * Force la purge et la synchronisation de toute la file d'attente vers le serveur.
     */
    static async flush(): Promise<{ success: boolean; drainedCount: number }> {
        const statsBefore = await this.getStats();
        if (statsBefore.pendingCount === 0 && statsBefore.failedCount === 0) {
            return { success: true, drainedCount: 0 };
        }

        try {
            await SyncManager.processQueue();
            const statsAfter = await this.getStats();
            const drainedCount = (statsBefore.pendingCount + statsBefore.failedCount) - (statsAfter.pendingCount + statsAfter.failedCount);

            this.lastSyncTimestamp = Date.now();
            NexusEventBus.emit('facility.hardware_fault', {
                tenantId: 'system',
                hardwareId: 'network-outbox',
                type: 'network_reconnected',
                details: { drainedCount },
            } as never);

            return { success: true, drainedCount: Math.max(0, drainedCount) };
        } catch (error) {
            logger.error('[OfflineQueue] Flush failed', error);
            return { success: false, drainedCount: 0 };
        }
    }
}

export const offlineQueue = OfflineQueueService;
