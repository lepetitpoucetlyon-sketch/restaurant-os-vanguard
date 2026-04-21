import { db, SyncOperation } from './offline-store';
import { checkOnlineStatus } from './connectivity-hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/axiom';

/**
 * 🔄 SyncManager - Restaurant OS
 * Gère la file d'attente de synchronisation entre la base locale et Firestore.
 */
export class SyncManager {
    private static isSyncing = false;

    /**
     * Ajoute une opération à la file d'attente et tente une synchro si possible.
     */
    static async enqueue(op: Omit<SyncOperation, 'status' | 'attempts' | 'timestamp'>) {
        const newOp: SyncOperation = {
            ...op,
            status: 'pending',
            attempts: 0,
            timestamp: new Date().toISOString(),
            priority: op.type.includes('FISCAL') ? 1 : 0
        };

        const id = await db.syncQueue.add(newOp);
        logger.info('SyncManager: Operation enqueued', { id, type: op.type });

        // Tenter une synchro immédiate si online
        if (checkOnlineStatus()) {
            this.processQueue();
        }
    }

    /**
     * Traite tous les éléments en attente dans la SyncQueue.
     */
    static async processQueue() {
        if (this.isSyncing) return;
        
        const pendingOps = await db.syncQueue
            .where('status')
            .equals('pending')
            .sortBy('priority');

        if (pendingOps.length === 0) return;

        this.isSyncing = true;
        logger.info('SyncManager: Starting synchronization process', { count: pendingOps.length });

        for (const op of pendingOps) {
            try {
                await this.executeOperation(op);
                // Mark as synced and delete from queue if successful
                await db.syncQueue.delete(op.id!);
                logger.info('SyncManager: Operation synced and removed', { id: op.id, type: op.type });
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error('SyncManager: Sync failed for operation', { id: op.id, error: errorMessage });
                
                await db.syncQueue.update(op.id!, {
                    status: 'failed',
                    attempts: op.attempts + 1,
                    lastError: errorMessage
                });

                // Si c'est une erreur de connexion, on arrête la boucle
                if (!checkOnlineStatus()) break;
            }
        }

        this.isSyncing = false;
        
        // Relancer si de nouveaux items sont arrivés entre temps
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
            // Pour les batchs complexes, le payload contient déjà le snapshot prêt pour Firestore.
            // On peut re-jouer le batch ici.
            const batch = Nexus.adapter.batch();
            
            // Le payload contient une liste d'instructions { path, data, method }
            const instructions = op.payload.instructions;
            for (const ins of instructions) {
                if (ins.method === 'SET') batch.set(ins.path, ins.data);
                if (ins.method === 'UPDATE') batch.update(ins.path, ins.data);
                if (ins.method === 'DELETE') batch.delete(ins.path);
            }

            await batch.commit();
        } else {
            // Logique générique pour les opérations simples
            const fullPath = `${op.collection}/${op.targetId}`;
            if (op.action === 'SET') await Nexus.adapter.set(fullPath, op.payload);
            if (op.action === 'UPDATE') await Nexus.adapter.update(fullPath, op.payload);
        }
    }
}

// Lancement automatique du manager lors du chargement (si en ligne)
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => SyncManager.processQueue());
    // On lance immédiatement la synchro au chargement
    SyncManager.processQueue();
}
