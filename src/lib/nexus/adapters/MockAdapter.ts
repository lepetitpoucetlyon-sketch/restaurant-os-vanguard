import { INexusAdapter, INexusQueryOptions, INexusBatch } from "@/lib/nexus/NexusAdapter";
import { logger } from '@/lib/logger';

/**
 * 🧊 MockAdapter - In-memory implementation for high-speed testing (Grade VI)
 */
export class MockAdapter implements INexusAdapter {
    private storage: Record<string, unknown> = {};

    async get<T = unknown>(path: string): Promise<T | null> {
        return (this.storage[path] as T) || null;
    }

    async query<T = unknown>(collectionPath: string, options?: INexusQueryOptions): Promise<T[]> {
        let results = Object.entries(this.storage)
            .filter(([path]) => path.startsWith(collectionPath))
            .map(([, data]) => data);
        
        // Grade VI: Basic Mock Ordering
        if (options?.orderBy) {
            const { field, direction } = options.orderBy;
            results.sort((a, b) => {
                const valA = a[field];
                const valB = b[field];
                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // Basic Mock Limit
        if (options?.limit) {
            results = results.slice(0, options.limit);
        }

        return results;
    }

    onSnapshot<T = unknown>(path: string, callback: (data: T) => void): () => void {
        callback(this.storage[path] as T);
        return () => {}; // No-op for mock
    }

    batch(): INexusBatch {
        const operations: (() => void)[] = [];
        return {
            set: (path, data) => operations.push(() => { this.storage[path] = data; }),
            update: (path, data) => operations.push(() => { 
                this.storage[path] = { ...(this.storage[path] || {}), ...data }; 
            }),
            delete: (path) => operations.push(() => { delete this.storage[path]; }),
            commit: async () => {
                operations.forEach(op => op());
                logger.debug('[MockAdapter] Batch committed.');
            }
        };
    }

    async set<T = unknown>(path: string, data: T): Promise<void> {
        this.storage[path] = data;
    }

    async update<T = unknown>(path: string, data: Partial<T>): Promise<void> {
        this.storage[path] = { ...(this.storage[path] || {}), ...data };
    }

    async delete(path: string): Promise<void> {
        delete this.storage[path];
    }

    generateId(): string {
        return `mock_${Math.random().toString(36).substr(2, 9)}`;
    }
}
