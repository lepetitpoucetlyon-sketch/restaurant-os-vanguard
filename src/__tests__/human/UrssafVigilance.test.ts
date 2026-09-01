import { describe, it, expect, beforeEach } from 'vitest';
import { UrssafVigilanceService, UrssafVigilanceError, URSSAF_CONSTANTS } from '@/modules/human/services/UrssafVigilanceService';
import { User } from '@/modules/human/domain/schemas/users';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';

describe('UrssafVigilanceService — Contrôle légal de vigilance semestrielle (Art. L.8222-1)', () => {
  beforeEach(() => {
    Nexus.adapter = new MockAdapter();
  });

  const baseContractor: User = {
    id: 'usr_freelance_urssaf',
    type: 'user',
    name: 'Sarah Chef Sommelier EI',
    role: 'sommelier',
    status: 'active',
    contractType: 'freelance',
    employmentStatus: 'contractor',
    contractorProfile: {
      companyName: 'Sarah Sommelier',
      siret: '73282932000074',
      vatRegime: 'franchise_art_293b',
      billingRateType: 'hourly',
      rateInMicrounits: 30 * 1_000_000,
      selfBillingAgreed: true,
      vigilanceStatus: 'missing',
    },
    schemaVersion: 2,
    updatedAt: Date.now(),
  };

  it('autorise la facturation si le cumul annuel reste sous le seuil de 5 000 €', async () => {
    const tenantId = 'tenant_urssaf_1';
    // Facture de 1 200 € (1 200 000 000 µ)
    const invoiceAmountMu = 1_200 * 1_000_000;

    await expect(
      UrssafVigilanceService.assertCompliance(tenantId, baseContractor, invoiceAmountMu, 2026)
    ).resolves.not.toThrow();

    await UrssafVigilanceService.recordInvoiceTotal(tenantId, baseContractor.id, invoiceAmountMu, 2026);
    const total = await UrssafVigilanceService.getContractorAnnualTotalMu(tenantId, baseContractor.id, 2026);
    expect(total).toBe(invoiceAmountMu);
  });

  it('bloque la facturation si le cumul projeté dépasse 5 000 € sans attestation', async () => {
    const tenantId = 'tenant_urssaf_2';
    // Cumul existant : 4 500 €
    await UrssafVigilanceService.recordInvoiceTotal(tenantId, baseContractor.id, 4_500 * 1_000_000, 2026);

    // Nouvelle facture de 800 € -> Cumul projeté 5 300 € > 5 000 €
    const newInvoiceAmountMu = 800 * 1_000_000;

    await expect(
      UrssafVigilanceService.assertCompliance(tenantId, baseContractor, newInvoiceAmountMu, 2026)
    ).rejects.toThrow(UrssafVigilanceError);
  });

  it('autorise la facturation au-delà de 5 000 € si une attestation valide est fournie', async () => {
    const tenantId = 'tenant_urssaf_3';
    await UrssafVigilanceService.recordInvoiceTotal(tenantId, baseContractor.id, 6_000 * 1_000_000, 2026);

    const compliantContractor: User = {
      ...baseContractor,
      contractorProfile: {
        ...baseContractor.contractorProfile!,
        vigilanceStatus: 'valid',
        urssafVigilanceCertificateUrl: 'https://storage.restaurant-os.internal/urssaf_2026.pdf',
        urssafVigilanceValidUntil: '2026-12-31T23:59:59.000Z',
      }
    };

    const newInvoiceAmountMu = 500 * 1_000_000;
    await expect(
      UrssafVigilanceService.assertCompliance(tenantId, compliantContractor, newInvoiceAmountMu, 2026)
    ).resolves.not.toThrow();
  });

  it('bloque la facturation si l\'attestation a dépassé sa date de validité semestrielle', async () => {
    const tenantId = 'tenant_urssaf_4';
    await UrssafVigilanceService.recordInvoiceTotal(tenantId, baseContractor.id, 5_500 * 1_000_000, 2026);

    const expiredContractor: User = {
      ...baseContractor,
      contractorProfile: {
        ...baseContractor.contractorProfile!,
        vigilanceStatus: 'valid', // Marqué valide mais date passée
        urssafVigilanceCertificateUrl: 'https://storage.restaurant-os.internal/urssaf_old.pdf',
        urssafVigilanceValidUntil: '2026-01-01T00:00:00.000Z', // Expiré
      }
    };

    const newInvoiceAmountMu = 500 * 1_000_000;
    await expect(
      UrssafVigilanceService.assertCompliance(tenantId, expiredContractor, newInvoiceAmountMu, 2026)
    ).rejects.toThrow(UrssafVigilanceError);
  });
});
