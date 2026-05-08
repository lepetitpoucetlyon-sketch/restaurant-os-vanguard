import { Firestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, increment } from 'firebase/firestore';
import { SovereignSecurityViolation } from '@/shared/nexus/contracts/security.errors';
import { SovereignGuard } from '@/shared/nexus/guards/SovereignGuard';
import { FirestoreHydrator } from '@/lib/sovereign/firestoreHydrator';
import { IDocumentStore } from '@/shared/nexus/contracts/infrastructure/storage.contracts';

function hydrateBasedOnPath(pathOrCollection: string, data: Record<string, unknown>) {
    if (!data) return data;
    if (pathOrCollection.includes('users')) return FirestoreHydrator.hydrateUser(data);
    if (pathOrCollection.includes('orders')) return FirestoreHydrator.hydrateOrder(data);
    if (pathOrCollection.includes('modules')) return FirestoreHydrator.hydrateModule(data);
    return data;
}

export class FirestoreDocumentStore implements IDocumentStore {
    constructor(private db: Firestore) {}

    async get<T>(path: string): Promise<T | null> {
        const docRef = doc(this.db, path);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        const rawData = { id: snap.id, ...snap.data() } as Record<string, unknown>;
        return hydrateBasedOnPath(path, rawData) as any as T;
    }

    async set<T>(path: string, data: T, options?: { merge?: boolean }): Promise<void> {
        const docRef = doc(this.db, path);
        await setDoc(docRef, data as import('firebase/firestore').DocumentData, options ?? { merge: true });
    }

    async delete(path: string): Promise<void> {
        if (!SovereignGuard.canDelete(path)) {
            throw new SovereignSecurityViolation(
                "TENTATIVE DE VIOLATION DE SOUVERAINETÉ : Suppression interdite sur les registres scellés (Loi NF525). Session verrouillée."
            );
        }
        const docRef = doc(this.db, path);
        await deleteDoc(docRef);
    }

    async create<T>(path: string, data: T): Promise<void> {
        await addDoc(collection(this.db, path), data as import('firebase/firestore').DocumentData);
    }

    async update<T>(path: string, data: Partial<T>): Promise<void> {
        const docRef = doc(this.db, path);
        await updateDoc(docRef, data as import('firebase/firestore').DocumentData);
    }

    async increment(path: string, field: string, amount: number): Promise<void> {
        const docRef = doc(this.db, path);
        await updateDoc(docRef, { [field]: increment(amount) });
    }

    generateId(collectionPath: string): string {
        return doc(collection(this.db, collectionPath)).id;
    }
}
