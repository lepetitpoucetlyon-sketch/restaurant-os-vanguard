import { INexusAdapter, INexusQueryOptions, INexusBatch } from "@/lib/nexus/NexusAdapter";
import { simulatorDb } from '@/lib/simulator/SimulatorDB';
import { logger } from '@/lib/logger';
import { IdGenerator } from '@/lib/utils/IdGenerator';
import { SovereignGuard } from '@/lib/SovereignGuard';
import type { SovereignData, SovereignField } from '@/shared/nexus-contract';

const PRODUCTION_TENANT_ID = 'lepetitpoucet';

/**
 * 🌀 SimulacraAdapter - Restaurant OS (Grade X)
 * The Copy-on-Write Isolation Layer.
 * Reads from Real Adapter + Virtual Store. Writes ONLY to Virtual Store.
 */
export class SimulacraAdapter implements INexusAdapter {
    constructor(
        private realAdapter: INexusAdapter,
        private forkId: string = 'default_sim',
        activeTenantId?: string
    ) {
        // 🛡️ Sovereign Guard: Never allow simulation on production tenant
        if (activeTenantId === PRODUCTION_TENANT_ID) {
            const errorMsg = `[Simulacra Critical] Attempted to instantiate simulation bridge on Production Tenant (${PRODUCTION_TENANT_ID}). Blocked by SovereignGuard.`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        logger.info(`[Simulacra] Air-Gap Interface active for fork: ${forkId}`);
    }

    async get<T = import('@/shared/nexus-contract').SovereignValue>(path: string): Promise<T | null> {

        // 1. Check Virtual Store first
        const virtual = await simulatorDb.virtualStore.get(path);
        
        if (virtual) {
            if (virtual.isDeleted) return null;
            return virtual.data as T;
        }

        // 2. Fallback to Real Adapter (Read-only source)
        return this.realAdapter.get<T>(path);
    }

    /**
     * ⚠️ Query in Simulacra mode is complex. 
     * For Grade X Alpha, we merge real results with virtual overrides.
     */
    async query<T = import('@/shared/nexus-contract').SovereignValue>(collectionPath: string, options?: INexusQueryOptions): Promise<T[]> {

        const realResults = await this.realAdapter.query<T>(collectionPath, options);
        const virtualResults = await simulatorDb.virtualStore
            .where('forkId').equals(this.forkId)
            // This is a naive filter for path matching - in production we'd need a more robust approach
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

    onSnapshot<T = import('@/shared/nexus-contract').SovereignValue>(path: string, callback: (data: T) => void, options?: INexusQueryOptions): () => void {

        logger.warn("[Simulacra] Real-time snapshots are simulated via polling in Grade X Alpha.");
        
        // Initial load
        this.get<T>(path).then((data) => callback(data as T));
        
        // Polling simulation (every 2s)
        const interval = setInterval(async () => {
            const data = await this.get<T>(path);
            callback(data as T);
        }, 2000);

        return () => clearInterval(interval);
    }

    batch(): INexusBatch {
        const ops: Array<() => Promise<void>> = [];
        return {
            set: (path, data) => {
                ops.push(() => this.set(path, data));
            },
            update: (path, data) => {
                ops.push(() => this.update(path, data));
            },
            delete: (path) => {
                ops.push(() => this.delete(path));
            },
            increment: (path, field, amount) => {
                ops.push(() => this.increment(path, field, amount));
            },
            commit: async () => {
                for (const op of ops) await op();
            }
        };
    }

    async set<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: T, options?: { merge?: boolean }): Promise<void> {
        let finalData = data as SovereignData;

        if (options?.merge) {
            const existing = await this.get<SovereignData>(path);

            finalData = { ...existing, ...finalData };
        }

        finalData = await SovereignGuard.protectWrite(path, finalData);

        await simulatorDb.virtualStore.put({
            path,
            data: finalData as SovereignField,
            isDeleted: false,
            forkId: this.forkId,
            updatedAt: new Date().toISOString()
        });
    }

    async update<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: Partial<T>): Promise<void> {
        const existing = await this.get<SovereignData>(path);
        const finalData = await SovereignGuard.protectWrite(path, { ...existing, ...data } as SovereignData);


        await simulatorDb.virtualStore.put({
            path,
            data: finalData as SovereignField,
            isDeleted: false,
            forkId: this.forkId,
            updatedAt: new Date().toISOString()
        });
    }

    async delete(path: string): Promise<void> {
        await simulatorDb.virtualStore.put({
            path,
            data: null,
            isDeleted: true,
            forkId: this.forkId,
            updatedAt: new Date().toISOString()
        });
    }
    
    async create<T = import('@/shared/nexus-contract').SovereignData>(path: string, data: T): Promise<void> {
        await this.set(path, data);
    }

    generateId(collectionPath: string): string {
        return IdGenerator.generateWithPrefix('sim');
    }

    async increment(path: string, field: string, amount: number): Promise<void> {
        logger.warn("[Simulacra] Increment is mocked and not fully implemented.");
        const existing = await this.get<any>(path) || {};
        existing[field] = (existing[field] || 0) + amount;
        await this.set(path, existing);
    }
}
