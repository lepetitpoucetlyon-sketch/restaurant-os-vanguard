import { User } from '../domain/schemas/users';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export const URSSAF_CONSTANTS = {
  /** Seuil légal de vigilance obligatoire (Art. L.8222-1 et R.8222-1 du Code du travail) : 5 000 € */
  ANNUAL_THRESHOLD_EUR: 5000,
  ANNUAL_THRESHOLD_MU: 5_000_000_000, // 5 000 € en micro-unités
  CERTIFICATE_VALIDITY_MONTHS: 6, // Renouvellement semestriel obligatoire
} as const;

export class UrssafVigilanceError extends Error {
  constructor(message: string, public readonly details: {
    contractorId: string;
    annualTotalEur: number;
    thresholdEur: number;
    vigilanceStatus?: string;
  }) {
    super(message);
    this.name = 'UrssafVigilanceError';
  }
}

/**
 * 🏛️ UrssafVigilanceService — Restaurant OS
 * 
 * Contrôle légal de vigilance semestrielle pour les prestataires et sous-traitants (Art. L.8222-1 Code du travail).
 * Obligation de recueillir l'attestation de vigilance URSSAF semestrielle dès 5 000 € de chiffre d'affaires cumulé.
 */
export class UrssafVigilanceService {
  /**
   * Vérifie si l'attestation de vigilance du prestataire est valide à la date courante.
   */
  static isVigilanceValid(contractor: User, nowIso: string = new Date().toISOString()): boolean {
    const profile = contractor.contractorProfile;
    if (!profile) return false;

    if (profile.vigilanceStatus !== 'valid') return false;
    if (!profile.urssafVigilanceValidUntil) return false;

    const validUntil = new Date(profile.urssafVigilanceValidUntil).getTime();
    const now = new Date(nowIso).getTime();
    return !isNaN(validUntil) && validUntil >= now;
  }

  /**
   * Récupère le cumul de facturation annuel d'un prestataire auprès d'un tenant.
   */
  static async getContractorAnnualTotalMu(
    tenantId: string,
    contractorId: string,
    year: number = new Date().getFullYear()
  ): Promise<number> {
    const path = `tenants/${tenantId}/human/contractorAccumulators/${year}_${contractorId}`;
    const doc = await Nexus.adapter.get<{ totalHtInMicrounits: number }>(path);
    return doc?.totalHtInMicrounits ?? 0;
  }

  /**
   * Enregistre le montant d'une nouvelle facture dans le cumul annuel du prestataire.
   */
  static async recordInvoiceTotal(
    tenantId: string,
    contractorId: string,
    invoiceAmountMu: number,
    year: number = new Date().getFullYear()
  ): Promise<number> {
    const path = `tenants/${tenantId}/human/contractorAccumulators/${year}_${contractorId}`;
    
    let newTotal = invoiceAmountMu;
    await Nexus.adapter.runTransaction(async (tx) => {
      const existing = await tx.get<{ totalHtInMicrounits: number }>(path);
      newTotal = (existing?.totalHtInMicrounits ?? 0) + invoiceAmountMu;
      tx.set(path, {
        contractorId,
        year,
        totalHtInMicrounits: newTotal,
        updatedAt: new Date().toISOString(),
      });
    });

    return newTotal;
  }

  /**
   * Contrôle bloquant de conformité URSSAF avant émission de facture.
   * Si le cumul (existant + nouvelle facture) dépasse 5 000 € et que l'attestation est manquante ou expirée,
   * une exception bloquante `UrssafVigilanceError` est levée.
   */
  static async assertCompliance(
    tenantId: string,
    contractor: User,
    invoiceAmountMu: number,
    year: number = new Date().getFullYear()
  ): Promise<void> {
    const currentTotalMu = await this.getContractorAnnualTotalMu(tenantId, contractor.id, year);
    const projectedTotalMu = currentTotalMu + invoiceAmountMu;
    const projectedTotalEur = projectedTotalMu / 1_000_000;

    if (projectedTotalMu > URSSAF_CONSTANTS.ANNUAL_THRESHOLD_MU) {
      const isValid = this.isVigilanceValid(contractor);
      if (!isValid) {
        const reason = !contractor.contractorProfile?.urssafVigilanceCertificateUrl
          ? "Attestation de vigilance URSSAF manquante"
          : "Attestation de vigilance URSSAF expirée (renouvellement semestriel obligatoire)";

        logger.error(`[UrssafVigilanceService] Blocage facturation pour prestataire ${contractor.id} : ${reason} (Cumul projeté : ${projectedTotalEur} € > ${URSSAF_CONSTANTS.ANNUAL_THRESHOLD_EUR} €)`);
        
        throw new UrssafVigilanceError(
          `Émission de facture bloquée (Art. L.8222-1 Code du travail) : ${reason}. Cumul annuel : ${projectedTotalEur.toFixed(2)} € (seuil légal : 5 000 €).`,
          {
            contractorId: contractor.id,
            annualTotalEur: projectedTotalEur,
            thresholdEur: URSSAF_CONSTANTS.ANNUAL_THRESHOLD_EUR,
            vigilanceStatus: contractor.contractorProfile?.vigilanceStatus ?? 'missing',
          }
        );
      }
    }
  }
}
