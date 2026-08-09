/**
 * 🔗 NF525 — Intégrité de la chaîne de scellement (Grade X)
 *
 * Tests manquants identifiés lors de l'audit S11 :
 * Les tests existants mockent CryptoService.generateHash → ils vérifient que
 * le code "est appelé" mais pas que la chaîne SHA-256 est mathématiquement valide.
 *
 * CES TESTS N'AUTORISENT AUCUN MOCK DE generateHash.
 * Si un test ici échoue, la chaîne fiscale NF525 est compromise.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FiscalEngine, FISCAL_CONSTANTS } from '@/modules/finance/fiscalite/FiscalAdapter';
import { FiscalKeyService } from '@/modules/finance/services/FiscalKeyService';
import { CryptoService } from '@/lib/CryptoService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import type { FiscalSeal } from '@nexus/contracts';

vi.mock('@/lib/audit', () => ({ empireAudit: { log: vi.fn() } }));

const TENANT = 'tenant-chain-test';
const TEST_KEY = 'test-fiscal-signing-key-must-be-32chars!!';

describe('🔗 NF525 — Intégrité de la chaîne de scellement', () => {
  beforeEach(() => {
    Nexus.adapter = new MockAdapter();
    FiscalKeyService.provision(TENANT, TEST_KEY);
  });

  afterEach(() => {
    FiscalKeyService.reset();
  });

  // ── Suite A — Chaîne réelle SHA-256 (pas de mock generateHash) ──────────────

  describe('Suite A — Chaîne SHA-256 réelle', () => {
    it('premier sceau : previousHash === GENESIS_ROOT', async () => {
      const seal = await FiscalEngine.sealEntry(
        'tx-genesis',
        { amount: 1000, tableId: 't-1' },
        { instanceId: TENANT }
      );

      expect(seal.previousHash).toBe(FISCAL_CONSTANTS.GENESIS_ROOT);
      expect(seal.hash).toHaveLength(64);          // SHA-256 hex = 64 chars
      expect(seal.hash).toMatch(/^[0-9a-f]{64}$/); // hex valide
    });

    it('seal[1].previousHash === seal[0].hash (2 sceaux en séquence)', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-0', { amount: 1000 }, { instanceId: TENANT });
      const s1 = await FiscalEngine.sealEntry('tx-1', { amount: 2000 }, { lastSeal: s0, instanceId: TENANT });

      expect(s1.previousHash).toBe(s0.hash);
    });

    it('chaîne de 3 sceaux : chaque lien est intact', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-0', { amount: 100 }, { instanceId: TENANT });
      const s1 = await FiscalEngine.sealEntry('tx-1', { amount: 200 }, { lastSeal: s0, instanceId: TENANT });
      const s2 = await FiscalEngine.sealEntry('tx-2', { amount: 300 }, { lastSeal: s1, instanceId: TENANT });

      expect(s1.previousHash).toBe(s0.hash);
      expect(s2.previousHash).toBe(s1.hash);
      // Tous les hashes sont distincts (data différente → hash différent)
      expect(new Set([s0.hash, s1.hash, s2.hash]).size).toBe(3);
    });

    it('verifyChain([s0, s1, s2]) → true pour une chaîne valide', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-0', { amount: 500 }, { instanceId: TENANT });
      const s1 = await FiscalEngine.sealEntry('tx-1', { amount: 1500 }, { lastSeal: s0, instanceId: TENANT });
      const s2 = await FiscalEngine.sealEntry('tx-2', { amount: 2500 }, { lastSeal: s1, instanceId: TENANT });

      expect(await FiscalEngine.verifyChain([s0, s1, s2])).toBe(true);
    });

    it('10 sceaux en séquence → verifyChain → true', async () => {
      const seals: FiscalSeal[] = [];
      let last: FiscalSeal | undefined;

      for (let i = 0; i < 10; i++) {
        last = await FiscalEngine.sealEntry(`tx-${i}`, { amount: i * 100 }, {
          instanceId: TENANT,
          lastSeal: last,
        });
        seals.push(last);
      }

      expect(await FiscalEngine.verifyChain(seals)).toBe(true);
    });
  });

  // ── Suite B — Détection de falsification ────────────────────────────────────

  describe('Suite B — Résistance à la falsification', () => {
    it('modifier dataSnapshot de s1 → verifyChain → false', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-0', { amount: 500 }, { instanceId: TENANT });
      const s1 = await FiscalEngine.sealEntry('tx-1', { amount: 1500 }, { lastSeal: s0, instanceId: TENANT });
      const s2 = await FiscalEngine.sealEntry('tx-2', { amount: 2500 }, { lastSeal: s1, instanceId: TENANT });

      const tampered: FiscalSeal = { ...s1, dataSnapshot: '{"amount":9999999}' };

      expect(await FiscalEngine.verifyChain([s0, tampered, s2])).toBe(false);
    });

    it('intervertir s1 et s2 → verifyChain → false', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-0', { amount: 500 }, { instanceId: TENANT });
      const s1 = await FiscalEngine.sealEntry('tx-1', { amount: 1500 }, { lastSeal: s0, instanceId: TENANT });
      const s2 = await FiscalEngine.sealEntry('tx-2', { amount: 2500 }, { lastSeal: s1, instanceId: TENANT });

      expect(await FiscalEngine.verifyChain([s0, s2, s1])).toBe(false);
    });

    it('remplacer le hash de s0 directement → verifyChain → false', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-0', { amount: 500 }, { instanceId: TENANT });
      const s1 = await FiscalEngine.sealEntry('tx-1', { amount: 1500 }, { lastSeal: s0, instanceId: TENANT });

      const forged: FiscalSeal = { ...s0, hash: 'a'.repeat(64) };

      expect(await FiscalEngine.verifyChain([forged, s1])).toBe(false);
    });

    it('injecter un sceau fantôme entre s0 et s1 → verifyChain → false', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-0', { amount: 500 }, { instanceId: TENANT });
      const phantom = await FiscalEngine.sealEntry('tx-phantom', { amount: 999 }, { lastSeal: s0, instanceId: TENANT });
      const s1 = await FiscalEngine.sealEntry('tx-1', { amount: 1500 }, { lastSeal: s0, instanceId: TENANT });

      // phantom interposé — s1.previousHash pointe sur s0.hash, pas phantom.hash
      expect(await FiscalEngine.verifyChain([s0, phantom, s1])).toBe(false);
    });

    it('modifier uniquement la signature ne casse pas verifyChain (hash indépendant)', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-0', { amount: 500 }, { instanceId: TENANT });
      const s1 = await FiscalEngine.sealEntry('tx-1', { amount: 1500 }, { lastSeal: s0, instanceId: TENANT });

      // verifyChain ne vérifie que les hashes SHA-256, pas les signatures HMAC
      const tamperedSig: FiscalSeal = { ...s0, signature: 'FAKE_HMAC_SIGNATURE' };

      expect(await FiscalEngine.verifyChain([tamperedSig, s1])).toBe(true);
    });
  });

  // ── Suite C — Vérification manuelle du hash ──────────────────────────────────

  describe('Suite C — Vérification mathématique indépendante', () => {
    it('recalcul manuel SHA-256(dataSnapshot + previousHash) correspond au hash stocké', async () => {
      const data = { amount: 5000, tableId: 't-12', operatorId: 'op-99' };
      const seal = await FiscalEngine.sealEntry('tx-verify', data, { instanceId: TENANT });

      const snapshot = CryptoService.canonicalStringify(data as Parameters<typeof CryptoService.canonicalStringify>[0]);
      const expectedHash = await CryptoService.generateHash(snapshot, FISCAL_CONSTANTS.GENESIS_ROOT);

      expect(seal.hash).toBe(expectedHash);
    });

    it('le hash est déterministe — mêmes entrées → même hash', async () => {
      const data = { amount: 12345, operatorId: 'op-1' };
      const sA = await FiscalEngine.sealEntry('tx-a', data, { instanceId: TENANT });
      const sB = await FiscalEngine.sealEntry('tx-b', data, { instanceId: TENANT });

      // Genesis → même previousHash, même data → hash identique
      expect(sA.hash).toBe(sB.hash);
    });

    it('données différentes → hash différents', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-0', { amount: 100 }, { instanceId: TENANT });
      const s1 = await FiscalEngine.sealEntry('tx-1', { amount: 101 }, { instanceId: TENANT });

      expect(s0.hash).not.toBe(s1.hash);
    });

    it('même data, previousHash différent → hash différent', async () => {
      const data = { amount: 999 };
      const sA = await FiscalEngine.sealEntry('tx-a', data, { instanceId: TENANT });

      // Construction d'un faux lastSeal avec hash arbitraire
      const fakeLastSeal: FiscalSeal = {
        id: 'fake', transactionId: 'fake', timestamp: new Date().toISOString(),
        dataSnapshot: '{}', hash: 'b'.repeat(64), previousHash: FISCAL_CONSTANTS.GENESIS_ROOT,
        signature: 'x', updatedAt: new Date().toISOString(),
      };
      const sB = await FiscalEngine.sealEntry('tx-b', data, { instanceId: TENANT, lastSeal: fakeLastSeal });

      expect(sA.hash).not.toBe(sB.hash);
    });
  });

  // ── Suite D — Cas limites ────────────────────────────────────────────────────

  describe('Suite D — Cas limites', () => {
    it('verifyChain([]) → true (chaîne vide)', async () => {
      expect(await FiscalEngine.verifyChain([])).toBe(true);
    });

    it('verifyChain([s0]) → true (sceau unique)', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-solo', { amount: 999 }, { instanceId: TENANT });
      expect(await FiscalEngine.verifyChain([s0])).toBe(true);
    });

    it('mode formation → hash fixe TRAINING_MODE_UNSIGNED_HASH', async () => {
      const seal = await FiscalEngine.sealEntry('tx-train', { amount: 100 }, {
        instanceId: TENANT,
        isTrainingMode: true,
      });

      expect(seal.hash).toBe(FISCAL_CONSTANTS.TRAINING_MODE_HASH);
      expect(seal.signature).toBe('VTC_SCHOOL_TRAINING_SIGNATURE');
    });

    it('mode formation → verifyChain → false (hash fictif ne passe pas SHA-256)', async () => {
      const sTraining = await FiscalEngine.sealEntry('tx-train', { amount: 100 }, {
        instanceId: TENANT,
        isTrainingMode: true,
      });
      // verifyChain calcule SHA-256(dataSnapshot + GENESIS_ROOT) ≠ TRAINING_MODE_UNSIGNED_HASH
      expect(await FiscalEngine.verifyChain([sTraining])).toBe(false);
    });

    it('sealEntry sans clé → lève FISCAL_SIGNING_KEY_MISSING', async () => {
      FiscalKeyService.reset();
      delete process.env.FISCAL_SIGNING_SECRET;

      await expect(
        FiscalEngine.sealEntry('tx-no-key', { amount: 100 }, { instanceId: 'tenant-sans-cle' })
      ).rejects.toThrow('FISCAL_SIGNING_KEY_MISSING');

      // Restaurer pour les autres tests
      process.env.FISCAL_SIGNING_SECRET = 'test-fiscal-signing-secret';
    });
  });
});
