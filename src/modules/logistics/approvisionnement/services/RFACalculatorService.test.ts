import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RFACalculatorService, RFATier } from './RFACalculatorService';
import { empireAudit } from '@/lib/audit';

describe('💶 RFACalculatorService — Calcul des Remises de Fin d\'Année Fournisseurs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const supplierId = 'supp_metro_lyon';

  const mockTiers: RFATier[] = [
    { spendThresholdInMicrounits: 10_000_000_000, rebatePercentage: 2.0 }, // 10 000€ -> 2%
    { spendThresholdInMicrounits: 30_000_000_000, rebatePercentage: 3.5 }, // 30 000€ -> 3.5%
    { spendThresholdInMicrounits: 60_000_000_000, rebatePercentage: 5.0 }, // 60 000€ -> 5%
  ];

  it('devrait retourner 0 RFA et le premier palier si le volume d\'achat est inférieur au 1er seuil', () => {
    const result = RFACalculatorService.calculateRFA(
      supplierId,
      5_000_000_000, // 5 000€
      mockTiers
    );

    expect(result.supplierId).toBe(supplierId);
    expect(result.accumulatedSpendInMicrounits).toBe(5_000_000_000);
    expect(result.activeTier).toBeNull();
    expect(result.rfaAmountInMicrounits).toBe(0);
    expect(result.nextTier?.spendThresholdInMicrounits).toBe(10_000_000_000);
  });

  it('devrait calculer le montant RFA exact pour le palier 2 atteint (3.5%)', () => {
    const spyAudit = vi.spyOn(empireAudit, 'log');

    const result = RFACalculatorService.calculateRFA(
      supplierId,
      35_000_000_000, // 35 000€
      mockTiers
    );

    expect(result.activeTier?.rebatePercentage).toBe(3.5);
    // 35_000_000_000 * 3.5% = 1_225_000_000 (1 225€)
    expect(result.rfaAmountInMicrounits).toBe(1_225_000_000);
    expect(result.nextTier?.spendThresholdInMicrounits).toBe(60_000_000_000);

    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'accounting',
        action: 'RFA_THRESHOLD_REACHED',
        severity: 'low',
        details: expect.objectContaining({
          supplierId,
          tierPercentage: 3.5,
        }),
      })
    );
  });

  it('devrait calculer le montant pour le palier maximal atteint et nextTier=null', () => {
    const result = RFACalculatorService.calculateRFA(
      supplierId,
      80_000_000_000, // 80 000€
      mockTiers
    );

    expect(result.activeTier?.rebatePercentage).toBe(5.0);
    // 80_000_000_000 * 5% = 4_000_000_000 (4 000€)
    expect(result.rfaAmountInMicrounits).toBe(4_000_000_000);
    expect(result.nextTier).toBeNull();
  });
});
