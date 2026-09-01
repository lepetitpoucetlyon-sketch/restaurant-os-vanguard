/**
 * AdapterConformance.test.ts — Lot D du plan d'agnosticisme DB
 *
 * Garantit que TOUS les adapters non-Firestore implémentent correctement
 * le contrat INexusAdapter. Si un adapter est ajouté, il doit être listé ici.
 *
 * Ces tests constituent la preuve légale que l'application peut tourner
 * sans Firestore (DB_PROVIDER=memory ou mock).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { INexusAdapter } from '@/lib/nexus/types';

// ── Adapters à tester ─────────────────────────────────────────────────────────
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { SqliteMemoryAdapter } from '@/lib/adapters/SqliteMemoryAdapter';

// ── Suite partagée ─────────────────────────────────────────────────────────────

function runConformanceSuite(name: string, factory: () => INexusAdapter) {
  describe(`[${name}] — Conformance INexusAdapter`, () => {
    let adapter: INexusAdapter;

    beforeEach(() => {
      adapter = factory();
    });

    // ── CRUD de base ────────────────────────────────────────────────────────────

    it('set + get : retourne la valeur écrite', async () => {
      await adapter.set('tenants/t1/products/p1', { name: 'Burger', price: 1200 });
      const result = await adapter.get<{ name: string; price: number }>('tenants/t1/products/p1');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Burger');
      expect(result!.price).toBe(1200);
    });

    it('get : retourne null pour un chemin inexistant', async () => {
      const result = await adapter.get('tenants/t1/does-not-exist/xyz');
      expect(result).toBeNull();
    });

    it('update : fusionne partiellement les champs', async () => {
      await adapter.set('tenants/t1/products/p1', { name: 'Burger', price: 1200, category: 'food' });
      await adapter.update('tenants/t1/products/p1', { price: 1500 });
      const result = await adapter.get<{ name: string; price: number; category: string }>('tenants/t1/products/p1');
      expect(result!.price).toBe(1500);
      expect(result!.name).toBe('Burger');
      expect(result!.category).toBe('food');
    });

    it('delete : supprime le document', async () => {
      await adapter.set('tenants/t1/products/p1', { name: 'Burger' });
      await adapter.delete('tenants/t1/products/p1');
      const result = await adapter.get('tenants/t1/products/p1');
      expect(result).toBeNull();
    });

    it('create : crée un document (identique à set sans merge)', async () => {
      await adapter.create('tenants/t1/orders/o1', { status: 'open', total: 2000 });
      const result = await adapter.get<{ status: string; total: number }>('tenants/t1/orders/o1');
      expect(result).not.toBeNull();
      expect(result!.status).toBe('open');
    });

    it('increment : incrémente atomiquement un champ numérique', async () => {
      await adapter.set('tenants/t1/counters/daily', { orders: 5 });
      await adapter.increment('tenants/t1/counters/daily', 'orders', 3);
      const result = await adapter.get<{ orders: number }>('tenants/t1/counters/daily');
      expect(result!.orders).toBe(8);
    });

    // ── Query ───────────────────────────────────────────────────────────────────

    it('query : retourne tous les documents de la collection', async () => {
      await adapter.set('tenants/t1/products/a', { name: 'Pizza', available: true });
      await adapter.set('tenants/t1/products/b', { name: 'Pasta', available: false });
      const results = await adapter.query('tenants/t1/products');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('query : filtre par clause where ==', async () => {
      await adapter.set('tenants/t1/products/c', { name: 'Steak', category: 'meat', available: true });
      await adapter.set('tenants/t1/products/d', { name: 'Salad', category: 'veggie', available: true });
      const results = await adapter.query<{ name: string; category: string }>('tenants/t1/products', {
        where: [{ field: 'category', operator: '==', value: 'meat' }],
      });
      expect(results.every(r => r.category === 'meat')).toBe(true);
    });

    // ── Batch ───────────────────────────────────────────────────────────────────

    it('batch : applique plusieurs opérations en une fois', async () => {
      const batch = adapter.batch();
      batch.set('tenants/t1/products/batch1', { name: 'Item1' });
      batch.set('tenants/t1/products/batch2', { name: 'Item2' });
      await batch.commit();
      const r1 = await adapter.get<{ name: string }>('tenants/t1/products/batch1');
      const r2 = await adapter.get<{ name: string }>('tenants/t1/products/batch2');
      expect(r1!.name).toBe('Item1');
      expect(r2!.name).toBe('Item2');
    });

    // ── onSnapshot ──────────────────────────────────────────────────────────────

    it('onSnapshot : appelle le callback avec la valeur initiale', () =>
      new Promise<void>((resolve, reject) => {
        adapter.set('tenants/t1/products/snap1', { name: 'SnapItem' }).then(() => {
          let unsubFn: (() => void) | undefined;
          let resolved = false;

          const unsubProxy = () => {
            if (unsubFn) unsubFn();
          };

          unsubFn = adapter.onSnapshot<{ name: string }>(
            'tenants/t1/products/snap1',
            (data) => {
              if (resolved) return;
              resolved = true;
              try {
                expect(data).not.toBeNull();
                unsubProxy();
                resolve();
              } catch (e) {
                reject(e);
              }
            }
          );

          // Si le callback a déjà été appelé synchronement, unsubFn est correctement assigné
          setTimeout(() => {
            if (!resolved) reject(new Error('onSnapshot callback never called'));
          }, 5000);
        });
      })
    );

    // ── generateId ──────────────────────────────────────────────────────────────

    it('generateId : retourne une chaîne non vide unique', () => {
      const id1 = adapter.generateId('tenants/t1/products');
      const id2 = adapter.generateId('tenants/t1/products');
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });

    // ── serverTimestamp ─────────────────────────────────────────────────────────

    it('serverTimestamp : retourne une valeur définie non nulle', () => {
      const ts = adapter.serverTimestamp();
      expect(ts).toBeDefined();
      expect(ts).not.toBeNull();
    });

    // ── runTransaction ──────────────────────────────────────────────────────────

    it('runTransaction : exécute un callback et retourne le résultat', async () => {
      await adapter.set('tenants/t1/products/tx1', { price: 1000 });
      const result = await adapter.runTransaction(async (tx) => {
        const doc = await tx.get<{ price: number }>('tenants/t1/products/tx1');
        const newPrice = (doc?.price ?? 0) + 100;
        tx.set('tenants/t1/products/tx1', { price: newPrice });
        return newPrice;
      });
      expect(result).toBe(1100);
    });
  });
}

// ── Exécution sur chaque adapter non-Firestore ────────────────────────────────

runConformanceSuite('MockAdapter', () => new MockAdapter());
runConformanceSuite('SqliteMemoryAdapter', () => new SqliteMemoryAdapter());
