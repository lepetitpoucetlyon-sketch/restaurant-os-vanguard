import type { INexusAdapter, INexusBatch, INexusTransaction, NexusContext, INexusQueryOptions } from '@/lib/nexus/types';
import type { SovereignData } from "@/shared/nexus/contracts";

/**
 * 🛰️ SqliteMemoryAdapter — Universal DB Engine Adapter (Agnostic Document & SQL)
 * High-performance in-memory / local storage implementation for Edge & Offline-First POS operations.
 */
export class SqliteMemoryAdapter implements INexusAdapter {
  private readonly store = new Map<string, SovereignData>();

  async get<T = SovereignData>(path: string, _context?: NexusContext): Promise<T | null> {
    const data = this.store.get(path);
    return data ? (structuredClone(data) as T) : null;
  }

  async query<T = SovereignData>(collectionPath: string, options?: INexusQueryOptions, _context?: NexusContext): Promise<T[]> {
    const results: T[] = [];
    const prefix = collectionPath.endsWith('/') ? collectionPath : `${collectionPath}/`;

    for (const [key, val] of this.store.entries()) {
      if (key.startsWith(prefix) && key.split('/').length === prefix.split('/').length) {
        let matches = true;

        if (options?.where) {
          for (const filter of options.where) {
            const fieldValue = (val as Record<string, unknown>)[filter.field];
            if (filter.operator === '==' && fieldValue !== filter.value) matches = false;
            if (filter.operator === '!=' && fieldValue === filter.value) matches = false;
            if (filter.operator === '>' && Number(fieldValue) <= Number(filter.value)) matches = false;
            if (filter.operator === '<' && Number(fieldValue) >= Number(filter.value)) matches = false;
          }
        }

        if (matches) {
          results.push(structuredClone(val) as T);
        }
      }
    }

    if (options?.limit) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  onSnapshot<T = SovereignData>(
    path: string,
    callback: (data: T) => void,
    _options?: INexusQueryOptions & { onError?: (error: Error) => void },
    context?: NexusContext
  ): () => void {
    this.get<T>(path, context).then((data) => {
      if (data) callback(data);
    }).catch(() => { /* snapshot best-effort */ });
    return () => {};
  }

  batch(_context?: NexusContext): INexusBatch {
    const operations: Array<() => void> = [];
    return {
      set: <T>(path: string, data: T) => operations.push(() => this.store.set(path, data as unknown as SovereignData)),
      update: <T>(path: string, data: Partial<T>) => operations.push(() => {
        const current = this.store.get(path) ?? {};
        this.store.set(path, { ...current, ...data } as unknown as SovereignData);
      }),
      increment: (path: string, field: string, amount: number) => operations.push(() => {
        const current = (this.store.get(path) ?? {}) as Record<string, number>;
        current[field] = (current[field] ?? 0) + amount;
        this.store.set(path, current as unknown as SovereignData);
      }),
      delete: (path: string) => operations.push(() => this.store.delete(path)),
      commit: async () => {
        operations.forEach(op => op());
      },
    };
  }

  async set<T = SovereignData>(path: string, data: T, options?: { merge?: boolean }, _context?: NexusContext): Promise<void> {
    if (options?.merge) {
      const current = this.store.get(path) ?? {};
      this.store.set(path, { ...current, ...data } as SovereignData);
    } else {
      this.store.set(path, data as SovereignData);
    }
  }

  async update<T = SovereignData>(path: string, data: Partial<T>, _context?: NexusContext): Promise<void> {
    const current = this.store.get(path) ?? {};
    this.store.set(path, { ...current, ...data } as SovereignData);
  }

  async increment(path: string, field: string, amount: number, _context?: NexusContext): Promise<void> {
    const current = (this.store.get(path) ?? {}) as Record<string, number>;
    current[field] = (current[field] ?? 0) + amount;
    this.store.set(path, current as unknown as SovereignData);
  }

  async create<T = SovereignData>(path: string, data: T, context?: NexusContext): Promise<void> {
    await this.set<T>(path, data, { merge: false }, context);
  }

  async delete(path: string, _context?: NexusContext): Promise<void> {
    this.store.delete(path);
  }

  generateId(collectionPath: string): string {
    return `${collectionPath.replace(/\//g, '_')}_${crypto.randomUUID()}`;
  }

  serverTimestamp(): import('@/shared/nexus/contracts/infrastructure/storage.contracts').NexusTimestamp {
    return new Date().toISOString();
  }

  async runTransaction<T>(callback: (tx: INexusTransaction) => Promise<T>, _context?: NexusContext): Promise<T> {
    const tx: INexusTransaction = {
      get: async <U>(path: string) => this.get<U>(path),
      set: (path: string, data: unknown) => { this.store.set(path, data as SovereignData); },
      update: (path: string, data: Partial<unknown>) => {
        const current = this.store.get(path) ?? {};
        this.store.set(path, { ...current, ...data } as SovereignData);
      },
      delete: (path: string) => { this.store.delete(path); },
    };
    return callback(tx);
  }
}
