import { JournalEntry } from '@nexus/contracts';
import { format } from 'date-fns';

/**
 * FECGenerator - Generates the "Fichier des Écritures Comptables" 
 * Standard fiscal export for French Tax Authorities (DGFIP).
 */
export class FECGenerator {
    
    /**
     * Converts a collection of Journal Entries into a standardized FEC TXT file (Tab-separated).
     */
    static generate(entries: JournalEntry[]): string {
        // FEC Headers (Standard DGFIP)
        const headers = [
            'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
            'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
            'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
            'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise'
        ];

        const lines = [headers.join('\t')];

        entries.forEach((entry, index) => {
            const ecritureNum = entry.pieceNumber || `E-${index + 1}`;
            const ecritureDate = format(new Date(entry.date), 'yyyyMMdd');
            const pieceDate = ecritureDate;

            // Flatten lines into FEC rows
            entry.lines.forEach(line => {
                const debit = line.side === 'debit' ? (line.amountInCents / 100).toFixed(2).replace('.', ',') : '0,00';
                const credit = line.side === 'credit' ? (line.amountInCents / 100).toFixed(2).replace('.', ',') : '0,00';

                lines.push([
                    'BQ', 'Journal de Banque', ecritureNum, ecritureDate,
                    line.accountCode, line.accountName, '', '',
                    entry.pieceNumber, pieceDate, entry.description || 'Opération',
                    debit, credit,
                    '', '', ecritureDate, '', ''
                ].join('\t'));
            });
        });

        return lines.join('\r\n');
    }

    /**
     * Triggers a browser download of the FEC file.
     */
    static downloadFEC(entries: JournalEntry[], year: number) {
        const content = this.generate(entries);
        const filename = `FEC_${year}_RESTAURANT_OS.txt`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
}
