import { db, SyncOperation } from './offline-store';
import { checkOnlineStatus } from './connectivity-hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/axiom';

/**
 * 🔄 SyncManager - Restaurant OS
 * Gère la file d'attente de synchronisation entre la base locale et Firestore.
 */
async function executeMutationOp(op: SyncOperation): Promise<void> {
    const fullPath = op.collection + (op.targetId ? `/${op.targetId}` : '');
    if (op.action === 'CREATE') {
        await Nexus.adapter.create(op.collection, op.payload);
    } else if (op.action === 'DELETE') {
        await Nexus.adapter.delete(fullPath);
    } else if (op.action === 'SET') {
        await Nexus.adapter.set(fullPath, op.payload);
    } else if (op.action === 'UPDATE') {
        await Nexus.adapter.update(fullPath, op.payload as Partial<import('@/shared/nexus-contract').SovereignData>);
    }
}

async function executeFallbackOp(op: SyncOperation): Promise<void> {
    const fullPath = `${op.collection}/${op.targetId}`;
    if (op.action === 'SET') await Nexus.adapter.set(fullPath, op.payload);
    if (op.action === 'UPDATE') await Nexus.adapter.update(fullPath, op.payload as Partial<import('@/shared/nexus-contract').SovereignData>);
}

export class SyncManager {
    private static isSyncing = false;

    /** Au-delà : on continue de retenter (jamais de drop fiscal) mais on loggue en critique. */
    private static readonly ALERT_ATTEMPTS = 10;

    /**
     * Ajoute une opération à la file d'attente et tente une synchro si possible.
     */
    static async enqueue(op: Omit<SyncOperation, 'status' | 'attempts' | 'timestamp'>) {
        const newOp: SyncOperation = {
            ...op,
            status: 'pending',
            attempts: 0,
            timestamp: new Date().toISOString(),
            // ⚠️ 'NF525_PAYMENT' ne contient pas « FISCAL » : l'ancien calcul
            // (op.type.includes('FISCAL')) classait les paiements en priorité 0.
            priority: op.priority ?? (
                op.type === 'NF525_PAYMENT' || op.type === 'FISCAL_SEAL' || op.type === 'JOURNAL_ENTRY' ? 1 : 0
            )
        };

        const id = await db.syncQueue.add(newOp);
        logger.info('SyncManager: Operation enqueued', { id, type: op.type });

        // Tenter une synchro immédiate si online
        if (checkOnlineStatus()) {
            this.processQueue();
        } else {
            // Tenter d'enregistrer le tag Background Sync pour quand le réseau reviendra
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    if ('sync' in registration) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (registration as any).sync.register('restaurant-os-sync').catch(() => {});
                    }
                }).catch(() => {});
            }
        }
    }

    /**
     * Traite tous les éléments en attente dans la SyncQueue.
     */
    static async processQueue() {
        if (this.isSyncing) return;

        // ⚠️ Rejouer AUSSI les 'failed' : les laisser de côté = ticket NF525
        // perdu au premier échec. Une op fiscale n'est JAMAIS abandonnée.
        const pendingOps = (await db.syncQueue
            .where('status')
            .anyOf('pending', 'failed')
            .toArray())
            // Fiscal (priority 1) d'abord, puis ordre chronologique (chaîne de sceaux).
            .sort((a, b) => (b.priority - a.priority) || a.timestamp.localeCompare(b.timestamp));

        if (pendingOps.length === 0) return;

        this.isSyncing = true;
        logger.info('SyncManager: Starting synchronization process', { count: pendingOps.length });

        for (const op of pendingOps) {
            try {
                await this.executeOperation(op);
                // Mark as synced and delete from queue if successful
                await db.syncQueue.delete(op.id!);
                logger.info('SyncManager: Operation synced and removed', { id: op.id, type: op.type });
            } catch (error) {
                const err = error as Error;
                const errorMessage = err.message || String(error);
                logger.error('SyncManager: Sync failed for operation', { id: op.id, error: errorMessage });
                
                await db.syncQueue.update(op.id!, {
                    status: 'failed',
                    attempts: op.attempts + 1,
                    lastError: errorMessage
                });

                if (op.attempts + 1 >= this.ALERT_ATTEMPTS) {
                    logger.error('SyncManager: CRITICAL — operation stuck after repeated attempts', {
                        id: op.id, type: op.type, attempts: op.attempts + 1
                    });
                }

                // Si c'est une erreur de connexion, on arrête la boucle
                if (!checkOnlineStatus()) break;
            }
        }

        this.isSyncing = false;
        
        // Relancer si de nouveaux items PENDING sont arrivés entre temps.
        // (Les 'failed' attendent le prochain déclencheur — online/boot/enqueue —
        // pour éviter une boucle chaude de retries.)
        const remaining = await db.syncQueue.where('status').equals('pending').count();
        if (remaining > 0 && checkOnlineStatus()) {
            this.processQueue();
        }
    }

    /**
     * Exécute une opération spécifique vers Firestore.
     */
    private static async executeOperation(op: SyncOperation) {
        if (op.type === 'NF525_PAYMENT') {
            const payload = op.payload as { instructions: Array<{ method: string; path: string; data: import('@/shared/nexus-contract').SovereignData }> };
            const instructions = payload.instructions;

            // Idempotence : si le JournalEntry existe déjà (écriture partielle avant
            // déconnexion), on ne rejoue pas le batch — sinon double-scellement NF525.
            const journalInstruction = instructions.find(i => i.path.includes('/journalEntries/'));
            if (journalInstruction) {
                const existing = await Nexus.adapter.get(journalInstruction.path);
                if (existing) {
                    logger.info('SyncManager: NF525_PAYMENT déjà commité — skip replay', { path: journalInstruction.path });
                    return;
                }
            }

            // Call the sync API instead of writing directly, to perform server-side atomic sealing
            const journalEntries = instructions
                .filter(ins => ins.path.includes('/journalEntries/') && ins.method === 'SET')
                .map(ins => ins.data);

            if (journalEntries.length > 0) {
                // Extract tenantId from path (e.g. 'tenants/tenant-1/journalEntries/JE-123')
                const pathParts = instructions[0].path.split('/');
                const tenantId = pathParts[1];

                const response = await fetch('/api/finance/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tenantId,
                        journalEntries,
                        isTrainingMode: false,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Sync API failed: ${response.status} ${response.statusText}`);
                }
            }
        } else if (op.type === 'MUTATION') {
            await executeMutationOp(op);
        } else {
            await executeFallbackOp(op);
        }
    }
}

// Lancement automatique du manager lors du chargement (si en ligne)
export function bootSyncManager() {
    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => SyncManager.processQueue());
        
        // Listen to Service Worker Background Sync triggers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'PROCESS_SYNC_QUEUE') {
                    logger.info('SyncManager: Background Sync triggered by Service Worker');
                    SyncManager.processQueue();
                }
            });
            // Register Background Sync if queuing happens
            navigator.serviceWorker.ready.then(registration => {
                // Background Sync registration happens inside SyncManager.enqueue now
            }).catch(() => {});
        }

        // On lance immédiatement la synchro au chargement
        SyncManager.processQueue();
    }
}
