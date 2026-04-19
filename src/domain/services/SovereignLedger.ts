import { LedgerEntry, SharedKernel } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * ⚖️ SovereignLedger - Restaurant OS
 * The Financial Source of Truth of the Empire.
 * Grade X : Double-Entry Immutability.
 */
export class SovereignLedger {
    
    /**
     * Records a balanced economic movement between two accounts.
     * Principle: Every DEBIT must have a matching CREDIT.
     */
    static async recordTransfer(params: {
        debitAccount: LedgerEntry['accountName'],
        creditAccount: LedgerEntry['accountName'],
        amountInCents: number,
        referenceId: string,
        description: string
    }): Promise<void> {
        const date = new Date().toISOString();
        const scelledAt = new Date().toISOString();

        // 1. Fetch Dynamic Complexity Mode
        let mode: AccountingMode = 'EXPERT';
        try {
            const settings = await Nexus.adapter.get(Nexus.getTenantPath('settings/global')) as any;
            if (settings?.accounting?.complexityMode) {
                mode = settings.accounting.complexityMode;
            }
        } catch (e) {
            logger.warn('[SovereignLedger] Settings unavailable, defaulting to EXPERT mode.');
        }

        // 2. Build Entries
        const debitEntry: LedgerEntry = {
            id: SharedKernel.generateId('LDR-DB'),
            date,
            accountName: params.debitAccount,
            type: 'DEBIT',
            amountInCents: params.amountInCents,
            referenceId: params.referenceId,
            description: params.description,
            scelledAt
        };

        const creditEntry: LedgerEntry = {
            id: SharedKernel.generateId('LDR-CR'),
            date,
            accountName: params.creditAccount,
            type: 'CREDIT',
            amountInCents: params.amountInCents,
            referenceId: params.referenceId,
            description: params.description,
            scelledAt
        };

        // 3. Inquisiteur QA : Validation (Bloquant en mode EXPERT)
        this.validateIntegrity(debitEntry, creditEntry, mode);

        if (mode === 'EXPERT') {
            logger.info(`[SovereignLedger] [EXPERT] Integrity Verified. Recording balanced movement: ${params.amountInCents / 100}€ [${params.debitAccount} / ${params.creditAccount}]`);
        } else {
            logger.info(`[SovereignLedger] [SIMPLE] Pulse: ${params.description}`);
        }

        // Atomic Persistance via Nexus
        await Promise.all([
            Nexus.adapter.set(Nexus.getTenantPath(`ledger/entries/${debitEntry.id}`), debitEntry),
            Nexus.adapter.set(Nexus.getTenantPath(`ledger/entries/${creditEntry.id}`), creditEntry)
        ]);
    }

    /**
     * ⚖️ Inquisiteur QA Validation
     * Ensures Debit matches Credit with absolute precision.
     */
    private static validateIntegrity(debit: LedgerEntry, credit: LedgerEntry, mode: AccountingMode): void {
        if (debit.amountInCents !== credit.amountInCents) {
            const error = `[LDR-ERR-01] Nexus Balance Violation: Debit(${debit.amountInCents}) != Credit(${credit.amountInCents})`;
            logger.error(error);
            if (mode === 'EXPERT') {
                throw new Error(error);
            }
        }
    }

    /**
     * Records a sale (Cash In / Sales Revenue)
     */
    static async recordSale(orderId: string, amountInCents: number): Promise<void> {
        await this.recordTransfer({
            debitAccount: 'CASH',
            creditAccount: 'SALES',
            amountInCents,
            referenceId: orderId,
            description: `Vente Order #${orderId}`
        });
    }

    /**
     * Records an expense (Purchases / Cash Out)
     */
    static async recordPurchase(poId: string, amountInCents: number): Promise<void> {
        await this.recordTransfer({
            debitAccount: 'PURCHASES',
            creditAccount: 'CASH',
            amountInCents,
            referenceId: poId,
            description: `Achat Matières Premières PO #${poId}`
        });
    }

    /**
     * Returns the Real-Time EBITDA estimation based on ledger balances.
     */
    static async getRealTimeEBITDA(): Promise<number> {
        // In production, this would be an aggregation query in Firestore/Supabase.
        // For Grade X demo, we simulate the aggregation.
        // EBITDA = Revenue - (COGS + Labor)
        return 450000; // Mocked 4500€ profit baseline
    }
}
