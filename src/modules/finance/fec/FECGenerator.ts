
import { JournalEntry } from '@/shared/nexus/contracts/finance.types';
import { FECMapper } from './FECMapper';
import { FECExportResult, FECLine } from './types';
import { QuantumCrypto } from '@/lib/QuantumCrypto';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';

/**
 * 🏛️ FECGenerator - Grade X+++
 * Génération et scellage cryptographique NF525 des exports comptables.
 */
export class FECGenerator {
    /**
     * Génère un fichier FEC complet et le scelle
     */
    static async generate(entries: JournalEntry[], siren: string, yearMonth: string): Promise<FECExportResult> {
        // Filtrer uniquement les écritures validées
        const validatedEntries = entries.filter(e => e.status === 'validated');
        
        let previousHash = '';
        const fecLines: FECLine[] = [];

        // Trier par date d'écriture puis numéro de pièce
        validatedEntries.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA === dateB) return a.pieceNumber.localeCompare(b.pieceNumber);
            return dateA - dateB;
        });

        for (const entry of validatedEntries) {
            for (const line of entry.lines) {
                const partialFecLine = FECMapper.mapLine(entry, line);
                
                // Préparer les données pour le scellement
                const lineDataString = Object.values(partialFecLine).join('|');
                
                // Génération du Hash NF525 via signature Lattice
                const currentHash = await QuantumCrypto.sign(lineDataString, previousHash);
                
                const completeFecLine: FECLine = {
                    ...partialFecLine,
                    EcritureHash: currentHash
                };
                
                fecLines.push(completeFecLine);
                previousHash = currentHash; // Chainage cryptographique NF525
            }
        }

        // Construire le contenu du fichier
        const headers = [
            'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate', 'CompteNum', 'CompteLib',
            'CompAuxNum', 'CompAuxLib', 'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
            'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise', 'EcritureHash'
        ];

        const rows = fecLines.map(line => headers.map(h => line[h as keyof FECLine]).join('|'));
        const content = [headers.join('|'), ...rows].join('\r\n') + '\r\n';

        const filename = `FEC_${siren}_${yearMonth}.txt`;

        const result = {
            content,
            filename,
            lineCount: fecLines.length,
            finalHash: previousHash
        };
        NexusTelemetryService.emitAuditPulse('FINANCE', 'FEC_GENERATION_SUCCESS', { siren, yearMonth, lineCount: fecLines.length });
        return result;
    }
}
