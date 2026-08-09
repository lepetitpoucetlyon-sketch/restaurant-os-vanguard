/**
 * 🏦 NF525 — FinancialNexusBridge : chaîne end-to-end (Grade X)
 *
 * Teste processOrder × N avec le vrai CryptoService.generateHash.
 * MockAdapter simule Firestore (chainHead stateful entre appels).
 *
 * Ce test remplace la couverture lacunaire de financial-bridge.test.ts
 * qui mockait generateHash → validait l'écriture mais pas la chaîne réelle.
 *
 * RÈGLE : pas de mock de generateHash, signFiscalData ou canonicalStringify.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';
import { FiscalEngine, FISCAL_CONSTANTS } from '@/modules/finance/fiscalite/FiscalAdapter';
import { FiscalKeyService } from '@/modules/finance/services/FiscalKeyService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { CartItem } from '@/modules/ops';
import type { FiscalSeal } from '@nexus/contracts';

vi.mock('@/lib/audit', () => ({ empireAudit: { log: vi.fn() } }));
vi.mock('@/lib/shared-kernel', () => ({
  SharedKernel: { generateId: vi.fn((prefix: string) => `${prefix}-test-${Math.random().toString(36).slice(2, 8)}`) },
}));

const TENANT = 'tenant-bridge-chain';
const TEST_KEY = 'bridge-chain-test-key-32chars!!!!';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    cartId: `cart-${Math.random().toString(36).slice(2, 8)}`,
    productId: 'prod-entrecote',
    categoryId: 'cat-plats',
    name: 'Entrecôte Charolaise',
    quantity: 1,
    unitPriceInMicrounits: toMicrounits(25_000_000), // 25€
    discountInMicrounits: toMicrounits(0),
    taxRate: '0.10',
    modifiers: [],
    ...overrides,
  };
}

describe('🏦 FinancialNexusBridge — chaîne NF525 end-to-end', () => {
  beforeEach(() => {
    Nexus.adapter = new MockAdapter();
    FiscalKeyService.provision(TENANT, TEST_KEY);
  });

  afterEach(() => {
    FiscalKeyService.reset();
  });

  // ── Suite A — Chaîne réelle sur processOrder séquentiels ────────────────────

  describe('Suite A — Enchaînement de commandes', () => {
    it('première commande : seal.previousHash === GENESIS_ROOT', async () => {
      const result = await FinancialNexusBridge.processOrder({
        cartItems: [makeItem()],
        operatorId: 'op-1',
        tableId: 't-1',
        tenantId: TENANT,
      });

      expect(result.seal.previousHash).toBe(FISCAL_CONSTANTS.GENESIS_ROOT);
      expect(result.seal.hash).toHaveLength(64);
      expect(result.seal.hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('deuxième commande : seal.previousHash === hash de la première', async () => {
      const r1 = await FinancialNexusBridge.processOrder({
        cartItems: [makeItem({ name: 'Plat 1' })],
        operatorId: 'op-1',
        tableId: 't-1',
        tenantId: TENANT,
      });

      const r2 = await FinancialNexusBridge.processOrder({
        cartItems: [makeItem({ name: 'Plat 2' })],
        operatorId: 'op-1',
        tableId: 't-2',
        tenantId: TENANT,
      });

      expect(r2.seal.previousHash).toBe(r1.seal.hash);
    });

    it('3 commandes séquentielles → chaîne vérifiable via verifyChain', async () => {
      const seals: FiscalSeal[] = [];

      for (let i = 0; i < 3; i++) {
        const result = await FinancialNexusBridge.processOrder({
          cartItems: [makeItem({ name: `Plat ${i}`, quantity: i + 1 })],
          operatorId: 'op-1',
          tableId: `t-${i}`,
          tenantId: TENANT,
        });
        seals.push(result.seal);
      }

      // Liens chaîne
      expect(seals[1]!.previousHash).toBe(seals[0]!.hash);
      expect(seals[2]!.previousHash).toBe(seals[1]!.hash);
      // Vérification globale
      expect(await FiscalEngine.verifyChain(seals)).toBe(true);
    });

    it('chaque commande génère un hash différent (data + previousHash uniques)', async () => {
      const hashes = new Set<string>();

      for (let i = 0; i < 5; i++) {
        const result = await FinancialNexusBridge.processOrder({
          cartItems: [makeItem({ quantity: i + 1 })],
          operatorId: 'op-1',
          tableId: 't-1',
          tenantId: TENANT,
        });
        hashes.add(result.seal.hash);
      }

      // 5 hashes distincts
      expect(hashes.size).toBe(5);
    });
  });

  // ── Suite B — Avoir comptable (annulation) ───────────────────────────────────

  describe('Suite B — Avoir comptable', () => {
    it('processOrder avec quantity négative → chaîne intacte', async () => {
      const r1 = await FinancialNexusBridge.processOrder({
        cartItems: [makeItem()],
        operatorId: 'op-1',
        tableId: 't-1',
        tenantId: TENANT,
      });

      // Avoir : quantity négative
      const rAvoir = await FinancialNexusBridge.processOrder({
        cartItems: [makeItem({ quantity: -1 })],
        operatorId: 'op-1',
        tableId: 't-1',
        tenantId: TENANT,
      });

      // L'avoir est chainé après la vente
      expect(rAvoir.seal.previousHash).toBe(r1.seal.hash);
      expect(await FiscalEngine.verifyChain([r1.seal, rAvoir.seal])).toBe(true);
    });
  });

  // ── Suite C — Mode formation ─────────────────────────────────────────────────

  describe('Suite C — Mode formation', () => {
    it('mode formation → hash fixe, JournalEntry marqué formation', async () => {
      const result = await FinancialNexusBridge.processOrder({
        cartItems: [makeItem()],
        operatorId: 'op-formation',
        tableId: 't-demo',
        tenantId: TENANT,
        isTrainingMode: true,
      });

      expect(result.seal.hash).toBe(FISCAL_CONSTANTS.TRAINING_MODE_HASH);
      expect(result.seal.signature).toBe('VTC_SCHOOL_TRAINING_SIGNATURE');
      expect(result.journalEntry.isSystemGenerated).toBe(true);
    });

    it('commande formation + commande réelle : la réelle enchaîne sur la formation', async () => {
      const rFormation = await FinancialNexusBridge.processOrder({
        cartItems: [makeItem()],
        operatorId: 'op-1',
        tableId: 't-1',
        tenantId: TENANT,
        isTrainingMode: true,
      });

      const rReelle = await FinancialNexusBridge.processOrder({
        cartItems: [makeItem()],
        operatorId: 'op-1',
        tableId: 't-2',
        tenantId: TENANT,
      });

      // La commande réelle enchaîne sur le chainHead (qui était le hash de formation)
      expect(rReelle.seal.previousHash).toBe(rFormation.seal.hash);
    });
  });

  // ── Suite D — Calculs microunits ─────────────────────────────────────────────

  describe('Suite D — Intégrité des montants', () => {
    it('JournalEntry.amountInCents = totalTTC correct', async () => {
      const result = await FinancialNexusBridge.processOrder({
        cartItems: [
          makeItem({ quantity: 2, unitPriceInMicrounits: toMicrounits(25_000_000) }), // 2 × 25€ = 50€
        ],
        operatorId: 'op-1',
        tableId: 't-1',
        tenantId: TENANT,
      });

      // 50€ = 5000 centimes
      expect(result.journalEntry.amountInCents).toBe(5000);
    });

    it('remise appliquée → montant réduit dans JournalEntry', async () => {
      const result = await FinancialNexusBridge.processOrder({
        cartItems: [
          makeItem({
            quantity: 1,
            unitPriceInMicrounits: toMicrounits(20_000_000),   // 20€
            discountInMicrounits: toMicrounits(5_000_000),     // -5€
          }),
        ],
        operatorId: 'op-1',
        tableId: 't-1',
        tenantId: TENANT,
      });

      // 15€ = 1500 centimes
      expect(result.journalEntry.amountInCents).toBe(1500);
    });

    it('panier vide → rejet immédiat, aucun sceau créé', async () => {
      await expect(
        FinancialNexusBridge.processOrder({
          cartItems: [],
          operatorId: 'op-1',
          tableId: 't-1',
          tenantId: TENANT,
        })
      ).rejects.toThrow();
    });
  });
});
