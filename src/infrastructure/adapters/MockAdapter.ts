import { INexusAdapter, INexusQueryOptions, INexusBatch } from "@/lib/nexus/NexusAdapter";
import { logger } from '@/lib/logger';
import { SovereignGuard } from '@nexus/guards/SovereignGuard';
import type { SovereignData } from '@/shared/nexus-contract';

/**
 * 🧊 MockAdapter - In-memory implementation for high-speed testing (Grade VI)
 */
export class MockAdapter implements INexusAdapter {
    private storage: import('@/shared/nexus-contract').SovereignData = {};
    
    async get<T = import('@/shared/nexus-contract').SovereignValue>(path: string): Promise<T | null> {
        return (this.storage[path] as T) || null;
    }


    async query<T = import('@/shared/nexus-contract').SovereignValue>(collectionPath: string, options?: INexusQueryOptions): Promise<T[]> {

        let results = Object.entries(this.storage)
            .filter(([path]) => path.startsWith(collectionPath))
            .map(([, data]) => data as SovereignData);
        
        // Grade VI: Basic Mock Ordering
        if (options?.orderBy) {
            const { field, direction } = options.orderBy;
            results.sort((a, b) => {
                const valA = a[field];
                const valB = b[field];
                if (valA === null || valA === undefined) return direction === 'asc' ? 1 : -1;
                if (valB === null || valB === undefined) return direction === 'asc' ? -1 : 1;
                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // Basic Mock Limit
        if (options?.limit) {
            results = results.slice(0, options.limit);
        }

        return results as T[];
    }

    onSnapshot<T = import('@/shared/nexus-contract').SovereignValue>(path: string, callback: (data: T) => void): () => void {

        callback(this.storage[path] as T);
        return () => {}; // No-op for mock
    }

    batch(): INexusBatch {
        const operations: Array<() => Promise<void>> = [];
        return {
            set: (path, data) => operations.push(async () => { await this.set(path, data); }),
            update: (path, data) => operations.push(async () => { 
                await this.update(path, data); 
            }),
            increment: (path, field, amount) => operations.push(async () => {
                await this.increment(path, field, amount);
            }),
            delete: (path) => operations.push(async () => { delete this.storage[path]; }),
            commit: async () => {
                for (const op of operations) {
                    await op();
                }
                logger.debug('[MockAdapter] Batch committed.');
            }
        };
    }

    async set<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: T): Promise<void> {
        this.storage[path] = await SovereignGuard.protectWrite(path, data as SovereignData);
    }

    async create<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: T): Promise<void> {
        return this.set(path, data);
    }

    async update<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: Partial<T>): Promise<void> {
        const existingData = this.storage[path];
        const baseData = existingData && typeof existingData === 'object' && !Array.isArray(existingData)
            ? existingData as SovereignData
            : {};
        const mergedData = { ...baseData, ...(data as Record<string, import('@/shared/nexus-contract').SovereignField>) } as SovereignData;
        this.storage[path] = await SovereignGuard.protectWrite(path, mergedData);
    }

    async increment(path: string, field: string, amount: number): Promise<void> {
        const existingData = (this.storage[path] || {}) as Record<string, import("@/shared/nexus-contract").SovereignValue>;
        const currentValue = typeof existingData[field] === 'number' ? existingData[field] : 0;
        await this.update(path, { [field]: currentValue + amount });
    }

    async delete(path: string): Promise<void> {
        delete this.storage[path];
    }

    generateId(): string {
        return `mock_${Math.random().toString(36).substr(2, 9)}`;
    }
}
