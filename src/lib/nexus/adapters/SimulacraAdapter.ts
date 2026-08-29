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
const OP_MATCHERS: Record<string, (a: unknown, b: unknown) => boolean> = {
    '==': (a, b) => a === b,
    '!=': (a, b) => a !== b,
    '>': (a, b) => Number(a) > Number(b),
    '>=': (a, b) => Number(a) >= Number(b),
    '<': (a, b) => Number(a) < Number(b),
    '<=': (a, b) => Number(a) <= Number(b),
    'array-contains': (a, b) => Array.isArray(a) && (a as unknown[]).includes(b),
    'in': (a, b) => Array.isArray(b) && (b as unknown[]).includes(a),
    'not-in': (a, b) => Array.isArray(b) && !(b as unknown[]).includes(a),
    'array-contains-any': (a, b) => Array.isArray(a) && Array.isArray(b) && (a as unknown[]).some(x => (b as unknown[]).includes(x)),
};

function matchFilter(itemVal: unknown, op: string, val: unknown): boolean {
    const matcher = OP_MATCHERS[op];
    return matcher ? matcher(itemVal, val) : true;
}

export class SimulacraAdapter implements INexusAdapter, IDocumentStore, IQueryEngine, IRealtimeSubscriber {
    constructor(
        private realAdapter: INexusAdapter,
        private forkId: string = 'default_sim'
    ) {
        logger.info(`[Simulacra] Air-Gap Interface active for fork: ${forkId}`);
    }

    // ── Coupe-circuit sur la source cloud ────────────────────────────────────
    // Simulacra est une « Air-Gap Interface » : elle doit fonctionner SANS le
    // cloud. Or `get()`/`query()` interrogeaient le vrai adapter à CHAQUE appel,
    // y compris après des centaines d'échecs — et le polling (2 s × 10
    // collections) transformait ça en trafic permanent.
    //
    // Mesuré le 2026-08-26 en local, application au repos :
    //   54 requêtes vers firestore.googleapis.com en 37 s (1,5/s),
    //   toutes en `permission-denied`.
    // Chacune part sur le réseau, attend le rejet, et le SDK Firebase retente
    // derrière — d'où une interface poussive (navigation entre catégories).
    //
    // L'état est STATIQUE : les 10 pollers partagent le même verdict. Si
    // Firestore refuse une collection faute d'auth, il les refuse toutes ;
    // les faire échouer chacune de leur côté multiplierait le coût par dix.
    private static echecsCloud = 0;
    private static cloudCoupeJusqua = 0;
    /** Trois échecs d'affilée suffisent : une panne d'auth n'est pas intermittente. */
    private static readonly SEUIL_COUPURE = 3;
    /** On re-sonde périodiquement : le backend peut revenir (login, réseau rétabli). */
    private static readonly REPOS_MS = 60_000;

    private cloudJoignable(): boolean {
        return Date.now() >= SimulacraAdapter.cloudCoupeJusqua;
    }

    private noterEchecCloud(quoi: string, err: unknown): void {
        SimulacraAdapter.echecsCloud += 1;
        if (SimulacraAdapter.echecsCloud >= SimulacraAdapter.SEUIL_COUPURE) {
            SimulacraAdapter.cloudCoupeJusqua = Date.now() + SimulacraAdapter.REPOS_MS;
            SimulacraAdapter.echecsCloud = 0;
            logger.warn(
                `[Simulacra] Source cloud coupée ${SimulacraAdapter.REPOS_MS / 1000}s après ${SimulacraAdapter.SEUIL_COUPURE} échecs — lecture 100% locale.`,
                `dernier: ${quoi} — ${(err as Error)?.message ?? err}`,
            );
        }
    }

    private noterSuccesCloud(): void {
        SimulacraAdapter.echecsCloud = 0;
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
        if (!this.cloudJoignable()) return null;   // coupe-circuit : on n'appelle même pas
        try {
            const r = await this.realAdapter.get<T>(path);
            this.noterSuccesCloud();
            return r;
        } catch (e) {
            this.noterEchecCloud(path, e);
            return null;
        }
    }

private sortResults<T>(results: T[], orderBy: NonNullable<IQueryOptions['orderBy']>): void {
        const field = orderBy.field;
        const dir = orderBy.direction === 'desc' ? -1 : 1;
        results.sort((a, b) => {
            const valA = (a as Record<string, unknown>)[field];
            const valB = (b as Record<string, unknown>)[field];
            if (valA === valB) return 0;
            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;
            return valA > valB ? dir : -dir;
        });
    }

    private mergeVirtualRecords<T>(realResults: T[], virtualResults: Array<{ isDeleted?: boolean; data?: unknown }>): Array<T & { id?: string }> {
        const merged = [...realResults] as Array<T & { id?: string }>;
        for (const v of virtualResults) {
            const virtualData = v.data as T & { id?: string };
            const index = merged.findIndex(m => m.id === virtualData.id);
            if (v.isDeleted) {
                if (index !== -1) merged.splice(index, 1);
            } else {
                if (index !== -1) merged[index] = virtualData;
                else merged.push(virtualData);
            }
        }
        return merged;
    }

    async query<T = SovereignData>(collectionPath: string, options?: IQueryOptions, _context?: NexusContext): Promise<T[]> {
        let realResults: T[] = [];
        if (this.cloudJoignable()) {
            try {
                realResults = await this.realAdapter.query<T>(collectionPath, options);
                this.noterSuccesCloud();
            } catch (e) {
                this.noterEchecCloud(collectionPath, e);
            }
        }
        const virtualResults = await simulatorDb.virtualStore
            .where('forkId').equals(this.forkId)
            .filter(doc => doc.path.startsWith(collectionPath))
            .toArray();

        let finalResults = this.mergeVirtualRecords<T>(realResults, virtualResults);

        if (options?.where && options.where.length > 0) {
            for (const { field, operator: op, value: val } of options.where) {
                finalResults = finalResults.filter(item => {
                    const itemVal = (item as Record<string, unknown>)[field];
                    return matchFilter(itemVal, op, val);
                });
            }
        }

        if (options?.orderBy) {
            this.sortResults(finalResults, options.orderBy);
        }

        if (options?.limit && options.limit > 0) {
            finalResults = finalResults.slice(0, options.limit);
        }

        return finalResults as T[];
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
