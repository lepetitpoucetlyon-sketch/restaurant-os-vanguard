import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { CryptoService } from '@/lib/CryptoService';
import { FiscalSealer } from '../fiscalite/FiscalSealer';

export interface LegacyEntryInput {
  externalId: string;
  date: string; // ISO ou YYYY-MM-DD
  amountInMicrounits: number;
  taxBreakdown?: Record<string, number>;
  description?: string;
  paymentMode?: string;
}

export interface LegacyImportParams {
  tenantId: string;
  cutoverDate: string; // YYYY-MM-DD (Date de bascule sur Restaurant OS)
  sourceSoftware: 'lightspeed' | 'zettle' | 'zelty' | 'tiller' | 'custom_csv' | string;
  entries: LegacyEntryInput[];
  openingBalanceInMicrounits?: number;
  importedBy: string;
}

export interface LegacyImportResult {
  batchId: string;
  tenantId: string;
  importedCount: number;
  totalRevenueInMicrounits: number;
  openingEntryId: string;
  openingSealId?: string;
  cutoverDate: string;
}

export class LegacyImportService {
  /**
   * Importe un historique comptable/fiscal antérieur à la date de bascule (Lot 7 - M8).
   * 
   * Invariants NF525 :
   * 1. Les écritures antérieures sont archivées de manière immuable dans `legacyArchive/` (WORM).
   * 2. Elles N'ENTRENT JAMAIS dans la chaîne de hachage active du `fiscalLedger` courant.
   * 3. Un "À-Nouveau" (Opening Entry) scellé est forgé à la date de cutover pour assurer
   *    la balance comptable sans altérer les tickets passés.
   */
  public static async importLegacyLedger(
    params: LegacyImportParams
  ): Promise<LegacyImportResult> {
    const {
      tenantId,
      cutoverDate,
      sourceSoftware,
      entries,
      openingBalanceInMicrounits = 0,
      importedBy,
    } = params;

    const batchId = `legacy_batch_${Date.now()}`;
    const batch = Nexus.adapter.batch();

    let totalRevenueInMicrounits = 0;
    let importedCount = 0;

    for (const entry of entries) {
      // Vérifier que l'écriture est bien antérieure ou égale à la date de cutover
      const entryDate = entry.date.split('T')[0];
      if (entryDate > cutoverDate) {
        throw new Error(
          `[LegacyImportService] L'écriture ${entry.externalId} est datée du ${entryDate}, soit après la date de bascule (${cutoverDate}). Rejetée pour préserver l'intégrité NF525.`
        );
      }

      const archiveId = `leg_${sourceSoftware}_${entry.externalId}`;
      const path = `tenants/${tenantId}/legacyArchive/${archiveId}`;

      batch.set(path, {
        id: archiveId,
        tenantId,
        batchId,
        sourceSoftware,
        externalId: entry.externalId,
        date: entry.date,
        amountInMicrounits: entry.amountInMicrounits,
        taxBreakdown: entry.taxBreakdown ?? {},
        description: entry.description ?? `Import historique ${sourceSoftware}`,
        paymentMode: entry.paymentMode ?? 'unknown',
        origin: 'legacy_import',
        importedAt: new Date().toISOString(),
        importedBy,
      });

      totalRevenueInMicrounits += entry.amountInMicrounits;
      importedCount++;
    }

    await batch.commit();

    // Génération du Bilan d'Ouverture ("À-Nouveau") scellé à la date de bascule
    const openingEntryId = `JE_OPENING_${cutoverDate.replace(/-/g, '')}`;
    const calculatedOpeningBalance = openingBalanceInMicrounits || totalRevenueInMicrounits;

    const journalEntryBase = {
      id: openingEntryId,
      date: cutoverDate,
      pieceNumber: `OUV-${cutoverDate.replace(/-/g, '')}`,
      description: `Bilan d'Ouverture / Reprise d'antériorité (${sourceSoftware}) — ${importedCount} écritures antérieures`,
      lines: [
        {
          accountCode: '89000000', // Bilan d'ouverture
          debitInMicrounits: 0,
          creditInMicrounits: calculatedOpeningBalance,
          description: `Reprise solde initial ${sourceSoftware}`,
        },
        {
          accountCode: '51200000', // Banque / Trésorerie d'ouverture
          debitInMicrounits: calculatedOpeningBalance,
          creditInMicrounits: 0,
          description: `Solde trésorerie initial ${sourceSoftware}`,
        },
      ],
      referenceType: 'opening_balance' as const,
      isSystemGenerated: true,
      isValidated: true,
      type: 'opening' as const,
      totalInMicrounits: calculatedOpeningBalance,
      status: 'validated' as const,
      updatedAt: new Date().toISOString(),
    };

    const snapshot = CryptoService.canonicalStringify({
      id: openingEntryId,
      cutoverDate,
      calculatedOpeningBalance,
      sourceSoftware,
      importedCount,
    });

    const seal = await FiscalSealer.sealDataAtomically(
      snapshot,
      tenantId,
      false,
      journalEntryBase
    );

    empireAudit.log({
      module: 'accounting',
      action: 'LEGACY_LEDGER_IMPORTED',
      details: {
        batchId,
        sourceSoftware,
        cutoverDate,
        importedCount,
        totalRevenueInMicrounits,
        openingEntryId,
        sealId: seal.sealId,
        importedBy,
      },
      severity: 'medium',
      timestamp: new Date(),
    });

    logger.info(
      `[LegacyImportService] Import de ${importedCount} écritures d'antériorité (${sourceSoftware}) scellé avec À-Nouveau ${openingEntryId}`
    );

    return {
      batchId,
      tenantId,
      importedCount,
      totalRevenueInMicrounits,
      openingEntryId,
      openingSealId: seal.sealId,
      cutoverDate,
    };
  }
}
