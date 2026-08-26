/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { INexusAdapter, INexusBatch, INexusTransaction, NexusContext } from "@/lib/nexus/types";
import type { SovereignData } from '@/shared/nexus-contract';
 
import { simulatorDb } from '@/modules/intelligence/ia/simulator/SimulatorDB';
import { logger } from '@/lib/logger';
import { IdGenerator } from '@/lib/utils/IdGenerator';
import {
    IDocumentStore,
    IQueryEngine,
    IRealtimeSubscriber,
    IQueryOptions
} from '@/shared/nexus/contracts/infrastructure/storage.contracts';
import { pollingSnapshot, pollingQuerySnapshot } from './PollingSnapshotMixin';

/**
 * 🌀 SimulacraAdapter - Restaurant OS (Grade X - Pure I/O)
 * The Copy-on-Write Isolation Layer.
 * Reads from Real Adapter + Virtual Store. Writes ONLY to Virtual Store.
 */
export class SimulacraAdapter implements INexusAdapter, IDocumentStore, IQueryEngine, IRealtimeSubscriber {
    constructor(
        private realAdapter: INexusAdapter,
        private forkId: string = 'default_sim'
    ) {
        logger.info(`[Simulacra] Air-Gap Interface active for fork: ${forkId}`);
    }

    async get<T = SovereignData>(path: string, _context?: NexusContext): Promise<T | null> {
        // 1. Check Virtual Store first
        const virtual = await simulatorDb.virtualStore.get(path);
        
        if (virtual) {
            if (virtual.isDeleted) return null;
            return virtual.data as T;
        }

        // 2. Fallback to Real Adapter (Read-only source)
        // En mode local pur (pas d'accès Firestore — ex. dev sans backend), la
        // source cloud peut échouer (permission-denied). On ne fait pas planter la
        // lecture : on retombe sur « document absent » pour laisser vivre les
        // données seedées localement.
        try {
            return await this.realAdapter.get<T>(path);
        } catch (e) {
            logger.warn(`[Simulacra] Source cloud indisponible pour ${path}, lecture locale seule`, (e as Error).message);
            return null;
        }
    }

    async query<T = SovereignData>(collectionPath: string, options?: IQueryOptions, _context?: NexusContext): Promise<T[]> {
        // La source cloud est optionnelle en mode local : si elle échoue
        // (permission-denied hors ligne), on sert uniquement les données locales
        // au lieu de laisser l'exception tuer toute la lecture.
        let realResults: T[] = [];
        try {
            realResults = await this.realAdapter.query<T>(collectionPath, options);
        } catch (e) {
            logger.warn(`[Simulacra] Source cloud indisponible pour ${collectionPath}, lecture locale seule`, (e as Error).message);
        }
        const virtualResults = await simulatorDb.virtualStore
            .where('forkId').equals(this.forkId)
            .filter(doc => doc.path.startsWith(collectionPath))
            .toArray();

        // Merge logic: Virtual data overrides or filters out real data
        const merged = [...realResults] as Array<T & { id?: string }>;
        
        virtualResults.forEach(v => {
            const virtualData = v.data as T & { id?: string };
            const index = merged.findIndex(m => m.id === virtualData.id);
            if (v.isDeleted) {
                if (index !== -1) merged.splice(index, 1);
            } else {
                if (index !== -1) merged[index] = virtualData;
                else merged.push(virtualData);
            }
        });

        return merged as T[];
    }

