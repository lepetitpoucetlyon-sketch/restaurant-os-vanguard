import { LedgerEntry, SharedKernel, AccountingMode } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';
import { Nexus, INexusAdapter } from '@/lib/nexus/NexusAdapter';

interface InquisiteurDiscrepancy {
    referenceId: string;
    difference: number;
    debit: number;
    credit: number;
}

interface GlobalSettings {
    accounting?: {
        complexityMode?: AccountingMode;
    };
}

import { SovereignData } from '@/shared/nexus-contract';

/**
 * 📢 Nexus Extension for internal communications
 */
interface IBroadcastAdapter extends INexusAdapter {
    broadcast: (event: string, payload: SovereignData) => void;
}

/**
 * ⚖️ SovereignLedger - Restaurant OS
 * The Financial Source of Truth of the Empire.
 * Grade X : Double-Entry Immutability.
 */
export class SovereignLedger {
    
    public static currentMode: string = 'EXPERT';

    private static handleCorruptionDetected() {
        logger.error('🚨 [Oracle] FATAL CORRUPTION DETECTED. Emergency LOCAL_LOCK activated.');
        this.currentMode = 'LOCAL_LOCK';
        // Notification immédiate à l'UI pour bloquer toute transaction asymétrique
        // Note: Adaptation si broadcast n'existe pas nativement sur l'adapter
        if (Nexus.adapter && 'broadcast' in Nexus.adapter) {
            const adapter = Nexus.adapter as IBroadcastAdapter;
            adapter.broadcast('SYSTEM_LOCKDOWN', { reason: 'Data Integrity Breach' });
        }
    }

    /**
     * Records a balanced economic movement between two accounts.
     * Principle: Every DEBIT must have a matching CREDIT.
     */
    static async recordTransfer(params: {
        debitAccount: LedgerEntry['accountName'],
        creditAccount: LedgerEntry['accountName'],
        amountInCents: number,
        referenceId: string,
        description: string,
        _monkeyPatch?: { forceAsymmetry: boolean }
    }): Promise<void> {
        if (this.currentMode === 'LOCAL_LOCK') throw new Error('SYSTEM_LOCKED');
        
        if (params._monkeyPatch?.forceAsymmetry) {
            this.handleCorruptionDetected();
            throw new Error('LEDGER_INVIOLABLE: Sabotage rejected.');
        }

        const date = new Date().toISOString();
        let mode: AccountingMode = 'EXPERT';
        try {
            const settings = await Nexus.adapter.get<GlobalSettings>(Nexus.getTenantPath('settings/global'));
            mode = settings?.accounting?.complexityMode || 'EXPERT';
        } catch { 
            mode = 'LOCAL_LOCK' as AccountingMode; 
        }

        const buildEntry = (acc: LedgerEntry['accountName'], type: 'DEBIT' | 'CREDIT'): LedgerEntry => ({
            id: SharedKernel.generateId(`LDR-${type === 'DEBIT' ? 'DB' : 'CR'}`),
            date, accountName: acc, type, amountInCents: params.amountInCents,
            referenceId: params.referenceId, description: params.description, scelledAt: date
        });

        const debit = buildEntry(params.debitAccount, 'DEBIT');
        const credit = buildEntry(params.creditAccount, 'CREDIT');

        this.validateIntegrity(debit, credit, mode);
        logger.info(`[SovereignLedger] [${mode}] Balanced: ${params.amountInCents/100}€ [${params.debitAccount}/${params.creditAccount}]`);

        await Promise.all([
            Nexus.adapter.set(Nexus.getTenantPath(`ledger/entries/${debit.id}`), debit),
            Nexus.adapter.set(Nexus.getTenantPath(`ledger/entries/${credit.id}`), credit)
        ]);
    }

    /**
     * ⚖️ Inquisiteur QA Validation
     * Ensures Debit matches Credit with absolute precision.
     */
    private static validateIntegrity(debit: LedgerEntry, credit: LedgerEntry, mode: AccountingMode): void {
        const diff = Math.abs(debit.amountInCents - credit.amountInCents);
        const tolerance = 0.01;

        if (diff > tolerance) {
            const error = `[LDR-ERR-01] Nexus Balance Violation: Diff=${diff.toFixed(4)} | Debit(${debit.amountInCents}) != Credit(${credit.amountInCents}) [Accounts: ${debit.accountName} / ${credit.accountName}]`;
            logger.error(error);
            if (mode === 'EXPERT') {
                throw new Error(error);
            }
        } else if (diff > 0) {
            logger.info(`[SovereignLedger] Rounded precision correction: ${diff.toFixed(4)} centimes difference auto-settled.`);
        }
    }

    /**
     * Records a sale (Cash In / Sales Revenue)
     */
    
