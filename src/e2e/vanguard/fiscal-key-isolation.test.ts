/**
 * 🔑 NF525 — Isolation des clés de scellement (Grade X)
 *
 * Vérifie que la rotation de clé ne casse pas les sceaux existants,
 * que deux tenants ne peuvent pas forger les sceaux l'un de l'autre,
 * et que l'absence de clé échoue explicitement (pas de repli silencieux).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FiscalEngine } from '@/modules/finance/fiscalite/FiscalAdapter';
import { FiscalKeyService } from '@/modules/finance/services/FiscalKeyService';
import { CryptoService } from '@/lib/CryptoService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';

vi.mock('@/lib/audit', () => ({ empireAudit: { log: vi.fn() } }));

const TENANT_A = 'tenant-key-a';
const TENANT_B = 'tenant-key-b';
const KEY_A    = 'signing-key-for-tenant-a-32chars!!!';
const KEY_B    = 'signing-key-for-tenant-b-32chars!!!';

describe('🔑 NF525 — Isolation des clés de scellement', () => {
  beforeEach(() => {
    Nexus.adapter = new MockAdapter();
    FiscalKeyService.provision(TENANT_A, KEY_A);
    FiscalKeyService.provision(TENANT_B, KEY_B);
  });

  afterEach(() => {
    FiscalKeyService.reset();
    process.env.FISCAL_SIGNING_SECRET = 'test-fiscal-signing-secret'; // restaurer
  });

  describe('Isolation entre tenants', () => {
    it('même hash, clés différentes → signatures différentes', async () => {
      const data = { amount: 5000, operatorId: 'op-test' };

      const sA = await FiscalEngine.sealEntry('tx-a', data, { instanceId: TENANT_A });
      const sB = await FiscalEngine.sealEntry('tx-b', data, { instanceId: TENANT_B });

      // Même data + même previousHash (GENESIS_ROOT) → hash identique
      expect(sA.hash).toBe(sB.hash);
      // Mais signatures HMAC différentes (clés différentes)
      expect(sA.signature).not.toBe(sB.signature);
    });

    it('tenant A ne peut pas forger la signature du tenant B', async () => {
      const data = { amount: 9999 };
      const sA = await FiscalEngine.sealEntry('tx-forge', data, { instanceId: TENANT_A });

      // Vérification avec la clé de A : valide
      const validA = await CryptoService.verifyFiscalSignature(sA.hash, sA.signature || '', KEY_A);
      expect(validA).toBe(true);

      // Vérification avec la clé de B : invalide (forgery détectée)
      const validB = await CryptoService.verifyFiscalSignature(sA.hash, sA.signature || '', KEY_B);
      expect(validB).toBe(false);
    });

    it('deux chaînes parallèles indépendantes → verifyChain → true pour chacune', async () => {
      const s0A = await FiscalEngine.sealEntry('tx-a0', { amount: 100 }, { instanceId: TENANT_A });
      const s1A = await FiscalEngine.sealEntry('tx-a1', { amount: 200 }, { lastSeal: s0A, instanceId: TENANT_A });

      const s0B = await FiscalEngine.sealEntry('tx-b0', { amount: 300 }, { instanceId: TENANT_B });
      const s1B = await FiscalEngine.sealEntry('tx-b1', { amount: 400 }, { lastSeal: s0B, instanceId: TENANT_B });

      expect(await FiscalEngine.verifyChain([s0A, s1A])).toBe(true);
      expect(await FiscalEngine.verifyChain([s0B, s1B])).toBe(true);
      // Chaîne mixte → false (les liens sont rompus)
      expect(await FiscalEngine.verifyChain([s0A, s1B])).toBe(false);
    });
  });

  describe('Rotation de clé', () => {
    it('après rotation, les sceaux anciens restent vérifiables (hash indépendant de la clé)', async () => {
      const s0 = await FiscalEngine.sealEntry('tx-before-rotation', { amount: 1000 }, { instanceId: TENANT_A });
      const s1 = await FiscalEngine.sealEntry('tx-before-rotation-2', { amount: 2000 }, { lastSeal: s0, instanceId: TENANT_A });

      // Rotation de clé
      const NEW_KEY_A = 'rotated-key-for-tenant-a-32chars!!';
      FiscalKeyService.provision(TENANT_A, NEW_KEY_A);

      const s2 = await FiscalEngine.sealEntry('tx-after-rotation', { amount: 3000 }, { lastSeal: s1, instanceId: TENANT_A });

      // La chaîne des hashes reste valide (le hash ne dépend que de SHA-256, pas de la clé HMAC)
      expect(await FiscalEngine.verifyChain([s0, s1, s2])).toBe(true);
      // Les liens sont corrects
      expect(s2.previousHash).toBe(s1.hash);
    });

    it('après rotation, la nouvelle signature est différente de l\'ancienne pour le même hash', async () => {
      const data = { amount: 5000 };
      const sBefore = await FiscalEngine.sealEntry('tx-before', data, { instanceId: TENANT_A });

      FiscalKeyService.provision(TENANT_A, 'new-rotated-key-tenant-a-32chars!!!!');
      const sAfter = await FiscalEngine.sealEntry('tx-after', data, { instanceId: TENANT_A });

      // Hash identique (même data, même previousHash = GENESIS_ROOT)
      expect(sBefore.hash).toBe(sAfter.hash);
      // Mais signature différente (nouvelle clé)
      expect(sBefore.signature).not.toBe(sAfter.signature);
    });
  });

  describe('Absence de clé — échec explicite', () => {
    it('sealEntry sans clé provisionnée → lève FISCAL_SIGNING_KEY_MISSING', async () => {
      FiscalKeyService.reset();
      delete process.env.FISCAL_SIGNING_SECRET;

      await expect(
        FiscalEngine.sealEntry('tx-nokey', { amount: 500 }, { instanceId: 'tenant-sans-cle' })
      ).rejects.toThrow('FISCAL_SIGNING_KEY_MISSING');
    });

    it('repli sur FISCAL_SIGNING_SECRET env si pas de clé tenant provisionnée', async () => {
      FiscalKeyService.reset();
      process.env.FISCAL_SIGNING_SECRET = 'env-fallback-secret-32chars!!!!!!';

      // Aucune clé provisionnée pour ce tenant, mais env var définie → ne jette pas
      await expect(
        FiscalEngine.sealEntry('tx-env-fallback', { amount: 100 }, { instanceId: 'tenant-nouveau' })
      ).resolves.toBeDefined();
    });

    it('clé vide → lève FISCAL_SIGNATURE_SECRET_MISSING', async () => {
      await expect(
        CryptoService.signFiscalData('deadbeef'.repeat(8), '')
      ).rejects.toThrow('FISCAL_SIGNATURE_SECRET_MISSING');
    });
  });

  describe('Propriétés HMAC-SHA256', () => {
    it('même hash + même clé → même signature (déterministe)', async () => {
      const hash = 'a'.repeat(64);
      const sig1 = await CryptoService.signFiscalData(hash, KEY_A);
      const sig2 = await CryptoService.signFiscalData(hash, KEY_A);
      expect(sig1).toBe(sig2);
    });

    it('hash modifié d\'un seul bit → signature complètement différente', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'a'.repeat(63) + 'b'; // 1 char différent

      const sig1 = await CryptoService.signFiscalData(hash1, KEY_A);
      const sig2 = await CryptoService.signFiscalData(hash2, KEY_A);
      expect(sig1).not.toBe(sig2);
    });

    it('verifyFiscalSignature → true avec la bonne clé', async () => {
      const data = { tx: 'verify-test', amount: 12345 };
      const seal = await FiscalEngine.sealEntry('tx-verify', data, { instanceId: TENANT_A });

      const valid = await CryptoService.verifyFiscalSignature(seal.hash, seal.signature || '', KEY_A);
      expect(valid).toBe(true);
    });

    it('verifyFiscalSignature → false avec une signature trafiquée', async () => {
      const data = { tx: 'tamper-test', amount: 99999 };
      const seal = await FiscalEngine.sealEntry('tx-tamper', data, { instanceId: TENANT_A });

      const valid = await CryptoService.verifyFiscalSignature(
        seal.hash,
        'FORGED_SIGNATURE_' + (seal.signature || '').substring(17),
        KEY_A
      );
      expect(valid).toBe(false);
    });
  });
});
