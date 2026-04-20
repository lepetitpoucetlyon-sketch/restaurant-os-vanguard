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

/**
 * 🔥 FirestoreAdapter - Real implementation using Firebase SDK
 */
export class FirestoreAdapter implements INexusAdapter {
    
    async get(path: string): Promise<any | null> {
        const snap = await getDoc(doc(firestore, path));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }

    async query(collectionPath: string, options?: INexusQueryOptions): Promise<any[]> {
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

    onSnapshot(path: string, callback: (data: any) => void, options?: INexusQueryOptions & { onError?: (error: any) => void }): () => void {
        const isCollection = path.split('/').length % 2 !== 0; // Simple heuristic: odd parts = collection
        
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
            set: (path, data) => batch.set(doc(firestore, path) as any, data),
            update: (path, data) => batch.update(doc(firestore, path) as any, data as any),
            delete: (path) => batch.delete(doc(firestore, path) as any),
            commit: () => batch.commit()
        };
    }

    async set(path: string, data: any, options?: { merge?: boolean }): Promise<void> {
        await setDoc(doc(firestore, path), data, options);
    }

    async update(path: string, data: any): Promise<void> {
        await updateDoc(doc(firestore, path), data);
    }

    async delete(path: string): Promise<void> {
        await deleteDoc(doc(firestore, path));
    }

    generateId(collectionPath: string): string {
        return doc(collection(firestore, collectionPath)).id;
    }
}
