import { 
    Firestore, 
    writeBatch, 
    doc, 
    increment as firestoreIncrement 
} from 'firebase/firestore';
import { INexusBatch } from '@/lib/nexus/types';

/**
 * 🏛️ FirestoreBatch - Grade X (Pure I/O)
 */
export class FirestoreBatch implements INexusBatch {
    private batch: import('firebase/firestore').WriteBatch;

    constructor(private db: Firestore) {
        this.batch = writeBatch(db);
    }

    set(path: string, data: Record<string, unknown>): void {
        this.batch.set(doc(this.db, path), data);
    }

    update(path: string, data: Record<string, unknown>): void {
        this.batch.update(doc(this.db, path), data);
    }

    increment(path: string, field: string, amount: number): void {
        this.batch.update(doc(this.db, path), {
            [field]: firestoreIncrement(amount)
        });
    }

    delete(path: string): void {
        this.batch.delete(doc(this.db, path));
    }

    async commit(): Promise<void> {
        await this.batch.commit();
    }
}
