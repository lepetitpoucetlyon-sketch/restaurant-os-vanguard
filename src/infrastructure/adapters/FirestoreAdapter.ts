import { 
    getFirestore, 
    doc, 
    getDoc, 
    getDocs, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit,
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot,
    increment,
    Firestore,
    DocumentData,
    QueryConstraint,
    WhereFilterOp
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import * as Sentry from "@sentry/nextjs";
import { INexusAdapter, IQueryOptions, INexusBatch, NexusContext } from '@/lib/nexus/types';
import { FirestoreBatch } from './FirestoreBatch';

/**
 * 🛰️ FirestoreAdapter - Grade X (Pure I/O)
 */
export class FirestoreAdapter implements INexusAdapter {
    private db: Firestore;

    constructor() {
        this.db = getFirestore(app);
    }

    async get<T>(path: string, _context?: NexusContext): Promise<T | null> {
        try {
            const docRef = doc(this.db, path);
            const snap = await getDoc(docRef);
            return snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as T) : null;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    async query<T = unknown>(collectionPath: string, options?: IQueryOptions, _context?: NexusContext): Promise<T[]> {
        try {
            const constraints: QueryConstraint[] = [];
            if (options?.where) {
                options.where.forEach((w: { field: string; operator: string; value: unknown }) => {
                    constraints.push(where(w.field, w.operator as WhereFilterOp, w.value));
                });
            }
            if (options?.orderBy) {
                constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
            }
            if (options?.limit) {
                constraints.push(limit(options.limit));
            }

            const q = query(collection(this.db, collectionPath), ...constraints);
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    onSnapshot<T>(
        path: string, 
        callback: (data: T) => void, 
        options?: IQueryOptions & { onError?: (error: Error) => void },
        _context?: NexusContext
    ): () => void {
        const isCollection = path.split('/').length % 2 !== 0;
        if (isCollection) {
            const q = query(collection(this.db, path));
            return onSnapshot(q, (snap) => {
                const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                callback(data as unknown as T);
            }, options?.onError);
        } else {
            return onSnapshot(doc(this.db, path), (snap) => {
                const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
                callback(data as unknown as T);
            }, options?.onError);
        }
    }

    batch(_context?: NexusContext): INexusBatch {
        return new FirestoreBatch(this.db);
    }

    async set<T>(path: string, data: T, options?: { merge?: boolean }, _context?: NexusContext): Promise<void> {
        await setDoc(doc(this.db, path), data as DocumentData, options ?? {});
    }

    async update<T>(path: string, data: Partial<T>, _context?: NexusContext): Promise<void> {
        await updateDoc(doc(this.db, path), data as DocumentData);
    }

    async increment(path: string, field: string, amount: number, _context?: NexusContext): Promise<void> {
        await updateDoc(doc(this.db, path), { [field]: increment(amount) });
    }

    async create<T>(path: string, data: T, _context?: NexusContext): Promise<void> {
        await addDoc(collection(this.db, path), data as DocumentData);
    }

    async delete(path: string, _context?: NexusContext): Promise<void> {
        await deleteDoc(doc(this.db, path));
    }

    generateId(collectionPath: string): string {
        return doc(collection(this.db, collectionPath)).id;
    }
}
