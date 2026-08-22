import { INexusAdapter, INexusBatch, INexusTransaction, NexusContext } from "@/lib/nexus/types";
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
    
    async get<T = unknown>(path: string, _context?: NexusContext): Promise<T | null> {
        return (this.storage[path] as T) || null;
    }

    async query<T = unknown>(collectionPath: string, options?: IQueryOptions, _context?: NexusContext): Promise<T[]> {
        let results = Object.entries(this.storage)
            .filter(([path]) => path.startsWith(collectionPath))
            .map(([, data]) => data as Record<string, unknown>);

        if (options?.where) {
            for (const clause of options.where) {
                results = results.filter(item => {
                    const val = item[clause.field];
                    if (clause.operator === "==") return val === clause.value;
                    if (clause.operator === "!=") return val !== clause.value;
                    if (clause.operator === ">") return (val as number) > (clause.value as number);
                    if (clause.operator === ">=") return (val as number) >= (clause.value as number);
                    if (clause.operator === "<") return (val as number) < (clause.value as number);
                    if (clause.operator === "<=") return (val as number) <= (clause.value as number);
                    if (clause.operator === "in") return Array.isArray(clause.value) && clause.value.includes(val);
                    return true;
                });
            }
        }
        
        if (options?.orderBy) {
            const { field, direction } = options.orderBy;
            results.sort((a, b) => {
                const valA = a[field] as unknown; // Cast for comparison
                const valB = b[field] as unknown;
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

    onSnapshot<T = unknown>(path: string, callback: (data: T) => void, _options?: IQueryOptions, _context?: NexusContext): () => void {
        callback(this.storage[path] as T);
        return () => {}; 
    }

    batch(_context?: NexusContext): INexusBatch {
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

    async set<T = unknown>(path: string, data: T, _options?: { merge?: boolean }, _context?: NexusContext): Promise<void> {
        this.storage[path] = data;
    }

    async create<T = unknown>(path: string, data: T, _context?: NexusContext): Promise<void> {
        return this.set(path, data);
    }

    async update<T = unknown>(path: string, data: Partial<T>, _context?: NexusContext): Promise<void> {
        const existingData = (this.storage[path] || {}) as Record<string, unknown>;
        this.storage[path] = { ...existingData, ...data };
    }

    async increment(path: string, field: string, amount: number, _context?: NexusContext): Promise<void> {
        const existingData = (this.storage[path] || {}) as Record<string, unknown>;
        const currentValue = typeof existingData[field] === 'number' ? existingData[field] as number : 0;
        await this.update(path, { [field]: currentValue + amount } as Record<string, unknown>);
    }

    async delete(path: string, _context?: NexusContext): Promise<void> {
        delete this.storage[path];
    }

    generateId(): string {
        return `mock_${Math.random().toString(36).substr(2, 9)}`;
    }

    serverTimestamp(): import('@/shared/nexus/contracts/infrastructure/storage.contracts').NexusTimestamp {
        return new Date();
    }

    async runTransaction<T>(callback: (tx: INexusTransaction) => Promise<T>, _context?: NexusContext): Promise<T> {
        const deferred: Array<() => void> = [];
        const tx: INexusTransaction = {
            get: (path) => this.get(path),
            set: (path, data) => { deferred.push(() => { this.storage[path] = data; }); },
            update: (path, data) => { deferred.push(() => {
                const existing = (this.storage[path] ?? {}) as Record<string, unknown>;
                this.storage[path] = { ...existing, ...(data as Record<string, unknown>) };
            }); },
            delete: (path) => { deferred.push(() => { delete this.storage[path]; }); },
        };
        const result = await callback(tx);
        for (const op of deferred) op();
        return result;
    }
}
