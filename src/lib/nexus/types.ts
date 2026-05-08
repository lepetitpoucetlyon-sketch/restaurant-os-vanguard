export type { 
    IQueryOptions, 
    IBatchProcessor, 
    IDocumentStore, 
    IQueryEngine, 
    IRealtimeSubscriber 
} from '@/shared/nexus/contracts/infrastructure/storage.contracts';

import { IQueryOptions } from '@/shared/nexus/contracts/infrastructure/storage.contracts';

export interface NexusContext {
    vassalId: string;
    actorId: string;
}

export type INexusQueryOptions = IQueryOptions;
export type INexusBatch = import('@/shared/nexus/contracts/infrastructure/storage.contracts').IBatchProcessor;

export interface INexusAdapter {
    get<T = import('@/shared/nexus-contract').SovereignData>(path: string, context?: NexusContext): Promise<T | null>;
    query<T = import('@/shared/nexus-contract').SovereignData>(collectionPath: string, options?: INexusQueryOptions, context?: NexusContext): Promise<T[]>;
    onSnapshot<T = import('@/shared/nexus-contract').SovereignData>(
        path: string, 
        callback: (data: T) => void, 
        options?: INexusQueryOptions & { onError?: (error: Error) => void },
        context?: NexusContext
    ): () => void;
    batch(context?: NexusContext): INexusBatch;
    set<T = import('@/shared/nexus-contract').SovereignData>(path: string, data: T, options?: { merge?: boolean }, context?: NexusContext): Promise<void>;
    update<T = import('@/shared/nexus-contract').SovereignData>(path: string, data: Partial<T>, context?: NexusContext): Promise<void>;
    increment(path: string, field: string, amount: number, context?: NexusContext): Promise<void>;
    create<T = import('@/shared/nexus-contract').SovereignData>(path: string, data: T, context?: NexusContext): Promise<void>;
    delete(path: string, context?: NexusContext): Promise<void>;
    generateId(collectionPath: string): string;
}
