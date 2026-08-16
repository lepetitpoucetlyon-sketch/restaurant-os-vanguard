import { describe, it, expect } from 'vitest';
import { RfaContractService } from './RfaContractService';
import type { RfaContractEntity } from './RfaContractTypes';

describe('RfaContractService', () => {
  const sampleContract: RfaContractEntity = {
    id: 'rfa-2026',
    tenantId: 'tenant-lyon',
    contractNumber: 'RFA-HEINEKEN-2026',
    supplierId: 'supp-france-boissons',
    supplierName: 'France Boissons',
    year: 2026,
    startDateUtc: Date.UTC(2026, 0, 1),
    endDateUtc: Date.UTC(2026, 11, 31),
    tiers: [
      { thresholdVolumeCts: 1000000, rebateRatePct: 2.0 }, // 10 000 € -> 2%
      { thresholdVolumeCts: 2500000, rebateRatePct: 4.0 }, // 25 000 € -> 4%
      { thresholdVolumeCts: 5000000, rebateRatePct: 6.0 }, // 50 000 € -> 6%
    ],
    brewerKegCommitments: [
      { brandName: 'Heineken 30L', targetKegsCount: 200, rebatePerKegCts: 1500, achievedKegsCount: 80 },
    ],
    cumulativePurchasesHtCts: 1800000, // 18 000 € -> Tier 0 (2%)
    isSettled: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('calculates current tier, earned rebate and remaining volume to next tier', () => {
    const projection = RfaContractService.calculateRfaProjection(sampleContract);

    expect(projection.currentTierIndex).toBe(0); // 1er palier (10k€)
    expect(projection.currentRebateRatePct).toBe(2.0);
    expect(projection.currentEarnedRebateCts).toBe(36000); // 18 000 * 2% = 360.00 € (36000 cts)

    expect(projection.nextTier).toBeDefined();
    expect(projection.nextTier?.thresholdVolumeCts).toBe(2500000); // 25 000 €
    expect(projection.nextTier?.remainingVolumeToReachCts).toBe(700000); // 25 000 - 18 000 = 7 000 €

    expect(projection.brewerRebateTotalCts).toBe(80 * 1500); // 1 200.00 € (120000 cts)
    expect(projection.totalProjectedRebateCts).toBe(36000 + 120000); // 1 560.00 €
  });

  it('detects when a new purchase crosses a higher RFA tier', () => {
    // Achat de 8 000 € (800000 cts), passant le total de 18 000 € à 26 000 € (> 25 000 €)
    const res = RfaContractService.recordPurchaseInvoice(
      sampleContract,
      800000,
      [{ brandName: 'Heineken 30L', kegsCount: 10 }]
    );

    expect(res.hasCrossedNewTier).toBe(true);
    expect(res.newProjection.currentTierIndex).toBe(1); // Passage au Palier 2 (4%)
    expect(res.newProjection.currentRebateRatePct).toBe(4.0);
    expect(res.newProjection.currentEarnedRebateCts).toBe(Math.round((2600000 * 4.0) / 100)); // 1 040.00 €
  });
});
