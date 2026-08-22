import { describe, it, expect } from 'vitest';
import { MonthlyAccountingPackService } from '@/modules/finance/comptabilite/services/MonthlyAccountingPackService';

describe('MonthlyAccountingPackService — Pack Fiduciaire & Expert-Comptable', () => {
  const tenantId = 'test-restaurant-lyon';
  const yearMonth = '2026-08';

  it('devrait générer le résumé mensuel avec ventilation TVA exacte et scellement NF525', async () => {
    const summary = await MonthlyAccountingPackService.getMonthlySummary(tenantId, yearMonth);

    expect(summary.period).toBe(yearMonth);
    expect(summary.tenantId).toBe(tenantId);
    expect(summary.totalRevenueTtcCents).toBeGreaterThan(0);
    expect(summary.totalRevenueHtCents).toBeGreaterThan(0);

    // Vérification de la ventilation TVA
    expect(summary.vatBreakdown.vat55AmountCents).toBeGreaterThanOrEqual(0);
    expect(summary.vatBreakdown.vat10AmountCents).toBeGreaterThanOrEqual(0);
    expect(summary.vatBreakdown.vat20AmountCents).toBeGreaterThanOrEqual(0);

    // Vérification du scellement NF525
    expect(summary.nf525.isSealValid).toBe(true);
    expect(summary.nf525.masterHashSha256).toBeDefined();
    expect(summary.nf525.masterHashSha256.length).toBe(64); // SHA-256 hex string

    // Vérification des variables de paie Silae HCR
    expect(summary.payroll.employeeCount).toBe(14);
    expect(summary.payroll.staffMealsDeclaredCount).toBe(384);
    expect(summary.payroll.declaredTipsTotalCents).toBe(142000);
  });

  it('devrait générer les fichiers complets du pack (FEC DGFiP, Grand Livre NF525, Silae CSV)', async () => {
    const pack = await MonthlyAccountingPackService.generatePackFiles(tenantId, yearMonth);

    expect(pack.files.fecFileName).toBe('FEC_202608.txt');
    expect(pack.files.fecContent).toBeDefined();
    expect(pack.files.fecContent.length).toBeGreaterThan(0);

    expect(pack.files.silaeFileName).toBe('PAIE_VARIABLES_SILAE_2026-08.csv');
    expect(pack.files.silaeContent).toContain('Matricule;Nom;Prenom');
    expect(pack.files.silaeContent).toContain('DUPONT');

    expect(pack.files.nf525GrandLivreFileName).toBe('GRAND_LIVRE_NF525_2026-08.json');
    expect(pack.files.tvaBordereauFileName).toBe('VENTILATION_TVA_CA3_2026-08.json');
  });
});
