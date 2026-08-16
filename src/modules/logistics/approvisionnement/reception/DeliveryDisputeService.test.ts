import { describe, it, expect } from 'vitest';
import { DeliveryDisputeService } from './DeliveryDisputeService';

describe('DeliveryDisputeService', () => {
  it('creates dispute entity, calculates missing quantities and totals accurately in cents', () => {
    const dispute = DeliveryDisputeService.createDispute({
      tenantId: 'tenant-lyon',
      disputeNumber: 'LIT-202608-0015',
      purchaseOrderId: 'po-101',
      deliveryNoteNumber: 'BL-98765',
      supplierId: 'supp-transgourmet',
      supplierName: 'Transgourmet Rhône-Alpes',
      reportedById: 'user-souschef',
      lines: [
        {
          id: 'l1',
          ingredientId: 'ing-beurre',
          ingredientName: 'Beurre Doux 82% 10x1kg',
          expectedPackagesCount: 3,
          receivedPackagesCount: 2,
          missingPackagesCount: 1,
          reason: 'MISSING_ITEM',
          packagePriceHtCts: 8800, // 88.00 €
        },
        {
          id: 'l2',
          ingredientId: 'ing-saumon',
          ingredientName: 'Pavé de Saumon Frais Colis 5kg',
          expectedPackagesCount: 2,
          receivedPackagesCount: 2,
          missingPackagesCount: 1, // 1 colis impropre (température > 6°C)
          reason: 'TEMPERATURE_NON_COMPLIANT',
          packagePriceHtCts: 11500, // 115.00 €
          comments: 'Température mesurée à coeur: 7.8°C (refusé HACCP)',
        },
      ],
      vatRatePct: 5.5,
    });

    expect(dispute.status).toBe('OPEN');
    expect(dispute.lines).toHaveLength(2);
    expect(dispute.totalClaimedHtCts).toBe(8800 + 11500); // 20300 cts = 203.00 €
    expect(dispute.totalClaimedVatCts).toBe(Math.round((20300 * 5.5) / 100)); // 1117 cts = 11.17 €
    expect(dispute.totalClaimedTtcCts).toBe(20300 + 1117); // 21417 cts = 214.17 €
  });

  it('generates claim email body with table of anomalies', () => {
    const dispute = DeliveryDisputeService.createDispute({
      tenantId: 'tenant-lyon',
      disputeNumber: 'LIT-202608-0015',
      deliveryNoteNumber: 'BL-98765',
      supplierId: 'supp-transgourmet',
      supplierName: 'Transgourmet',
      reportedById: 'user-chef',
      lines: [
        {
          id: 'l1',
          ingredientId: 'ing-beurre',
          ingredientName: 'Beurre Doux',
          expectedPackagesCount: 2,
          receivedPackagesCount: 1,
          missingPackagesCount: 1,
          reason: 'MISSING_ITEM',
          packagePriceHtCts: 8800,
        },
      ],
    });

    const email = DeliveryDisputeService.generateClaimEmailBody(dispute, 'Le Petit Poucet');
    expect(email).toContain('BL-98765');
    expect(email).toContain('LIT-202608-0015');
    expect(email).toContain('Beurre Doux');
    expect(email).toContain('88.00 € HT');
  });

  it('reconciles credit note received against the open dispute', () => {
    const dispute = DeliveryDisputeService.createDispute({
      tenantId: 'tenant-lyon',
      disputeNumber: 'LIT-202608-0015',
      deliveryNoteNumber: 'BL-98765',
      supplierId: 'supp-transgourmet',
      supplierName: 'Transgourmet',
      reportedById: 'user-chef',
      lines: [
        {
          id: 'l1',
          ingredientId: 'ing-beurre',
          ingredientName: 'Beurre Doux',
          expectedPackagesCount: 2,
          receivedPackagesCount: 1,
          missingPackagesCount: 1,
          reason: 'MISSING_ITEM',
          packagePriceHtCts: 10000, // 100.00 € HT
        },
      ],
      vatRatePct: 5.5,
    });

    // Total TTC = 10000 + 550 = 10550 cts (105.50 €)
    const res = DeliveryDisputeService.reconcileCreditNote(
      dispute,
      'AV-TG-54321',
      10550
    );

    expect(res.isExactMatch).toBe(true);
    expect(res.differenceCts).toBe(0);
    expect(res.updatedDispute.status).toBe('CREDIT_NOTE_RECEIVED');
    expect(res.updatedDispute.creditNoteNumber).toBe('AV-TG-54321');
  });
});
