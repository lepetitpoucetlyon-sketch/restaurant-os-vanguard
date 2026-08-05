import 'server-only';
import {
  getFirestore,
  FieldValue,
  type Firestore,
  type Query,
  type Transaction,
  type WhereFilterOp,
  type DocumentData,
  type UpdateData,
} from 'firebase-admin/firestore';
import type {
  INexusAdapter,
  INexusQueryOptions,
  INexusBatch,
  INexusTransaction,
} from '@/lib/nexus/types';

/**
 * 🛰️ FirestoreServerAdapter — adapter Nexus côté SERVEUR (Admin SDK).
 *
 * Utilisé par les routes API (~75 usages de `Nexus.adapter`). Contrairement au
 * `FirestoreAdapter` client (SDK web, soumis aux règles Firestore avec l'auth du
 * navigateur), celui-ci s'appuie sur firebase-admin :
 *  - il outrepasse les règles Firestore (tier serveur de confiance) ;
 *  - l'isolation multi-tenant est garantie en amont par `adminAuthGuard`
 *    (tenantId issu du JWT) + les chemins `tenants/{tenantId}/…` explicites ;
 *  - il est enregistré SANS le NexusInterceptor client (le garde s'appuie sur le
 *    store Jotai + un fail-safe logout, qui n'ont aucun sens hors navigateur).
 *
 * Enregistrement : `ensureServerNexus()` (src/lib/nexus/serverNexus.ts), appelé
 * au démarrage du serveur via `src/instrumentation.ts`.
 */
export class FirestoreServerAdapter implements INexusAdapter {
  private get db(): Firestore {
    return getFirestore();
  }

  async get<T = DocumentData>(path: string): Promise<T | null> {
    const snap = await this.db.doc(path).get();
    return snap.exists ? ({ id: snap.id, ...snap.data() } as T) : null;
  }

  async query<T = DocumentData>(collectionPath: string, options?: INexusQueryOptions): Promise<T[]> {
    let q: Query = this.db.collection(collectionPath);
    if (options?.where) {
      for (const w of options.where) {
        q = q.where(w.field, w.operator as WhereFilterOp, w.value);
      }
    }
    if (options?.orderBy) {
      q = q.orderBy(options.orderBy.field, options.orderBy.direction);
    }
    if (options?.limit) {
      q = q.limit(options.limit);
    }
    const snap = await q.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  }

  onSnapshot(): () => void {
    // Pas de listeners longue durée côté serveur (serverless/stateless).
    throw new Error('[FirestoreServerAdapter] onSnapshot non supporté côté serveur.');
  }

  batch(): INexusBatch {
    const b = this.db.batch();
    const db = this.db;
    return {
      set: <T>(path: string, data: T) => { b.set(db.doc(path), data as DocumentData); },
      update: <T>(path: string, data: Partial<T>) => { b.update(db.doc(path), data as UpdateData<DocumentData>); },
      increment: (path: string, field: string, amount: number) => { b.update(db.doc(path), { [field]: FieldValue.increment(amount) }); },
      delete: (path: string) => { b.delete(db.doc(path)); },
      commit: async () => { await b.commit(); },
    };
  }

  async set<T = DocumentData>(path: string, data: T, options?: { merge?: boolean }): Promise<void> {
    await this.db.doc(path).set(data as DocumentData, options?.merge ? { merge: true } : {});
  }

  async update<T = DocumentData>(path: string, data: Partial<T>): Promise<void> {
    await this.db.doc(path).update(data as UpdateData<DocumentData>);
  }

  async increment(path: string, field: string, amount: number): Promise<void> {
    await this.db.doc(path).update({ [field]: FieldValue.increment(amount) } as UpdateData<DocumentData>);
  }

  async create<T = DocumentData>(path: string, data: T): Promise<void> {
    await this.db.doc(path).create(data as DocumentData);
  }

  async delete(path: string): Promise<void> {
    await this.db.doc(path).delete();
  }

  generateId(collectionPath: string): string {
    return this.db.collection(collectionPath).doc().id;
  }

  serverTimestamp(): unknown {
    return FieldValue.serverTimestamp();
  }

  async runTransaction<T>(callback: (tx: INexusTransaction) => Promise<T>): Promise<T> {
    const db = this.db;
    return db.runTransaction(async (t: Transaction) => {
      const tx: INexusTransaction = {
        get: async <U = unknown>(path: string): Promise<U | null> => {
          const snap = await t.get(db.doc(path));
          return snap.exists ? ({ id: snap.id, ...snap.data() } as U) : null;
        },
        set: (path: string, data: unknown) => { t.set(db.doc(path), data as DocumentData); },
        update: (path: string, data: Partial<unknown>) => { t.update(db.doc(path), data as UpdateData<DocumentData>); },
        delete: (path: string) => { t.delete(db.doc(path)); },
      };
      return callback(tx);
    });
  }
}
