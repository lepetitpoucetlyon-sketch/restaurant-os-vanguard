import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FiscalEngine } from '@/domain/services/FiscalEngine';
import { checkOnlineStatus } from '@/lib/offline/status';
import { FiscalSeal } from '@/types';
import { db } from '@/lib/offline/offline-store';
import { logger } from '@/lib/logger';

/**
 * ⛓️ BlockchainLedgerService - Restaurant OS
 * Assure l'immuabilité du Grand Livre en chaînant cryptographiquement
 * chaque nouvelle écriture à la précédente (Blockchain Fiscal NF525).
 * 
 * GRADE VI: Implémente une "Task Queue" séquentielle pour garantir l'atomicité
 * sous stress (Black Friday Mode).
 */
export class BlockchainLedgerService {
    
    // 🔒 Sequential Lock Queue
    private static sealQueue: Promise<void | FiscalSeal> = Promise.resolve();
    
    // 🧊 Local cache for high-speed chaining
    private static lastSealCache: FiscalSeal | undefined = undefined;

    /**
     * Récupère le dernier sceau fiscal pour servir de lien à la chaîne.
     */
    static async getLastSeal(): Promise<FiscalSeal | undefined> {
        if (this.lastSealCache) return this.lastSealCache;

        // Mode Offline ou récupération locale prioritaire pour rapidité
        if (!checkOnlineStatus()) {
            const localSeal = await db.fiscalSeals.orderBy('timestamp').reverse().first();
            this.lastSealCache = localSeal;
            return localSeal;
        }

        try {
            const sealsPath = Nexus.getTenantPath('fiscalSeals');
            const results = await Nexus.adapter.query(sealsPath, {
                orderBy: { field: 'timestamp', direction: 'desc' },
                limit: 1
            });
            
            this.lastSealCache = results.length > 0 ? (results[0] as unknown as FiscalSeal) : undefined;
            return this.lastSealCache;
        } catch (error) {
            logger.warn('BlockchainLedgerService: Remote fetch failed, falling back to local', error);
            const fallback = await db.fiscalSeals.orderBy('timestamp').reverse().first();
            this.lastSealCache = fallback;
            return fallback;
        }
    }

    /**
     * Scelle une écriture en la liant à la chaîne existante.
     * GARANTIE D'ATOMICITÉ: Utilise une file d'attente de promesses.
     */
    static async sealWithChain(entryId: string, entryData: Record<string, unknown>, isTrainingMode: boolean = false): Promise<FiscalSeal> {
        // We chain the next seal to the previous one to avoid concurrency forks
        this.sealQueue = this.sealQueue.then(async () => {
            const lastSeal = await this.getLastSeal();
            const newSeal = await FiscalEngine.sealEntry(entryId, entryData, { 
                lastSeal, 
                isTrainingMode 
            });

            // Update cache and persist (Local optimization)
            this.lastSealCache = newSeal;
            
            // Note: Nexus.adapter handled persistence of the audit log elsewhere, 
            // but we ensure the chain is strictly linear here.
            return newSeal;
        });

        return this.sealQueue as unknown as Promise<FiscalSeal>;
    }

    /**
     * Vérifie l'intégralité de la chaîne (Audit de confiance).
     */
    static async auditFullChain(): Promise<boolean> {
        const sealsPath = Nexus.getTenantPath('fiscalSeals');
        const results = await Nexus.adapter.query(sealsPath, {
            orderBy: { field: 'timestamp', direction: 'asc' }
        });
        
        const seals = results as unknown as FiscalSeal[];
        return await FiscalEngine.verifyChain(seals);
    }

    /**
     * Clear context (Reset for testing or tenant swap)
     */
    static reset() {
        this.lastSealCache = undefined;
        this.sealQueue = Promise.resolve();
    }
}
