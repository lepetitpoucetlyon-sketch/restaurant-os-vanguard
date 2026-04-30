import { 
    getFirestore, 
    doc, 
    getDoc, 
    getDocs, 
    collection, 
    query, 
    where, 
    orderBy, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot,
    increment,
    writeBatch,
    limit,
    Firestore
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import * as Sentry from "@sentry/nextjs";
import { z } from 'zod';
import { SovereignMath } from '@shared/services/SovereignMath';
import { logger } from '@/lib/logger';
import { INexusAdapter, INexusQueryOptions, INexusBatch } from '@/lib/nexus/NexusAdapter';

/**
 * 🏛️ FirestoreBatch - Grade X+++
 */
class FirestoreBatch implements INexusBatch {
    private batch: import('firebase/firestore').WriteBatch;
    private db: Firestore;

    constructor(db: Firestore) {
        this.db = db;
        this.batch = writeBatch(db);
    }

    set<T = any>(path: string, data: T): void {
        const docRef = doc(this.db, path);
        this.batch.set(docRef, data as any);
    }

    update<T = any>(path: string, data: Partial<T>): void {
        const docRef = doc(this.db, path);
        this.batch.update(docRef, data as any);
    }

    increment(path: string, field: string, amount: number): void {
        const docRef = doc(this.db, path);
        this.batch.update(docRef, { [field]: increment(amount) });
    }

    delete(path: string): void {
        const docRef = doc(this.db, path);
        this.batch.delete(docRef);
    }

    async commit(): Promise<void> {
        await this.batch.commit();
    }
}

/**
 * 🏛️ FirestoreAdapter - Grade X+++
 * Sovereign Class compliant with INexusAdapter.
 */
export class FirestoreAdapter implements INexusAdapter {
    private db: Firestore;

    constructor() {
        this.db = getFirestore(app);
    }

    async get<T = any>(path: string): Promise<T | null> {
        try {
            const docRef = doc(this.db, path);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() } as T;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    async query<T = any>(collectionPath: string, options?: INexusQueryOptions): Promise<T[]> {
        try {
            let q = query(collection(this.db, collectionPath));

            if (options?.where) {
                options.where.forEach(w => {
                    q = query(q, where(w.field, w.operator as any, w.value));
                });
            }

            if (options?.orderBy) {
                q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
            }

            if (options?.limit) {
                q = query(q, limit(options.limit));
            }

            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    onSnapshot<T = any>(
        path: string, 
        callback: (data: T) => void, 
        options?: INexusQueryOptions & { onError?: (error: Error) => void }
    ): () => void {
        const isCollection = path.split('/').length % 2 !== 0;
        const ref = isCollection ? collection(this.db, path) : doc(this.db, path);
        
        return onSnapshot(ref as any, (snap: any) => {
            if (isCollection) {
                const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                callback(data as any);
            } else {
                const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
                callback(data as T);
            }
        }, options?.onError);
    }

    batch(): INexusBatch {
        return new FirestoreBatch(this.db);
    }

    async set<T = any>(path: string, data: T, options?: { merge?: boolean }): Promise<void> {
        const docRef = doc(this.db, path);
        await setDoc(docRef, data as any, options);
    }

    async update<T = any>(path: string, data: Partial<T>): Promise<void> {
        const docRef = doc(this.db, path);
        await updateDoc(docRef, data as any);
    }

    async increment(path: string, field: string, amount: number): Promise<void> {
        const docRef = doc(this.db, path);
        await updateDoc(docRef, { [field]: increment(amount) });
    }

    async create<T = any>(path: string, data: T): Promise<void> {
        const colRef = collection(this.db, path);
        await addDoc(colRef, data as any);
    }

    async delete(path: string): Promise<void> {
        const docRef = doc(this.db, path);
        await deleteDoc(docRef);
    }

    generateId(collectionPath: string): string {
        return doc(collection(this.db, collectionPath)).id;
    }
}
