import { User } from '../domain/schemas/users';

/**
 * 📜 HcrLegalContractService — Restaurant OS
 * Générateur de contrats de travail conformes CCN HCR (IDCC 1979)
 * et de conventions de prestation de service B2B / Mandat d'auto-facturation pour freelances.
 */

export interface ContractGenerationInput {
  collaborator: User;
  restaurant: {
    name: string;
    companyName: string;
    siret: string;
    address: string;
    city: string;
    postalCode: string;
    representativeName: string;
    representativeRole: string;
  };
  startDate: string; // "YYYY-MM-DD"
  endDate?: string;  // Pour CDD / Extra
  jobTitle: string;
  classificationLevel?: string; // "Niveau I Échelon 1"
  hourlyRateEur?: number;
  monthlyGrossEur?: number;
  weeklyHours?: number; // 35 ou 39
}

export interface GeneratedLegalDocument {
  documentId: string;
  type: 'CDI_HCR' | 'CDD_HCR' | 'EXTRA_CDDU_HCR' | 'CONVENTION_PRESTATION_FREELANCE';
  title: string;
  parties: {
    employerOrClient: string;
    employeeOrContractor: string;
  };
  sections: Array<{
    articleNumber: string;
    title: string;
    content: string;
  }>;
  fullText: string;
  generatedAt: number;
}

export class HcrLegalContractService {
  /**
   * Génère le contrat adéquat selon le statut du collaborateur (Salarié HCR ou Prestataire).
   */
  static generateContract(input: ContractGenerationInput): GeneratedLegalDocument {
    const isFreelance = input.collaborator.contractType === 'freelance' || input.collaborator.employmentStatus === 'contractor';

    if (isFreelance) {
      return this.generateFreelanceAgreement(input);
    }

    const type = input.collaborator.contractType;
    if (type === 'extra_cddu') {
      return this.generateExtraCdduContract(input);
    } else if (type === 'cdd') {
      return this.generateCddContract(input);
    } else {
      return this.generateCdiContract(input);
    }
  }

  /**
   * 1. CONVENTION DE PRESTATION DE SERVICES & MANDAT D'AUTO-FACTURATION (B2B)
   */
  private static generateFreelanceAgreement(input: ContractGenerationInput): GeneratedLegalDocument {
    const docId = `CONV-FREELANCE-${Date.now().toString(36).toUpperCase()}`;
    const profile = input.collaborator.contractorProfile;
    const siret = profile?.siret || 'En cours d\'immatriculation';
    const rate = input.hourlyRateEur || 25;

    const sections = [
      {
        articleNumber: 'ARTICLE 1',
        title: 'OBJET DE LA MISSION & AUTONOMIE',
        content: `Le Prestataire indépendant (${profile?.companyName || input.collaborator.name}, SIRET: ${siret}) s'engage à exécuter pour le Donneur d'ordre (${input.restaurant.name}) des missions ponctuelles de ${input.jobTitle}. Le Prestataire agit en toute indépendance et autonomie, sans aucun lien de subordination juridique.`
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'RÉMUNÉRATION & CONDITIONS FINANCIÈRES',
        content: `La prestation est rémunérée sur la base convenue de ${rate.toFixed(2)} € HT par heure d'intervention effective. Les vacations sont pointées et certifiées électroniquement via le système sécurisé du Donneur d'ordre.`
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'MANDAT D\'AUTO-FACTURATION (SELF-BILLING)',
        content: `En application de l'article 242 nonies de l'annexe II au Code Général des Impôts, le Prestataire donne mandat exprès au Donneur d'ordre d'établir en son nom et pour son compte les factures afférentes aux prestations accomplies. Le Prestataire conserve l'entière responsabilité de ses obligations fiscales et de sa déclaration de TVA (${profile?.vatRegime === 'franchise_art_293b' ? "Franchise en base Art. 293 B du CGI" : "TVA 20%"}).`
      },
      {
        articleNumber: 'ARTICLE 4',
        title: 'OBLIGATION DE VIGILANCE & CONFORMITÉ SOCIALE',
        content: `Conformément aux articles L. 8222-1 et R. 8222-1 du Code du travail, le Prestataire fournit lors de la signature et tous les 6 mois son attestation de vigilance URSSAF attestant de la régularité de sa situation.`
      }
    ];

    const fullText = sections.map(s => `${s.articleNumber} — ${s.title}\n${s.content}`).join('\n\n');

    return {
      documentId: docId,
      type: 'CONVENTION_PRESTATION_FREELANCE',
      title: 'Convention de Prestation de Service & Mandat d\'Auto-Facturation',
      parties: {
        employerOrClient: `${input.restaurant.companyName} (SIRET: ${input.restaurant.siret})`,
        employeeOrContractor: `${profile?.companyName || input.collaborator.name} (SIRET: ${siret})`
      },
      sections,
      fullText,
      generatedAt: Date.now()
    };
  }