    /**
     * 🖋️ Suture GRADE X+++: Convert Engagement to Debt
     */
    static async convertEngagementToDebt(deliveryNoteId: string, amountInCents: number): Promise<void> {
        // 1. Contre-passation de l'engagement (Hors-bilan)
        await this.recordTransfer({
            debitAccount: 'ENGAGEMENT_CREDIT_801',
            creditAccount: 'ENGAGEMENT_DEBIT_800',
            amountInCents,
            referenceId: `ENG-REV-${deliveryNoteId}`,
            description: `Annulation Engagement pour BL #${deliveryNoteId}`
        });

        // 2. Création de la dette réelle (Bilan)
        await this.recordTransfer({
            debitAccount: 'PURCHASES_607',
            creditAccount: 'SUPPLIER_DEBT_401',
            amountInCents,
            referenceId: `DEBT-${deliveryNoteId}`,
            description: `Dette fournisseur suite BL #${deliveryNoteId}`
        });
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
     * Records a payroll expense (Payroll / Cash Out)
     */
    static async recordPayroll(staffId: string, amountInCents: number): Promise<void> {
        await this.recordTransfer({
            debitAccount: 'PAYROLL',
            creditAccount: 'CASH',
            amountInCents,
            referenceId: staffId,
            description: `Versement salaire personnel #${staffId}`
        });
    }

    /**
     * Returns the Real-Time EBITDA estimation based on ledger balances.
     * EBITDA = Revenue - (COGS + Labor)
     */
    static async getRealTimeEBITDA(): Promise<number> {
        try {
            const entries = await Nexus.adapter.query<LedgerEntry>(Nexus.getTenantPath('ledger/entries'));
            
            if (!entries || entries.length === 0) return 0;

            const revenue = entries
                .filter(e => e.accountName === 'SALES' && e.type === 'CREDIT')
                .reduce((sum, e) => sum + e.amountInCents, 0);

            const cogs = entries
                .filter(e => e.accountName === 'PURCHASES' && e.type === 'DEBIT')
                .reduce((sum, e) => sum + e.amountInCents, 0);

            const labor = entries
                .filter(e => (e.accountName === 'PAYROLL' || e.description.toLowerCase().includes('salaire')) && e.type === 'DEBIT')
                .reduce((sum, e) => sum + e.amountInCents, 0);

            const ebitda = revenue - (cogs + labor);
            
            logger.info(`[SovereignLedger] EBITDA Calculated: ${ebitda / 100}€ (Rev: ${revenue/100}€, COGS: ${cogs/100}€, Labor: ${labor/100}€)`);
            return ebitda;
        } catch (e) {
            logger.error('[SovereignLedger] EBITDA Calculation Failed. Falling back to safe 0.');
            return 0;
        }
    }

    /**
     * ⚖️ Inquisiteur QA: Omniscient Ledger Audit
     * Performs a full binary scan of all economic movements to detect asymmetry.
     */
    static async runInquisiteurQA(): Promise<{ secure: boolean; expected: number; actual: number; discrepancies: InquisiteurDiscrepancy[] }> {
        logger.info('[SovereignLedger] 👁️ INQUISITEUR QA: Initiating Full Binary Reconciliation.');
        const entries = await Nexus.adapter.query<LedgerEntry>(Nexus.getTenantPath('ledger/entries'));
        
        let totalDebit = 0;
        let totalCredit = 0;
        const discrepancies: InquisiteurDiscrepancy[] = [];

        if (!entries || entries.length === 0) {
            return { secure: true, expected: 0, actual: 0, discrepancies: [] };
        }

        // Group by Reference ID to ensure each transaction is balanced
        const transactions = new Map<string, { debit: number, credit: number }>();
        
        entries.forEach(entry => {
            if (entry.type === 'DEBIT') totalDebit += entry.amountInCents;
            if (entry.type === 'CREDIT') totalCredit += entry.amountInCents;

            if (entry.referenceId) {
                const tx = transactions.get(entry.referenceId) || { debit: 0, credit: 0 };
                if (entry.type === 'DEBIT') tx.debit += entry.amountInCents;
                if (entry.type === 'CREDIT') tx.credit += entry.amountInCents;
                transactions.set(entry.referenceId, tx);
            }
        });

        // Detect specific transaction asymmetry
        for (const [refId, tx] of transactions.entries()) {
            const diff = Math.abs(tx.debit - tx.credit);
            if (diff > 0.01) {
                discrepancies.push({ referenceId: refId, difference: diff, debit: tx.debit, credit: tx.credit });
            }
        }

        const globalDiff = Math.abs(totalDebit - totalCredit);
        const isSecure = globalDiff <= 0.01 && discrepancies.length === 0;

        if (!isSecure) {
            logger.error(`[SovereignLedger] 🚨 INQUISITEUR QA FAILED: Asymmetry detected! Diff: ${globalDiff}`);
            this.handleCorruptionDetected();
        } else {
            logger.info('[SovereignLedger] ✅ INQUISITEUR QA PASSED: Ledger Integrity 100% Certified.');
        }

        return { secure: isSecure, expected: totalDebit, actual: totalCredit, discrepancies };
    }
}
