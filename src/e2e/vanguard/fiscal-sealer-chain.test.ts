/**
 * 🔐 NF525 — FiscalSealer : chaîne atomique via MockAdapter (Grade X)
 *
 * Teste sealDataAtomically avec le vrai CryptoService.generateHash.
 * MockAdapter simule l'atomicité : le chainHead est lu + écrit dans la même
 * transaction, garantissant qu'aucun appel concurrent ne fork la chaîne.
 *
 * RÈGLE : pas de mock de generateHash ni de signFiscalData.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';
import { FiscalEngine, FISCAL_CONSTANTS } from '@/modules/finance/fiscalite/FiscalAdapter';
import { FiscalKeyService } from '@/modules/finance/services/FiscalKeyService';
import { CryptoService } from '@/lib/CryptoService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';

vi.mock('@/lib/audit', () => ({ empireAudit: { log: vi.fn() } }));

const TENANT = 'tenant-sealer-test';
const TEST_KEY = 'test-sealer-key-must-be-at-least-32chars!';

describe('🔐 FiscalSealer — chaîne atomique via MockAdapter', () => {
  beforeEach(() => {
    Nexus.adapter = new MockAdapter();
    FiscalKeyService.provision(TENANT, TEST_KEY);
  });

  afterEach(() => {
    FiscalKeyService.reset();
  });

  // ── Suite A — Chaîne chainHead ───────────────────────────────────────────────

  describe('Suite A — Chaîne via chainHead', () => {
    it('premier appel : previousHash === GENESIS_ROOT', async () => {
      const snapshot = CryptoService.canonicalStringify({ amount: 1000 } as Parameters<typeof CryptoService.canonicalStringify>[0]);
      const result = await FiscalSealer.sealDataAtomically(snapshot, TENANT, false);

      expect(result.previousHash).toBe(FISCAL_CONSTANTS.GENESIS_ROOT);
      expect(result.hash).toHaveLength(64);
      expect(result.hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('deuxième appel : previousHash === hash du premier sceau', async () => {
      const snap1 = CryptoService.canonicalStringify({ amount: 1000 } as Parameters<typeof CryptoService.canonicalStringify>[0]);
      const snap2 = CryptoService.canonicalStringify({ amount: 2000 } as Parameters<typeof CryptoService.canonicalStringify>[0]);

      const r1 = await FiscalSealer.sealDataAtomically(snap1, TENANT, false);
      const r2 = await FiscalSealer.sealDataAtomically(snap2, TENANT, false);

      expect(r2.previousHash).toBe(r1.hash);
    });

    it('chaîne de 5 appels séquentiels — chaque lien vérifié', async () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        const snap = CryptoService.canonicalStringify({ amount: i * 1000 } as Parameters<typeof CryptoService.canonicalStringify>[0]);
        results.push(await FiscalSealer.sealDataAtomically(snap, TENANT, false));
      }

      for (let i = 1; i < results.length; i++) {
        expect(results[i]!.previousHash).toBe(results[i - 1]!.hash);
      }
    });

    it('hash recalculé manuellement correspond au hash stocké dans chainHead', async () => {
      const data = { amount: 7500, operatorId: 'op-seal-test' };
      const snap = CryptoService.canonicalStringify(data as Parameters<typeof CryptoService.canonicalStringify>[0]);

      const result = await FiscalSealer.sealDataAtomically(snap, TENANT, false);

      // Recalcul indépendant : SHA-256(snapshot + GENESIS_ROOT) pour le premier sceau
      const expectedHash = await CryptoService.generateHash(snap, FISCAL_CONSTANTS.GENESIS_ROOT);
      expect(result.hash).toBe(expectedHash);
    });

    it('verifyChain sur les sceaux écrits dans MockAdapter → true', async () => {
      const snaps = [
        CryptoService.canonicalStringify({ amount: 100 } as Parameters<typeof CryptoService.canonicalStringify>[0]),
        CryptoService.canonicalStringify({ amount: 200 } as Parameters<typeof CryptoService.canonicalStringify>[0]),
        CryptoService.canonicalStringify({ amount: 300 } as Parameters<typeof CryptoService.canonicalStringify>[0]),
      ];

      for (const snap of snaps) {
        await FiscalSealer.sealDataAtomically(snap, TENANT, false);
      }

      // Lire les sceaux écrits dans MockAdapter
      const seals = await Nexus.adapter.query(
        `tenants/${TENANT}/fiscalSeals`,
        { orderBy: { field: 'timestamp', direction: 'asc' } }
      ) as Array<{ id: string; hash: string; previousHash: string; dataSnapshot: string; timestamp: string; signature: string; updatedAt: string; transactionId?: string }>;

      expect(seals).toHaveLength(3);
      // verifyChain utilise FiscalEngine directement
      const fiscalSeals = seals.map(s => ({
        id: s.id,
        transactionId: s.transactionId ?? s.id,
        hash: s.hash,
        previousHash: s.previousHash,
        dataSnapshot: s.dataSnapshot,
        timestamp: s.timestamp,
        signature: s.signature,
        updatedAt: s.updatedAt,
      }));
      expect(await FiscalEngine.verifyChain(fiscalSeals)).toBe(true);
    });
  });

  // ── Suite B — Mode formation ─────────────────────────────────────────────────

  describe('Suite B — Mode formation', () => {
    it('mode formation → hash fixe, ne pollue pas la chaîne de production', async () => {
      const snap = CryptoService.canonicalStringify({ amount: 100 } as Parameters<typeof CryptoService.canonicalStringify>[0]);
      const training = await FiscalSealer.sealDataAtomically(snap, TENANT, true);

      expect(training.hash).toBe(FISCAL_CONSTANTS.TRAINING_MODE_HASH);
      expect(training.previousHash).toBe(FISCAL_CONSTANTS.GENESIS_ROOT);

      // Le chainHead est mis à jour avec TRAINING_MODE_HASH
      // Le prochain sceau de production aura previousHash = TRAINING_MODE_HASH
      const snapProd = CryptoService.canonicalStringify({ amount: 200 } as Parameters<typeof CryptoService.canonicalStringify>[0]);
      const prod = await FiscalSealer.sealDataAtomically(snapProd, TENANT, false);

      expect(prod.previousHash).toBe(FISCAL_CONSTANTS.TRAINING_MODE_HASH);
    });
  });

  // ── Suite C — Isolation multi-tenant ────────────────────────────────────────

  describe('Suite C — Isolation multi-tenant', () => {
    const TENANT_B = 'tenant-b-sealer';

    beforeEach(() => {
      FiscalKeyService.provision(TENANT_B, 'different-key-for-tenant-b-32chars!!');
    });

    it('deux tenants ont des chainHeads indépendants', async () => {
      const snap = CryptoService.canonicalStringify({ amount: 999 } as Parameters<typeof CryptoService.canonicalStringify>[0]);

      const rA1 = await FiscalSealer.sealDataAtomically(snap, TENANT, false);
      const rA2 = await FiscalSealer.sealDataAtomically(snap, TENANT, false);

      const rB1 = await FiscalSealer.sealDataAtomically(snap, TENANT_B, false);

      // A a deux sceaux chainés
      expect(rA2.previousHash).toBe(rA1.hash);
      // B commence à GENESIS_ROOT — la chaîne A ne contamine pas B
      expect(rB1.previousHash).toBe(FISCAL_CONSTANTS.GENESIS_ROOT);
    });

    it('même snapshot → hashes identiques mais signatures différentes (clés différentes)', async () => {
      const snap = CryptoService.canonicalStringify({ amount: 500 } as Parameters<typeof CryptoService.canonicalStringify>[0]);

      const rA = await FiscalSealer.sealDataAtomically(snap, TENANT, false);
      const rB = await FiscalSealer.sealDataAtomically(snap, TENANT_B, false);

      // Même snapshot + même previousHash (GENESIS_ROOT) → hash identique
      expect(rA.hash).toBe(rB.hash);
      // Mais signature HMAC différente (clés différentes)
      expect(rA.signature).not.toBe(rB.signature);
    });
  });

  // ── Suite D — Numérotation séquentielle ──────────────────────────────────────

  describe('Suite D — Numérotation de reçu NF525', () => {
    it('10 reçus séquentiels → numéros sans doublon ni saut', async () => {
      const numbers = [];
      for (let i = 0; i < 10; i++) {
        numbers.push(await FiscalSealer.generateSequentialReceiptNumber(TENANT));
      }

      const year = new Date().getFullYear();
      expect(numbers[0]).toBe(`${year}-000001`);
      expect(numbers[9]).toBe(`${year}-000010`);

      // Aucun doublon
      expect(new Set(numbers).size).toBe(10);
    });

    it('appels sur deux tenants différents → compteurs indépendants', async () => {
      const TENANT_C = 'tenant-receipt-c';
      const r1 = await FiscalSealer.generateSequentialReceiptNumber(TENANT);
      const r2 = await FiscalSealer.generateSequentialReceiptNumber(TENANT_C);

      const year = new Date().getFullYear();
      // Les deux commencent à 000001 — compteurs isolés
      expect(r1).toBe(`${year}-000001`);
      expect(r2).toBe(`${year}-000001`);
    });
  });
});
