import { describe, it, expect, beforeEach } from 'vitest';
import { FiscalEngine, FISCAL_CONSTANTS } from '@/modules/finance';
import { FiscalKeyService } from '@/modules/finance/services/FiscalKeyService';
import type { FiscalSeal } from '@nexus/contracts';

describe('⚖️ NF525 Fiscal Guard & Cryptographic Sealing — Inaltérabilité & Audit Trail', () => {
  const TENANT_ID = 'tenant_fiscal_nf525_001';
  const FISCAL_KEY = FiscalKeyService.generateKey();

  beforeEach(() => {
    FiscalKeyService.reset();
    FiscalKeyService.provision(TENANT_ID, FISCAL_KEY);
  });

  it('1. Scelle cryptographiquement un ticket de caisse avec signature inaltérable', async () => {
    const saleData = {
      orderId: 'ord_pos_101',
      totalAmountCts: 4850, // 48.50 €
      vatAmountCts: 440,
      paymentMethod: 'CB',
      operatorId: 'emp_caisse_1',
    };

    const seal1 = await FiscalEngine.sealEntry('tx_sale_101', saleData, {
      instanceId: TENANT_ID,
    });

    expect(seal1.id).toMatch(/^(SEAL_|seal_)/i);
    expect(seal1.transactionId).toBe('tx_sale_101');
    expect(seal1.previousHash).toBe(FISCAL_CONSTANTS.GENESIS_ROOT);
    expect(seal1.hash).toBeDefined();
    expect(seal1.signature).toBeDefined();
    expect(seal1.signature?.length).toBeGreaterThan(20);
  });

  it('2. Enchaîne les scellements (Ticket 1 -> Annulation Ligne -> Ticket 2 -> Clôture Z)', async () => {
    const seals: FiscalSeal[] = [];

    // 1. Vente initiale
    const seal1 = await FiscalEngine.sealEntry('tx_001', {
      type: 'SALE',
      totalCts: 3500,
      itemsCount: 2,
    }, { instanceId: TENANT_ID });
    seals.push(seal1);

    // 2. Annulation partielle / Correction de ligne (Obligation légale NF525)
    const seal2 = await FiscalEngine.sealEntry('tx_002', {
      type: 'LINE_CORRECTION',
      canceledItem: 'Dessert du Jour',
      correctionAmountCts: -800,
      reason: 'Erreur de saisie serveur',
    }, { lastSeal: seal1, instanceId: TENANT_ID });
    seals.push(seal2);

    // 3. Encaissement final
    const seal3 = await FiscalEngine.sealEntry('tx_003', {
      type: 'PAYMENT',
      settledAmountCts: 2700,
      paymentMethod: 'CASH',
    }, { lastSeal: seal2, instanceId: TENANT_ID });
    seals.push(seal3);

    // 4. Clôture de caisse quotidienne (Ticket Z)
    const seal4 = await FiscalEngine.sealEntry('tx_z_report_20260816', {
      type: 'Z_REPORT',
      dailyTotalCts: 2700,
      grandTotalPerpetualCts: 1458900,
      fiscalDate: '2026-08-16',
    }, { lastSeal: seal3, instanceId: TENANT_ID });
    seals.push(seal4);

    // Vérification de la continuité de chaîne
    expect(seal2.previousHash).toBe(seal1.hash);
    expect(seal3.previousHash).toBe(seal2.hash);
    expect(seal4.previousHash).toBe(seal3.hash);

    const isChainValid = await FiscalEngine.verifyChain(seals);
    expect(isChainValid).toBe(true);

    const auditReport = await FiscalEngine.runAudit(seals, TENANT_ID);
    expect(auditReport.success).toBe(true);
    expect(auditReport.integrity).toBe(true);
    expect(auditReport.sealedCount).toBe(4);
  });

  it('3. Détecte immédiatement toute tentative de falsification ou modification de montant (Anti-Fraude)', async () => {
    // IDs uniques par test — la garde B.3 (Lot correctif) refuse de ré-écrire un journalEntry existant
    const seal1 = await FiscalEngine.sealEntry('tx_fraud_101', {
      amountCts: 10000,
    }, { instanceId: TENANT_ID });

    const seal2 = await FiscalEngine.sealEntry('tx_fraud_102', {
      amountCts: 20000,
    }, { lastSeal: seal1, instanceId: TENANT_ID });

    const corruptedSeals: FiscalSeal[] = [
      seal1,
      {
        ...seal2,
        // Tentative de modification frauduleuse du dataSnapshot après signature
        dataSnapshot: JSON.stringify({ amountCts: 5000 }),
      }
    ];

    const isCorruptedChainValid = await FiscalEngine.verifyChain(corruptedSeals);
    expect(isCorruptedChainValid).toBe(false);

    const auditReport = await FiscalEngine.runAudit(corruptedSeals, TENANT_ID);
    expect(auditReport.integrity).toBe(false);
    expect(auditReport.success).toBe(false);
  });
});
