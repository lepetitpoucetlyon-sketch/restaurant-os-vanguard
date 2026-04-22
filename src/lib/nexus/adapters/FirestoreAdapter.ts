import { 
    firestore 
} from '@/lib/firebase';
import { 
    doc, 
    collection, 
    getDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    where, 
    onSnapshot, 
    writeBatch, 
    setDoc, 
    updateDoc,
    deleteDoc,
    QueryConstraint
} from 'firebase/firestore';
import { INexusAdapter, INexusQueryOptions, INexusBatch } from "@/lib/nexus/NexusAdapter";
import { logger } from '@/lib/logger';
import { validateMutation } from '@/shared/validation/SchemaRegistry';
import { SovereignGuard } from '@/lib/SovereignGuard';
import type { SovereignData } from '@/shared/nexus-contract';

/**
 * 🔥 FirestoreAdapter - Real implementation using Firebase SDK
 */
export class FirestoreAdapter implements INexusAdapter {
    
    private validate(path: string, data: import('@/shared/nexus-contract').SovereignData) {

        const parts = path.split('/');
        let moduleId = 'COMMON';
        let key = parts[parts.length - 1];

        if (parts.includes('tenants')) {
            moduleId = parts[2]?.toUpperCase() || 'COMMON';
            key = parts[3] || key;
        }

        const audit = validateMutation(moduleId, key, data);
        if (!audit.success) {
            logger.error(`[Firestore-Guard] Schema Validation FAILED for [${path}]:`, audit.errors);
            throw new Error(`SCHEMA_VALIDATION_FAILURE: ${audit.errors?.join(', ')}`);
        }
    }

    private async prepareWrite(path: string, data: SovereignData): Promise<SovereignData> {
        this.validate(path, data);
        return SovereignGuard.protectWrite(path, data);
    }

    async get<T = import('@/shared/nexus-contract').SovereignValue>(path: string): Promise<T | null> {
        const snap = await getDoc(doc(firestore, path));
        return snap.exists() ? { id: snap.id, ...snap.data() } as T : null;
    }


    async query<T = import('@/shared/nexus-contract').SovereignValue>(collectionPath: string, options?: INexusQueryOptions): Promise<T[]> {

        const constraints: QueryConstraint[] = [];
        
        if (options?.where) {
            options.where.forEach(w => constraints.push(where(w.field, w.operator, w.value)));
        }
        if (options?.orderBy) {
            constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
        }
        if (options?.limit) {
            constraints.push(limit(options.limit));
        }

        const q = query(collection(firestore, collectionPath), ...constraints);
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    }

    onSnapshot<T = import('@/shared/nexus-contract').SovereignValue>(path: string, callback: (data: T) => void, options?: INexusQueryOptions & { onError?: (error: Error) => void }): () => void {

        const isCollection = path.split('/').length % 2 !== 0;
        
        if (isCollection) {
            const constraints: QueryConstraint[] = [];
            if (options?.where) {
                options.where.forEach(w => constraints.push(where(w.field, w.operator, w.value)));
            }
            if (options?.orderBy) {
                constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
            }
            if (options?.limit) {
                constraints.push(limit(options.limit));
            }
            const q = query(collection(firestore, path), ...constraints);
            return onSnapshot(q, (snap) => {
                const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                callback(results as T);
            }, options?.onError);
        } else {
            return onSnapshot(doc(firestore, path), (snap) => {
                callback((snap.exists() ? { id: snap.id, ...snap.data() } : null) as T);
            }, options?.onError);
        }
    }

    batch(): INexusBatch {
        const batch = writeBatch(firestore);
        const operations: Promise<
            | { type: 'set'; path: string; data: SovereignData }
            | { type: 'update'; path: string; data: SovereignData }
            | { type: 'delete'; path: string }
        >[] = [];

        return {
            set: (path, data) => {
                operations.push(
                    this.prepareWrite(path, data as SovereignData).then((prepared) => ({
                        type: 'set' as const,
                        path,
                        data: prepared
                    }))
                );
            },
            update: (path, data) => {
                operations.push(
                    this.prepareWrite(path, data as SovereignData).then((prepared) => ({
                        type: 'update' as const,
                        path,
                        data: prepared
                    }))
                );
            },

            delete: (path) => {
                operations.push(Promise.resolve({ type: 'delete' as const, path }));
            },
            commit: async () => {
                const preparedOperations = await Promise.all(operations);
                preparedOperations.forEach((operation) => {
                    if (operation.type === 'set') {
                        batch.set(doc(firestore, operation.path), operation.data);
                    } else if (operation.type === 'update') {
                        batch.update(doc(firestore, operation.path), operation.data);
                    } else {
                        batch.delete(doc(firestore, operation.path));
                    }
                });

                await batch.commit();
            }
        };
    }

    async set<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: T, options?: { merge?: boolean }): Promise<void> {
        const prepared = (typeof data === 'object' && data !== null) 
            ? await this.prepareWrite(path, data as unknown as SovereignData)
            : data as unknown as SovereignData;
        await setDoc(doc(firestore, path), prepared, options);
    }


    async update<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: Partial<T>): Promise<void> {
        const prepared = (typeof data === 'object' && data !== null)
            ? await this.prepareWrite(path, data as unknown as SovereignData)
            : data as unknown as SovereignData;
        await updateDoc(doc(firestore, path), prepared);
    }
    
    async create<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: T): Promise<void> {
        return this.set(path, data, { merge: false });
    }


    async delete(path: string): Promise<void> {
        await deleteDoc(doc(firestore, path));
    }

    generateId(collectionPath: string): string {
        return doc(collection(firestore, collectionPath)).id;
    }
}
