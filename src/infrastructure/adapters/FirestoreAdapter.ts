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
import { FirestoreHydrator } from '@/lib/sovereign/firestoreHydrator';
import { app } from '@/lib/firebase';
import * as Sentry from "@sentry/nextjs";
import { z } from 'zod';
import { SovereignMath } from '@shared/services/SovereignMath';
import { logger } from '@/lib/logger';
import { INexusAdapter, INexusQueryOptions, INexusBatch, Nexus } from '@/lib/nexus/NexusAdapter';
import { withTenantScope } from '@/lib/sovereign/withTenantScope';

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
        this.batch.set(docRef, data as import('firebase/firestore').DocumentData);
    }

    update<T = any>(path: string, data: Partial<T>): void {
        const docRef = doc(this.db, path);
        this.batch.update(docRef, data as import('firebase/firestore').DocumentData);
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

function hydrateBasedOnPath(pathOrCollection: string, data: import("@/shared/nexus-contract").SovereignData) {
    if (!data) return data;
    if (pathOrCollection.includes('users')) return FirestoreHydrator.hydrateUser(data);
    if (pathOrCollection.includes('orders')) return FirestoreHydrator.hydrateOrder(data);
    if (pathOrCollection.includes('modules')) return FirestoreHydrator.hydrateModule(data);
    return data;
}

export class FirestoreAdapter implements INexusAdapter {
    private db: Firestore;

    constructor() {
        this.db = getFirestore(app);
    }

    async get<T = any>(path: string): Promise<T | null> {
        try {
            const isCollection = path.split('/').length % 2 !== 0;
            if (isCollection) {
                const results = await this.query(path);
                return results as any;
            }

            const docRef = doc(this.db, path);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;
            const rawData = { id: snap.id, ...snap.data() };
            return hydrateBasedOnPath(path, rawData) as T;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    async query<T = any>(collectionPath: string, options?: INexusQueryOptions): Promise<T[]> {
        try {
            let q = query(collection(this.db, collectionPath));
            
            // Phase 2 Vanguard: Apply organizationId filter automatically
            const organizationId = Nexus.activeTenant;
            if (organizationId && organizationId !== 'restaurant-os' && organizationId !== 'main') {
                q = withTenantScope(q, organizationId);
            }

            if (options?.where) {
                options.where.forEach(w => {
                    q = query(q, where(w.field, w.operator as import('firebase/firestore').WhereFilterOp, w.value));
                });
            }

            if (options?.orderBy) {
                q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
            }

            if (options?.limit) {
                q = query(q, limit(options.limit));
            }

            const snap = await getDocs(q);
            return snap.docs.map(d => hydrateBasedOnPath(collectionPath, { id: d.id, ...d.data() }) as T);
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
        
        if (isCollection) {
            let q = query(collection(this.db, path));
            const organizationId = Nexus.activeTenant;
            if (organizationId && organizationId !== 'restaurant-os' && organizationId !== 'main') {
                q = withTenantScope(q, organizationId);
            }
            if (options?.where) {
                options.where.forEach(w => {
                    q = query(q, where(w.field, w.operator as import('firebase/firestore').WhereFilterOp, w.value));
                });
            }
            return onSnapshot(q, (snap) => {
                const qSnap = snap as import('firebase/firestore').QuerySnapshot;
                const data = qSnap.docs.map((d) => hydrateBasedOnPath(path, { id: d.id, ...d.data() }));
                callback(data as any);
            }, options?.onError);
        } else {
            const ref = doc(this.db, path);
            return onSnapshot(ref, (snap) => {
                const dSnap = snap as import('firebase/firestore').DocumentSnapshot;
                const rawData = dSnap.exists() ? { id: dSnap.id, ...dSnap.data() } : null;
                const data = rawData ? hydrateBasedOnPath(path, rawData) : null;
                callback(data as T);
            }, options?.onError);
        }
    }

    batch(): INexusBatch {
        return new FirestoreBatch(this.db);
    }

    async set<T = any>(path: string, data: T, options?: { merge?: boolean }): Promise<void> {
        const docRef = doc(this.db, path);
        await setDoc(docRef, data as import('firebase/firestore').DocumentData, options);
    }

    async update<T = any>(path: string, data: Partial<T>): Promise<void> {
        const docRef = doc(this.db, path);
        await updateDoc(docRef, data as import('firebase/firestore').DocumentData);
    }

    async increment(path: string, field: string, amount: number): Promise<void> {
        const docRef = doc(this.db, path);
        await updateDoc(docRef, { [field]: increment(amount) });
    }

    async create<T = any>(path: string, data: T): Promise<void> {
        const colRef = collection(this.db, path);
        await addDoc(colRef, data as import('firebase/firestore').DocumentData);
    }

    async delete(path: string): Promise<void> {
        const docRef = doc(this.db, path);
        await deleteDoc(docRef);
    }

    generateId(collectionPath: string): string {
        return doc(collection(this.db, collectionPath)).id;
    }
}
