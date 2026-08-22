/**
 * D4 — Exports comptables Sage, Cegid, EBP.
 *
 * Les TPE/PME utilisent des logiciels comptables tiers (Sage 50/100,
 * Cegid Expert, EBP Compta) qui ont chacun leur format d'import :
 *   - Sage : CSV avec colonnes spécifiques (JournalCode, Compte, Débit, Crédit)
 *   - Cegid : format XML ou CSV propriétaire
 *   - EBP : CSV avec séparateur point-virgule
 *
 * Sans ces exports, l'expert-comptable doit ressaisir manuellement les
 * écritures POS → perte de temps, erreurs de ressaisie, charges honoraires.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § D4.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AuditLogger } from '@/lib/audit';

export type AccountingSoftware = 'sage' | 'cegid' | 'ebp' | 'csv_generic';

export interface JournalEntryForExport {
  journalCode: string;
  ecritureDate: string;
  compteNum: string;
  compteLib: string;
  ecritureLib: string;
  debitInMicrounits: number;
  creditInMicrounits: number;
  pieceRef?: string;
  ecritureHash: string;
}

export interface AccountingExportResult {
  software: AccountingSoftware;
  content: string;
  lineCount: number;
  periodLabel: string;
  generatedAt: number;
  filename: string;
}

function microunitsToDecimal(mu: number): string {
  return (mu / 1_000_000).toFixed(2);
}

export class AccountingExportService {
  static formatSage(entries: JournalEntryForExport[], periodLabel: string): string {
    const header = 'JournalCode;EcritureDate;CompteNum;CompteLib;EcritureLib;Debit;Credit;PieceRef\r\n';
    const rows = entries.map(e =>
      [
        e.journalCode,
        e.ecritureDate.replace(/-/g, ''),
        e.compteNum,
        `"${e.compteLib}"`,
        `"${e.ecritureLib}"`,
        microunitsToDecimal(e.debitInMicrounits),
        microunitsToDecimal(e.creditInMicrounits),
        e.pieceRef ?? '',
      ].join(';'),
    );
    return header + rows.join('\r\n') + '\r\n';
  }

  static formatCegid(entries: JournalEntryForExport[], periodLabel: string): string {
    const header = 'CODE_JOURNAL|DATE|COMPTE|LIBELLE_COMPTE|LIBELLE|DEBIT|CREDIT|REFERENCE\r\n';
    const rows = entries.map(e =>
      [
        e.journalCode,
        e.ecritureDate.replace(/-/g, ''),
        e.compteNum,
        e.compteLib,
        e.ecritureLib,
        microunitsToDecimal(e.debitInMicrounits),
        microunitsToDecimal(e.creditInMicrounits),
        e.pieceRef ?? '',
      ].join('|'),
    );
    return header + rows.join('\r\n') + '\r\n';
  }

  static formatEBP(entries: JournalEntryForExport[], periodLabel: string): string {
    const header = '"Journal";"Date";"Compte";"Libelle";"Debit";"Credit";"Reference"\r\n';
    const rows = entries.map(e =>
      [
        `"${e.journalCode}"`,
        `"${e.ecritureDate}"`,
        `"${e.compteNum}"`,
        `"${e.ecritureLib}"`,
        `"${microunitsToDecimal(e.debitInMicrounits)}"`,
        `"${microunitsToDecimal(e.creditInMicrounits)}"`,
        `"${e.pieceRef ?? ''}"`,
      ].join(';'),
    );
    return header + rows.join('\r\n') + '\r\n';
  }

  static formatGenericCSV(entries: JournalEntryForExport[]): string {
    const header = 'JournalCode,EcritureDate,CompteNum,CompteLib,EcritureLib,Debit,Credit,PieceRef,EcritureHash\n';
    const rows = entries.map(e =>
      [
        e.journalCode, e.ecritureDate, e.compteNum,
        `"${e.compteLib}"`, `"${e.ecritureLib}"`,
        microunitsToDecimal(e.debitInMicrounits),
        microunitsToDecimal(e.creditInMicrounits),
        e.pieceRef ?? '', e.ecritureHash,
      ].join(','),
    );
    return header + rows.join('\n') + '\n';
  }

  static async export(input: {
    tenantId: string;
    software: AccountingSoftware;
    periodLabel: string;
    requestedBy: string;
    now?: number;
  }): Promise<AccountingExportResult> {
    const now = input.now ?? Date.now();

    const entries = await Nexus.adapter.query<JournalEntryForExport>(
      `tenants/${input.tenantId}/journal_entries`,
    );

    let content: string;
    let ext: string;
    switch (input.software) {
      case 'sage':   content = this.formatSage(entries, input.periodLabel);    ext = 'csv'; break;
      case 'cegid':  content = this.formatCegid(entries, input.periodLabel);   ext = 'txt'; break;
      case 'ebp':    content = this.formatEBP(entries, input.periodLabel);     ext = 'csv'; break;
      default:       content = this.formatGenericCSV(entries);                 ext = 'csv'; break;
    }

    const filename = `${input.tenantId}_${input.software}_${input.periodLabel}.${ext}`;

    await AuditLogger.logAction(
      input.requestedBy,
      'FEC_EXPORTED',
      `${input.tenantId}_${input.periodLabel}`,
      { software: input.software, lineCount: entries.length, filename },
    ).catch(() => null);

    return {
      software: input.software,
      content,
      lineCount: entries.length,
      periodLabel: input.periodLabel,
      generatedAt: now,
      filename,
    };
  }
}
