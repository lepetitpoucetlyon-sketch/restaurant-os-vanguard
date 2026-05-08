import { INexusAdapter, INexusQueryOptions, INexusBatch, NexusContext } from "@/lib/nexus/types";
import { logger } from '@/lib/logger';
import { 
    IDocumentStore, 
    IQueryEngine, 
    IRealtimeSubscriber, 
    IQueryOptions 
} from '@/shared/nexus/contracts/infrastructure/storage.contracts';

/**
 * 🧊 MockAdapter - In-memory implementation for high-speed testing (Grade VI - Pure I/O)
 */
export class MockAdapter implements INexusAdapter, IDocumentStore, IQueryEngine, IRealtimeSubscriber {
    private storage: Record<string, unknown> = {};
    
    async get<T = unknown>(path: string, context?: NexusContext): Promise<T | null> {
        return (this.storage[path] as T) || null;
    }

    async query<T = unknown>(collectionPath: string, options?: IQueryOptions, context?: NexusContext): Promise<T[]> {
        let results = Object.entries(this.storage)
            .filter(([path]) => path.startsWith(collectionPath))
            .map(([, data]) => data as Record<string, unknown>);
        
        if (options?.orderBy) {
            const { field, direction } = options.orderBy;
            results.sort((a, b) => {
                const valA = a[field] as any; // Cast for comparison
                const valB = b[field] as any;
                if (valA === null || valA === undefined) return direction === 'asc' ? 1 : -1;
                if (valB === null || valB === undefined) return direction === 'asc' ? -1 : 1;
                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        if (options?.limit) {
            results = results.slice(0, options.limit);
        }

        return results as unknown as T[];
    }

    onSnapshot<T = unknown>(path: string, callback: (data: T) => void, options?: IQueryOptions, context?: NexusContext): () => void {
        callback(this.storage[path] as T);
        return () => {}; 
    }

    batch(context?: NexusContext): INexusBatch {
        const operations: Array<() => Promise<void>> = [];
        return {
            set: (path: string, data: unknown) => operations.push(async () => { await this.set(path, data); }),
            update: (path: string, data: Record<string, unknown>) => operations.push(async () => { 
                await this.update(path, data); 
            }),
            increment: (path: string, field: string, amount: number) => operations.push(async () => {
                await this.increment(path, field, amount);
            }),
            delete: (path: string) => operations.push(async () => { delete this.storage[path]; }),
            commit: async () => {
                for (const op of operations) {
                    await op();
                }
                logger.debug('[MockAdapter] Batch committed.');
            }
        };
    }

    async set<T = unknown>(path: string, data: T, options?: { merge?: boolean }, context?: NexusContext): Promise<void> {
        this.storage[path] = data;
    }

    async create<T = unknown>(path: string, data: T, context?: NexusContext): Promise<void> {
        return this.set(path, data);
    }

    async update<T = unknown>(path: string, data: Partial<T>, context?: NexusContext): Promise<void> {
        const existingData = (this.storage[path] || {}) as Record<string, unknown>;
        this.storage[path] = { ...existingData, ...data };
    }

    async increment(path: string, field: string, amount: number, context?: NexusContext): Promise<void> {
        const existingData = (this.storage[path] || {}) as Record<string, unknown>;
        const currentValue = typeof existingData[field] === 'number' ? existingData[field] as number : 0;
        await this.update(path, { [field]: currentValue + amount } as Record<string, unknown>);
    }

    async delete(path: string, context?: NexusContext): Promise<void> {
        delete this.storage[path];
    }

    generateId(): string {
        return `mock_${Math.random().toString(36).substr(2, 9)}`;
    }
}
