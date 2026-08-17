import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonthlyAccountingPackService } from '@/modules/finance/comptabilite/services/MonthlyAccountingPackService';
import { WormArchiveStorageService } from '@/modules/finance/fiscalite/WormArchiveStorageService';
import type { FiscalSeal } from '@/shared/nexus/contracts/finance.types';

describe('E2E Scénario 4 : Parcours Fiduciaire & Clôture Mensuelle de l Expert-Comptable (/accounting-portal)', () => {
  const tenantId = 'bistrot-grand-angle-paris';
  const period = '2026-08';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait exécuter le cycle complet de clôture mensuelle pour le cabinet comptable', async () => {
    // 1. Consultation des métriques fiscales consolidées du mois
    const summary = await MonthlyAccountingPackService.getMonthlySummary(tenantId, period);

    expect(summary.tenantId).toBe(tenantId);
    expect(summary.period).toBe(period);
    expect(summary.totalRevenueTtcCents).toBeGreaterThan(0);
    expect(summary.totalRevenueHtCents).toBeGreaterThan(0);

    // 2. Vérification de la ventilation TVA stricte (5.5%, 10%, 20%)
    const { vat55AmountCents, vat10AmountCents, vat20AmountCents } = summary.vatBreakdown;
    const totalVatCalculated = vat55AmountCents + vat10AmountCents + vat20AmountCents;
    expect(totalVatCalculated).toBe(summary.totalRevenueTtcCents - summary.totalRevenueHtCents);
    expect(summary.mealVouchersTotalCents).toBeGreaterThan(0);

    // 3. Validation de l inaltérabilité NF525 & Archivage WORM 6 ans
    expect(summary.nf525.isSealValid).toBe(true);
    expect(summary.nf525.masterHashSha256).toMatch(/^[a-f0-9]{64}$/);

    const dummySeal: FiscalSeal = {
      id: `SEAL-${tenantId}-${period}`,
      signature: summary.nf525.masterHashSha256,
      previousHash: 'NF525-GENESIS-RESTO-OS',
      hash: summary.nf525.masterHashSha256,
      timestamp: new Date().toISOString(),
      updatedAt: Date.now(),
      recordId: `CLOSE-${period}`,
      period,
      grandTotal: summary.totalRevenueTtcCents,
      totalVat: totalVatCalculated,
      status: 'sealed',
    };

    const wormEntry = await WormArchiveStorageService.sealPeriodArchive(
      tenantId,
      2026,
      'accountant-auditor',
      [dummySeal],
      8
    );
    expect(wormEntry.wormStatus).toBe('ACTIVE_LOCKED');
    expect(wormEntry.retentionYears).toBe(6); // 6 ans légaux
    expect(wormEntry.immutableUntilTimestamp).toBeGreaterThan(Date.now());

    // 4. Extraction & Intégrité des variables de Paie Silae HCR
    expect(summary.payroll.employeeCount).toBeGreaterThan(0);
    expect(summary.payroll.staffMealsDeclaredCount).toBe(384);
    expect(summary.payroll.overtimeHours10).toBeGreaterThanOrEqual(0);
    expect(summary.payroll.overtimeHours20).toBeGreaterThanOrEqual(0);
    expect(summary.payroll.overtimeHours50).toBeGreaterThanOrEqual(0);
    expect(summary.payroll.declaredTipsTotalCents).toBe(142000);

    // 5. Génération intégrale du Pack de Fichiers (FEC DGFiP, Silae CSV, Grand Livre)
    const pack = await MonthlyAccountingPackService.generatePackFiles(tenantId, period);

    expect(pack.files.fecFileName).toBe('FEC_202608.txt');
    expect(pack.files.fecContent).toContain('JournalCode|JournalLib');
    expect(pack.files.silaeFileName).toBe('PAIE_VARIABLES_SILAE_2026-08.csv');
    expect(pack.files.silaeContent).toContain('Matricule;Nom;Prenom');
    expect(pack.files.nf525GrandLivreFileName).toBe('GRAND_LIVRE_NF525_2026-08.json');
    expect(pack.files.tvaBordereauFileName).toBe('VENTILATION_TVA_CA3_2026-08.json');

    // 6. Inspection par l Agent IA Auditeur Themis
    expect(summary.aiAuditAlerts.length).toBeGreaterThan(0);
    const vatAlert = summary.aiAuditAlerts.find(a => a.category === 'VAT');
    expect(vatAlert).toBeDefined();
    expect(vatAlert?.level).toBe('INFO');
  });
});
