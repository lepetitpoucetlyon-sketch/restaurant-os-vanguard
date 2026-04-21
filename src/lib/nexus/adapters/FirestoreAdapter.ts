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
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
                callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, options?.onError);
        } else {
            return onSnapshot(doc(firestore, path), (snap) => {
                callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
            }, options?.onError);
        }
    }

    batch(): INexusBatch {
        const batch = writeBatch(firestore);
        return {
            set: (path, data) => {
                this.validate(path, data);
                batch.set(doc(firestore, path), data);
            },
            update: (path, data) => {
                this.validate(path, data as import('@/shared/nexus-contract').SovereignData);
                batch.update(doc(firestore, path), data as import('@/shared/nexus-contract').SovereignData); // Required by Firestore for partial updates
            },

            delete: (path) => batch.delete(doc(firestore, path)),
            commit: () => batch.commit()
        };
    }

    async set<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: T, options?: { merge?: boolean }): Promise<void> {
        this.validate(path, data as import('@/shared/nexus-contract').SovereignData);
        await setDoc(doc(firestore, path), data, options);
    }


    async update<T = import('@/shared/nexus-contract').SovereignValue>(path: string, data: Partial<T>): Promise<void> {
        this.validate(path, data as import('@/shared/nexus-contract').SovereignData);
        await updateDoc(doc(firestore, path), data);
    }


    async delete(path: string): Promise<void> {
        await deleteDoc(doc(firestore, path));
    }

    generateId(collectionPath: string): string {
        return doc(collection(firestore, collectionPath)).id;
    }
}
