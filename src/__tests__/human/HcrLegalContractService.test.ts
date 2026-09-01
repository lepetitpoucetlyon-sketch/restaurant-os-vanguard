import { describe, it, expect } from 'vitest';
import { HcrLegalContractService } from '@/modules/human/services/HcrLegalContractService';
import { User } from '@/modules/human/domain/schemas/users';

describe('HcrLegalContractService — Contrats de travail HCR & Conventions Freelance', () => {
  const restaurant = {
    name: 'Le Petit Poucet',
    companyName: 'Le Petit Poucet SAS',
    siret: '89012345600012',
    address: '10 Rue Royale',
    city: 'Lyon',
    postalCode: '69001',
    representativeName: 'Jean Dupont',
    representativeRole: 'Président',
  };

  it('génère une convention de prestation de service & mandat d\'auto-facturation pour un freelance', () => {
    const freelanceUser: User = {
      id: 'usr_free',
      type: 'user',
      name: 'Sam Mixologue',
      role: 'bartender',
      status: 'active',
      contractType: 'freelance',
      employmentStatus: 'contractor',
      contractorProfile: {
        companyName: 'Sam Events EI',
        siret: '73282932000074',
        vatRegime: 'franchise_art_293b',
        billingRateType: 'hourly',
        rateInMicrounits: 25 * 1_000_000,
        selfBillingAgreed: true,
      },
      schemaVersion: 2,
      updatedAt: Date.now(),
    };

    const doc = HcrLegalContractService.generateContract({
      collaborator: freelanceUser,
      restaurant,
      startDate: '2026-09-10',
      jobTitle: 'Barman Mixologue Événementiel',
      hourlyRateEur: 25,
    });

    expect(doc.type).toBe('CONVENTION_PRESTATION_FREELANCE');
    expect(doc.title).toContain('Convention de Prestation');
    expect(doc.fullText).toContain('MANDAT D\'AUTO-FACTURATION');
    expect(doc.fullText).toContain('OBLIGATION DE VIGILANCE');
    expect(doc.parties.employeeOrContractor).toContain('Sam Events EI');
  });

  it('génère un contrat de travail CDI HCR 39h', () => {
    const cdiUser: User = {
      id: 'usr_cdi',
      type: 'user',
      name: 'Claire Chef de Rang',
      role: 'server',
      status: 'active',
      contractType: 'cdi_39h',
      employmentStatus: 'employee',
      hourlyRateInMicrounits: 14 * 1_000_000,
      schemaVersion: 2,
      updatedAt: Date.now(),
    };

    const doc = HcrLegalContractService.generateContract({
      collaborator: cdiUser,
      restaurant,
      startDate: '2026-09-01',
      jobTitle: 'Chef de Rang',
      classificationLevel: 'Niveau II Échelon 1',
      hourlyRateEur: 14,
      weeklyHours: 39,
    });

    expect(doc.type).toBe('CDI_HCR');
    expect(doc.title).toContain('CCN HCR IDCC 1979');
    expect(doc.fullText).toContain('Convention Collective Nationale des Hôtels, Cafés, Restaurants');
    expect(doc.fullText).toContain('39 heures');
    expect(doc.fullText).toContain('majoration légale et conventionnelle de 10%');
  });

  it('génère un contrat Extra CDDU HCR avec indemnité congés payés 10%', () => {
    const extraUser: User = {
      id: 'usr_extra',
      type: 'user',
      name: 'Marc Extra',
      role: 'server',
      status: 'active',
      contractType: 'extra_cddu',
      employmentStatus: 'employee',
      hourlyRateInMicrounits: 15 * 1_000_000,
      schemaVersion: 2,
      updatedAt: Date.now(),
    };

    const doc = HcrLegalContractService.generateContract({
      collaborator: extraUser,
      restaurant,
      startDate: '2026-09-05',
      jobTitle: 'Serveur Extra de Soirée',
      hourlyRateEur: 15,
    });

    expect(doc.type).toBe('EXTRA_CDDU_HCR');
    expect(doc.title).toContain('Contrat Extra CDDU');
    expect(doc.fullText).toContain('DÉCLARATION PRÉALABLE À L\'EMBAUCHE (DPAE)');
    expect(doc.fullText).toContain('indemnité compensatrice de congés payés de 10%');
  });
});
