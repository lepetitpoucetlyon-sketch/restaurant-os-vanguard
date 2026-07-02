
import { SovereignMath } from '@/shared/services/SovereignMath';
import { JournalEntry, JournalLine } from '@/shared/nexus/contracts/finance.types';
import { FECLine } from './types';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';

/**
 * 🏛️ FECMapper - Grade X+++
 * Mappe les écritures comptables souveraines vers le format DGFiP
 */
export class FECMapper {
    /**
     * Map une ligne de journal en ligne FEC (sans le EcritureHash final)
     */
    static mapLine(entry: JournalEntry, line: JournalLine): Omit<FECLine, 'EcritureHash'> {
        const debitCents = line.debitInCents ?? 0;
        const creditCents = line.creditInCents ?? 0;

        const debitStr = debitCents > 0 ? SovereignMath.fromMicrounits(SovereignMath.fromCents(debitCents)).toFixed(2) : '';
        const creditStr = creditCents > 0 ? SovereignMath.fromMicrounits(SovereignMath.fromCents(creditCents)).toFixed(2) : '';
        NexusTelemetryService.emitAuditPulse('FINANCE', 'FEC_LINE_MAPPED', { pieceNumber: entry.pieceNumber });

        return {
            JournalCode: this.getJournalCode(entry.type || 'other'),
            JournalLib: this.getJournalLib(entry.type || 'other'),
            EcritureNum: entry.pieceNumber,
            EcritureDate: this.formatDate(entry.date),
            CompteNum: line.accountCode,
            CompteLib: line.accountName,
            CompAuxNum: '', 
            CompAuxLib: '',
            PieceRef: entry.pieceNumber,
            PieceDate: this.formatDate(entry.date),
            EcritureLib: line.description || entry.description,
            Debit: debitStr,
            Credit: creditStr,
            EcritureLet: '',
            DateLet: '',
            ValidDate: entry.sealedAt ? this.formatDate(entry.sealedAt) : this.formatDate(entry.date),
            Montantdevise: '',
            Idevise: 'EUR'
        };
    }

    private static getJournalCode(type: string): string {
        switch (type) {
            case 'revenue': case 'sales': return 'VTE';
            case 'expense': case 'purchases': return 'ACH';
            case 'bank': return 'BNQ';
            case 'payroll': return 'SAL';
            case 'tax': return 'OD';
            default: return 'OD';
        }
    }

    private static getJournalLib(type: string): string {
        switch (type) {
            case 'revenue': case 'sales': return 'Ventes';
            case 'expense': case 'purchases': return 'Achats';
            case 'bank': return 'Banque';
            case 'payroll': return 'Salaires';
            case 'tax': return 'Opérations Diverses';
            default: return 'Opérations Diverses';
        }
    }

    private static formatDate(dateInput: string | Date | number): string {
        if (!dateInput) return '';
        const date = (typeof dateInput === 'string' || typeof dateInput === 'number') 
            ? new Date(dateInput) 
            : dateInput;
        const yyyy = date.getFullYear().toString();
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
    }
}
