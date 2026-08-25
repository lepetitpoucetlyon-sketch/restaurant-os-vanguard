import { JournalEntry, BankTransaction } from '@nexus/contracts';
import { logger } from '@/lib/axiom';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface MatchingResult {
    transactionId: string;
    suggestedEntryId?: string;
    score: number; // 0 to 100
    confidence: 'low' | 'medium' | 'high' | 'perfect';
    reasons: string[];
}

/**
 * AccountingMatchingService - The "Pennylane" Reconciliation Engine (DF-N1)
 * Specialized in correlating bank flows with internal fiscal truth.
 */
export class AccountingMatchingService {
    
    // Configurable thresholds
    private static THRESHOLD_HIGH = 90;
    private static THRESHOLD_MEDIUM = 70;
    
    static getAutoReconcileScore(): number {
        return getSetting<number>('finance', 'auto_reconcile_score', 98);
    }

    /**
     * Matches a single bank transaction against a pool of journal entries.
     */
    static matchTransaction(
        transaction: BankTransaction, 
        entries: JournalEntry[]
    ): MatchingResult {
        let bestMatch: JournalEntry | null = null;
        let bestScore = 0;
        let bestReasons: string[] = [];

        for (const entry of entries) {
            const { score, reasons } = this.calculateScore(transaction, entry);
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = entry;
                bestReasons = reasons;
            }
        }

        return {
            transactionId: transaction.id,
            suggestedEntryId: bestMatch?.id,
            score: bestScore,
            confidence: this.getConfidenceLevel(bestScore),
            reasons: bestReasons
        };
    }

    /**
     * Scoring Algorithm - Multi-Factor Analysis
     */
    private static calculateScore(
        tx: BankTransaction, 
        entry: JournalEntry
    ): { score: number; reasons: string[] } {
        let score = 0;
        const reasons: string[] = [];

        // 1. AMOUNT MATCH (Highest Weight - 60pts)
        const journalTotal = entry.lines.reduce((acc, l) => acc + (l.side === 'debit' ? l.amountInCents : 0), 0);
        
        if (tx.amountInCents === journalTotal) {
            score += 60;
            reasons.push('Montant identique au centime près');
        } else if (Math.abs(tx.amountInCents - journalTotal) < 10) {
            // Dealing with small cent differences (écart < 10 centimes)
            score += 55;
            reasons.push('Montant quasi-identique (écart < 10cts)');
        }

        // 2. DATE MATCH (25pts)
        const txDate = new Date(tx.date).getTime();
        const entryDate = new Date(entry.date).getTime();
        const diffDays = Math.abs(txDate - entryDate) / (1000 * 60 * 60 * 24);

        if (diffDays === 0) {
            score += 25;
            reasons.push('Date parfaitement identique');
        } else if (diffDays <= 3) {
            score += 15;
            reasons.push(`Proximité temporelle (écart: ${Math.round(diffDays)} jours)`);
        } else if (diffDays <= 7) {
            score += 5;
            reasons.push('Fenêtre hebdomadaire cohérente');
        }

        // 3. LABEL MATCH (15pts)
        const label = tx.label.toLowerCase();
        const entryDesc = entry.description.toLowerCase();
        
        // Simple fuzzy matching via keywords
        const keywords = ['table', 'vente', 'vte', 'order', 'ndf', 'frais', 'facture', 'inv'];
        const matchedKeywords = keywords.filter(k => label.includes(k) && entryDesc.includes(k));

        if (matchedKeywords.length > 0) {
            score += 10;
            reasons.push(`Mots-clés communs détectés: ${matchedKeywords.join(', ')}`);
        }

        if (label.includes(entry.pieceNumber.toLowerCase())) {
            score += 15; // Bonus for reference match
            reasons.push(`Référence de pièce trouvée dans le libellé: ${entry.pieceNumber}`);
        }

        // Final score capping
        return { score: Math.min(score, 100), reasons };
    }

    private static getConfidenceLevel(score: number): 'low' | 'medium' | 'high' | 'perfect' {
        if (score >= this.getAutoReconcileScore()) return 'perfect';
        if (score >= this.THRESHOLD_HIGH) return 'high';
        if (score >= this.THRESHOLD_MEDIUM) return 'medium';
        return 'low';
    }

    /**
     * Batch Processor
     */
    static batchMatch(
        transactions: BankTransaction[], 
        entries: JournalEntry[]
    ): MatchingResult[] {
        logger.info('AccountingMatchingService: Batch processing', { 
            txCount: transactions.length, 
            entryCount: entries.length 
        });
        return transactions.map(tx => this.matchTransaction(tx, entries));
    }
}
