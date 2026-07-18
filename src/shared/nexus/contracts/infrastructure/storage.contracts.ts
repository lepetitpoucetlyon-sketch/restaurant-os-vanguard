export type StorageQueryOperator = 
  | '==' | '!=' | '<' | '<=' | '>' | '>=' 
  | 'array-contains' | 'array-contains-unknown' 
  | 'in' | 'not-in';

export interface QueryFilter {
  field: string;
  operator: StorageQueryOperator;
  value: unknown;
}

export interface IQueryOptions {
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  where?: QueryFilter[];
}

export interface IBatchProcessor {
  set<T>(path: string, data: T): void;
  update<T>(path: string, data: Partial<T>): void;
  increment(path: string, field: string, amount: number): void;
  delete(path: string): void;
  commit(): Promise<void>;
}

export interface IDocumentStore {
  get<T>(path: string): Promise<T | null>;
  set<T>(path: string, data: T, options?: { merge?: boolean }): Promise<void>;
  update<T>(path: string, data: Partial<T>): Promise<void>;
  increment(path: string, field: string, amount: number): Promise<void>;
  create<T>(path: string, data: T): Promise<void>;
  delete(path: string): Promise<void>;
  generateId(collectionPath: string): string;
  serverTimestamp(): unknown;
}

export interface IQueryEngine {
  query<T>(collectionPath: string, options?: IQueryOptions): Promise<T[]>;
}

export interface IRealtimeSubscriber {
  onSnapshot<T>(
    path: string, 
    callback: (data: T) => void, 
    options?: IQueryOptions & { onError?: (error: Error) => void }
  ): () => void;
}
