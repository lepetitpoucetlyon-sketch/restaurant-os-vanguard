import { JournalEntry } from '@/types';

/**
 * 📊 FECExporter (Fichier des Écritures Comptables)
 * Conformité Art. L.47 A-I du LPF (France)
 */
export class FECExporter {
    /**
     * Exporte le journal au format FEC (Tab-separated .txt)
     */
    static exportToFEC(entries: JournalEntry[]): string {
        const headers = [
            'JournalCode',      // Code journal de l'écriture comptable
            'JournalLib',       // Libellé journal de l'écriture comptable
            'EcritureNum',      // Numéro sur une séquence ininterrompue de l'écriture comptable
            'EcritureDate',     // Date de comptabilisation de l'écriture comptable
            'CompteNum',        // Numéro de compte
            'CompteLib',        // Libellé de compte
            'CompteAuxNum',     // Numéro de compte auxiliaire (vide si non utilisé)
            'CompteAuxLib',     // Libellé de compte auxiliaire (vide si non utilisé)
            'PieceRef',         // Référence de la pièce justificative
            'PieceDate',        // Date de la pièce justificative
            'EcritureLib',      // Libellé de l'écriture comptable
            'Debit',            // Montant débit
            'Credit',           // Montant crédit
            'EcritureLet',      // Lettrage de l'écriture comptable
            'DateLet',          // Date de lettrage
            'ValidDate',        // Date de validation de l'écriture comptable
            'Montantdevise',    // Montant en devise
            'Idevise'           // Identifiant de la devise
        ];

        const rows = entries.flatMap(entry => 
            entry.lines.map(line => {
                const isDebit = line.side === 'debit';
                const debit = isDebit ? (line.amountInCents / 100).toFixed(2).replace('.', ',') : '0,00';
                const credit = !isDebit ? (line.amountInCents / 100).toFixed(2).replace('.', ',') : '0,00';
                
                return [
                    'GEN', // Default General Journal
                    'Journal Général',
                    entry.pieceNumber,
                    (entry.date instanceof Date ? entry.date.toISOString() : (entry.date as string)).split('T')[0].replace(/-/g, ''), // YYYYMMDD
                    line.accountCode || line.accountId,
                    line.accountName,
                    '', // CompteAuxNum
                    '', // CompteAuxLib
                    entry.pieceNumber,
                    (entry.date instanceof Date ? entry.date.toISOString() : (entry.date as string)).split('T')[0].replace(/-/g, ''),
                    line.description || entry.description,
                    debit,
                    credit,
                    '', // Lettrage
                    '', // Date Lettrage
                    (entry.date instanceof Date ? entry.date.toISOString() : (entry.date as string)).split('T')[0].replace(/-/g, ''),
                    '', // Montant devise
                    'EUR'
                ].join('\t');
            })
        );

        return [headers.join('\t'), ...rows].join('\n');
    }

    /**
     * Déclenche le téléchargement du fichier FEC dans le navigateur
     */
    static downloadFEC(entries: JournalEntry[], fileName?: string) {
        const content = this.exportToFEC(entries);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const defaultName = `FEC_${timestamp}.txt`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', fileName || defaultName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
