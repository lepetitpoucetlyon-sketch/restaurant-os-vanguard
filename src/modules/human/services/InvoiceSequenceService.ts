import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * 🔢 InvoiceSequenceService — Restaurant OS (Human / Freelance)
 * 
 * Gestionnaire de séquence de numérotation pour l'auto-facturation des prestataires.
 * Garantit l'absence de trous et de doublons dans la séquence légale (Art. 242 nonies CGI / NF525).
 * Format canonique : FAC-AUTO-YYYYMM-NNNN (reset mensuel strict).
 */
export class InvoiceSequenceService {
  /**
   * Obtient et incrémente atomiquement le numéro de facture pour un mois et un tenant donnés.
   * 
   * @param tenantId Identifiant du tenant (restaurant donneur d'ordre)
   * @param periodMonth Mois au format "YYYY-MM"
   * @returns Numéro formaté "FAC-AUTO-YYYYMM-0001"
   */
  static async next(tenantId: string, periodMonth: string): Promise<string> {
    const monthKey = periodMonth.replace('-', '');
    const counterPath = `tenants/${tenantId}/human/invoiceCounters/${monthKey}`;
    
    let sequenceNumber = 1;
    await Nexus.adapter.runTransaction(async (tx) => {
      const existing = await tx.get<{ sequence: number; updatedAt: string }>(counterPath);
      sequenceNumber = (existing?.sequence ?? 0) + 1;
      
      tx.set(counterPath, {
        sequence: sequenceNumber,
        periodMonth,
        updatedAt: new Date().toISOString(),
      });
    });

    const formatted = `FAC-AUTO-${monthKey}-${String(sequenceNumber).padStart(4, '0')}`;
    logger.info(`[InvoiceSequenceService] Séquence incrémentée pour ${tenantId} (${periodMonth}) : ${formatted}`);
    return formatted;
  }

  /**
   * Consulte la valeur courante du compteur sans incrémentation (lecture seule).
   */
  static async current(tenantId: string, periodMonth: string): Promise<number> {
    const monthKey = periodMonth.replace('-', '');
    const counterPath = `tenants/${tenantId}/human/invoiceCounters/${monthKey}`;
    const doc = await Nexus.adapter.get<{ sequence: number }>(counterPath);
    return doc?.sequence ?? 0;
  }
}