  /**
   * 2. CONTRAT DE TRAVAIL CDI CONVENTION HCR (IDCC 1979)
   */
  private static generateCdiContract(input: ContractGenerationInput): GeneratedLegalDocument {
    const docId = `CDI-HCR-${Date.now().toString(36).toUpperCase()}`;
    const hours = input.weeklyHours || 39;
    const rate = input.hourlyRateEur || 13.50;

    const sections = [
      {
        articleNumber: 'ARTICLE 1',
        title: 'ENGAGEMENT & CONVENTION COLLECTIVE',
        content: `Le Salarié (${input.collaborator.name}) est engagé en Contrat de Travail à Durée Indéterminée par ${input.restaurant.companyName}, à compter du ${input.startDate}. Le présent contrat est soumis aux dispositions de la Convention Collective Nationale des Hôtels, Cafés, Restaurants (IDCC 1979).`
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'FONCTION & CLASSIFICATION',
        content: `Le Salarié est engagé en qualité de ${input.jobTitle}, classification ${input.classificationLevel || 'Niveau I Échelon 1'}.`
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'DURÉE DU TRAVAIL & HORAIRES',
        content: `La durée hebdomadaire de travail est fixée à ${hours} heures. Les 4 heures accomplies entre la 36e et la 39e heure hebdomadaire constituent des heures supplémentaires régulières et bénéficient de la majoration légale et conventionnelle de 10%.`
      },
      {
        articleNumber: 'ARTICLE 4',
        title: 'RÉMUNÉRATION & AVANTAGES EN NATURE',
        content: `Le Salarié percevra un taux horaire brut de ${rate.toFixed(2)} €. Conformément à la convention HCR, le Salarié bénéficie des avantages en nature nourriture (Minimum Garanti) pour les repas pris sur les horaires de service.`
      },
      {
        articleNumber: 'ARTICLE 5',
        title: 'PÉRIODE D\'ESSAI',
        content: `Le présent contrat deviendra définitif à l'issue d'une période d'essai d'un mois, éventuellement renouvelable une fois selon les dispositions conventionnelles HCR.`
      }
    ];

    const fullText = sections.map(s => `${s.articleNumber} — ${s.title}\n${s.content}`).join('\n\n');

    return {
      documentId: docId,
      type: 'CDI_HCR',
      title: 'Contrat de Travail à Durée Indéterminée (CCN HCR IDCC 1979)',
      parties: {
        employerOrClient: `${input.restaurant.companyName} (SIRET: ${input.restaurant.siret})`,
        employeeOrContractor: input.collaborator.name
      },
      sections,
      fullText,
      generatedAt: Date.now()
    };
  }

  /**
   * 3. CONTRAT EXTRA CDDU (CONTRAT À DURÉE DÉTERMINÉE D'USAGE HCR)
   */
  private static generateExtraCdduContract(input: ContractGenerationInput): GeneratedLegalDocument {
    const docId = `CDDU-HCR-${Date.now().toString(36).toUpperCase()}`;

    const sections = [
      {
        articleNumber: 'ARTICLE 1',
        title: 'NATURE DU CONTRAT (EXTRA D\'USAGE)',
        content: `En application de l'article L. 1242-2 3° du Code du travail et de l'article 14 de la CCN HCR, le Salarié est embauché en qualité d'Extra pour un accroissement temporaire ou un événement déterminé le ${input.startDate}.`
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'DÉCLARATION PRÉALABLE À L\'EMBAUCHE (DPAE)',
        content: `L'embauche fait l'objet d'une déclaration préalable enregistrée auprès de l'URSSAF avant toute prise de poste effective.`
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'RÉMUNÉRATION & INDEMNITÉ DE CONGÉS PAYÉS',
        content: `La rémunération est calculée selon le nombre d'heures réelles pointées au taux de ${(input.hourlyRateEur || 15).toFixed(2)} € brut / heure, augmentée d'une indemnité compensatrice de congés payés de 10% versée en fin de mission.`
      }
    ];

    const fullText = sections.map(s => `${s.articleNumber} — ${s.title}\n${s.content}`).join('\n\n');

    return {
      documentId: docId,
      type: 'EXTRA_CDDU_HCR',
      title: 'Contrat Extra CDDU (CCN HCR)',
      parties: {
        employerOrClient: `${input.restaurant.companyName} (SIRET: ${input.restaurant.siret})`,
        employeeOrContractor: input.collaborator.name
      },
      sections,
      fullText,
      generatedAt: Date.now()
    };
  }

  /**
   * 4. CONTRAT DE TRAVAIL CDD HCR
   */
  private static generateCddContract(input: ContractGenerationInput): GeneratedLegalDocument {
    const docId = `CDD-HCR-${Date.now().toString(36).toUpperCase()}`;

    const sections = [
      {
        articleNumber: 'ARTICLE 1',
        title: 'MOTIF DU RECOURS & DURÉE',
        content: `Le Salarié est engagé en Contrat de Travail à Durée Déterminée à compter du ${input.startDate} jusqu'au ${input.endDate || 'terme de la saison'}, en raison d'un surcroît temporaire d'activité conformément à la CCN HCR.`
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'FONCTION & HORAIRES',
        content: `Le Salarié occupera le poste de ${input.jobTitle} sur une base de ${input.weeklyHours || 35} heures hebdomadaires.`
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'INDEMNITÉS DE FIN DE CONTRAT',
        content: `À l'échéance du contrat, le Salarié percevra l'indemnité légale de fin de contrat (10%) ainsi que l'indemnité compensatrice de congés payés.`
      }
    ];

    const fullText = sections.map(s => `${s.articleNumber} — ${s.title}\n${s.content}`).join('\n\n');

    return {
      documentId: docId,
      type: 'CDD_HCR',
      title: 'Contrat de Travail à Durée Déterminée (CCN HCR)',
      parties: {
        employerOrClient: `${input.restaurant.companyName} (SIRET: ${input.restaurant.siret})`,
        employeeOrContractor: input.collaborator.name
      },
      sections,
      fullText,
      generatedAt: Date.now()
    };
  }
}