    onSnapshot<T = SovereignData>(
        path: string,
        callback: (data: T) => void,
        options?: IQueryOptions & { onError?: (error: Error) => void },
        _context?: NexusContext,
    ): () => void {
        // Un chemin à nombre de segments IMPAIR est une COLLECTION
        // (ex. tenants/{t}/orders → 3 segments), PAIR est un DOCUMENT.
        // Même convention que FirestoreAdapter.onSnapshot.
        //
        // ⚠️ Historique : cette méthode appelait `get()` sur TOUS les chemins,
        // y compris les collections. `get()` n'accepte qu'un document, donc les
        // 10 souscriptions du POS/KDS (orders, tables, zones, floors, stockItems,
        // products, categories, recipes, reservations, groups) jetaient
        // « Invalid document reference » toutes les 2 s — sans `.catch()`, donc en
        // unhandledRejection, et sans jamais appeler le `onError` de l'appelant.
        // Résultat : ~500 rejets/minute indéfiniment + fuite d'intervals.
        const isCollection = path.split('/').length % 2 !== 0;

        if (isCollection) {
            return pollingQuerySnapshot<T>(
                () => this.query<T>(path, options),
                (data) => callback(data as T),
                options,
            );
        }

        return pollingSnapshot<T>(
            () => this.get<T>(path),
            (data) => callback(data as T),
            options,
        );
    }

    batch(context?: NexusContext): INexusBatch {
        const ops: Array<() => Promise<void>> = [];
        return {
            set: (path: string, data: unknown) => {
                ops.push(() => this.set(path, data, undefined, context));
            },
            update: (path: string, data: unknown) => {
                ops.push(() => this.update(path, data as Partial<SovereignData>, context));
            },
            delete: (path: string) => {
                ops.push(() => this.delete(path, context));
            },
            increment: (path: string, field: string, amount: number) => {
                ops.push(() => this.increment(path, field, amount, context));
            },
            commit: async () => {
                for (const op of ops) await op();
            }
        };
    }

    async set<T = SovereignData>(path: string, data: T, options?: { merge?: boolean }, _context?: NexusContext): Promise<void> {
        let finalData = data;

        if (options?.merge) {
            const existing = await this.get<Record<string, unknown>>(path);
            finalData = { ...existing, ...data };
        }

        await simulatorDb.virtualStore.put({
            path,
            data: finalData as SovereignData,
            isDeleted: false,
            forkId: this.forkId,
            updatedAt: new Date().toISOString()
        });
    }

    async update<T = SovereignData>(path: string, data: Partial<T>, _context?: NexusContext): Promise<void> {
        const existing = await this.get<Record<string, unknown>>(path);
        const finalData = { ...existing, ...data };

        await simulatorDb.virtualStore.put({
            path,
            data: finalData as SovereignData,
            isDeleted: false,
            forkId: this.forkId,
            updatedAt: new Date().toISOString()
        });
    }

    async delete(path: string, _context?: NexusContext): Promise<void> {
        await simulatorDb.virtualStore.put({
            path,
            data: null,
            isDeleted: true,
            forkId: this.forkId,
            updatedAt: new Date().toISOString()
        });
    }
    
    async create<T = SovereignData>(path: string, data: T, context?: NexusContext): Promise<void> {
        await this.set(path, data, undefined, context);
    }

    generateId(_collectionPath: string): string {
        return IdGenerator.generateWithPrefix('sim');
    }

    serverTimestamp(): import('@/shared/nexus/contracts/infrastructure/storage.contracts').NexusTimestamp {
        return this.realAdapter.serverTimestamp();
    }

    async increment(path: string, field: string, amount: number, _context?: NexusContext): Promise<void> {
        const existing = await this.get<Record<string, number>>(path) || {} as Record<string, number>;
        existing[field] = (Number(existing[field]) || 0) + amount;
        await this.set(path, existing);
    }

    async runTransaction<T>(callback: (tx: INexusTransaction) => Promise<T>, context?: NexusContext): Promise<T> {
        const deferred: Array<() => Promise<void>> = [];
        const tx: INexusTransaction = {
            get: (path) => this.get(path, context),
            set: (path, data) => { deferred.push(() => this.set(path, data as SovereignData, undefined, context)); },
            update: (path, data) => { deferred.push(() => this.update(path, data as Partial<SovereignData>, context)); },
            delete: (path) => { deferred.push(() => this.delete(path, context)); },
        };
        const result = await callback(tx);
        for (const op of deferred) await op();
        return result;
    }
}
