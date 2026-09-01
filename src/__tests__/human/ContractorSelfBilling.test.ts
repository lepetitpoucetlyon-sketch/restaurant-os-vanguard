import { describe, it, expect } from 'vitest';
import { ContractorSelfBillingService } from '@/modules/human/services/ContractorSelfBillingService';
import { User } from '@/modules/human/domain/schemas/users';

describe('ContractorSelfBillingService — Mandat d\'Auto-Facturation B2B Freelance', () => {
  it('valide correctement un numéro SIRET avec l\'algorithme de Luhn', () => {
    // SIRET de test valide (ex: Ministère de l'économie ou entreprise connue)
    expect(ContractorSelfBillingService.validateSiretLuhn('73282932000074')).toBe(true);
    // SIRET invalide (mauvaise clé de contrôle)
    expect(ContractorSelfBillingService.validateSiretLuhn('12345678901234')).toBe(false);
    expect(ContractorSelfBillingService.validateSiretLuhn('court')).toBe(false);
  });

  it('génère une facture Factur-X en franchise de TVA (Art. 293 B du CGI)', () => {
    const mockContractor: User = {
      id: 'usr_freelance_01',
      type: 'user',
      name: 'Maxime Bartender Freelance',
      role: 'bartender',
      status: 'active',
      contractType: 'freelance',
      employmentStatus: 'contractor',
      contractorProfile: {
        companyName: 'Max Mixology EI',
        siret: '73282932000074',
        vatRegime: 'franchise_art_293b',
        billingRateType: 'hourly',
        rateInMicrounits: 25 * 1_000_000, // 25 € HT / h
        selfBillingAgreed: true,
        iban: 'FR7630006000011234567890189',
      },
      schemaVersion: 2,
      updatedAt: Date.now(),
    };

    const mockTenant = {
      id: 'tenant_le_petit_poucet',
      name: 'Le Petit Poucet Restaurant',
      siret: '89012345600012',
      address: '10 Rue Royale',
      city: 'Lyon',
      postalCode: '69001',
      vatNumber: 'FR12890123456',
    };

    const shifts = [
      { id: 'sh_1', date: '2026-09-02', startTime: '18:00', endTime: '23:00', description: 'Service cocktail rush' }, // 5h
      { id: 'sh_2', date: '2026-09-03', startTime: '18:00', endTime: '23:00', description: 'Service cocktail rush' }, // 5h
    ];

    const invoice = ContractorSelfBillingService.generateSelfBillingInvoice({
      contractor: mockContractor,
      tenant: mockTenant,
      shifts,
      periodMonth: '2026-09',
      invoiceSequenceNumber: 1042,
    });

    expect(invoice.invoiceNumber).toBe('FAC-AUTO-202609-1042');
    expect(invoice.totalHours).toBe(10);
    expect(invoice.totalHtEur).toBe(250); // 10h * 25€
    expect(invoice.totalVatEur).toBe(0);   // Franchise en base
    expect(invoice.totalTtcEur).toBe(250);
    expect(invoice.legalMentions).toContain('TVA non applicable, art. 293 B du CGI');
    expect(invoice.legalMentions).toContain("Facture émise au nom et pour le compte du prestataire (Mandat d'auto-facturation)");
    expect(invoice.xmlFacturX).toContain('<ram:ID>FAC-AUTO-202609-1042</ram:ID>');
    expect(invoice.xmlFacturX).toContain('<ram:GrandTotalAmount>250.00</ram:GrandTotalAmount>');
  });

  it('génère l\'écriture comptable de sous-traitance (compte 611000 / 401000)', () => {
    const mockContractor: User = {
      id: 'usr_freelance_02',
      type: 'user',
      name: 'Alex Chef Extra',
      role: 'kitchen_chef',
      status: 'active',
      contractType: 'freelance',
      employmentStatus: 'contractor',
      contractorProfile: {
        companyName: 'Alex Culinary Services',
        siret: '73282932000074',
        vatRegime: 'vat_standard_20',
        billingRateType: 'hourly',
        rateInMicrounits: 30 * 1_000_000, // 30 € HT / h
        selfBillingAgreed: true,
      },
      schemaVersion: 2,
      updatedAt: Date.now(),
    };

    const mockTenant = {
      id: 'tenant_lyon',
      name: 'Brasserie Bellecour',
      siret: '89012345600012',
      address: 'Place Bellecour',
      city: 'Lyon',
      postalCode: '69002',
    };

    const shifts = [
      { id: 'sh_3', date: '2026-09-04', startTime: '10:00', endTime: '15:00' }, // 5h @ 30€ = 150€ HT + 30€ TVA = 180€ TTC
    ];

    const invoice = ContractorSelfBillingService.generateSelfBillingInvoice({
      contractor: mockContractor,
      tenant: mockTenant,
      shifts,
      periodMonth: '2026-09',
    });

    expect(invoice.totalHtEur).toBe(150);
    expect(invoice.totalVatEur).toBe(30);
    expect(invoice.totalTtcEur).toBe(180);

    const journalEntry = ContractorSelfBillingService.generateAccountingEntry(invoice);

    expect(journalEntry.lines).toHaveLength(3);
    expect(journalEntry.lines[0].accountCode).toBe('611000'); // Débit Sous-traitance
    expect(journalEntry.lines[0].amountInCents).toBe(15000);
    expect(journalEntry.lines[1].accountCode).toBe('445660'); // Débit TVA déductible
    expect(journalEntry.lines[1].amountInCents).toBe(3000);
    expect(journalEntry.lines[2].accountCode).toBe('401000'); // Crédit Fournisseur
    expect(journalEntry.lines[2].amountInCents).toBe(18000);
  });
});
