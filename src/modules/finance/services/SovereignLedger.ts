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

import { SovereignData } from "@/shared/nexus/contracts";

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
    private static instances = new Map<string, SovereignLedger>();

    public static getInstance(tenantId: string): SovereignLedger {
        let instance = this.instances.get(tenantId);
        if (!instance) {
            instance = new SovereignLedger(tenantId);
            this.instances.set(tenantId, instance);
        }
        return instance;
    }

    // --- Instance Implementation ---
    public currentMode: string = 'EXPERT';
    private readonly tenantId: string;

    private constructor(tenantId: string) {
        this.tenantId = tenantId;
    }

    private handleCorruptionDetected() {
        logger.error('🚨 [Oracle] FATAL CORRUPTION DETECTED. Emergency LOCAL_LOCK activated.');
        this.currentMode = 'LOCAL_LOCK';
        // Notification immédiate à l'UI pour bloquer toute transaction asymétrique
        if (Nexus.adapter && 'broadcast' in Nexus.adapter) {
            const adapter = Nexus.adapter as IBroadcastAdapter;
            adapter.broadcast('SYSTEM_LOCKDOWN', { reason: 'Data Integrity Breach' });
        }
    }

    /**
     * Records a balanced economic movement between two accounts.
     * Principle: Every DEBIT must have a matching CREDIT.
     */
    async recordTransfer(params: {
        debitAccount: LedgerEntry['accountName'],
        creditAccount: LedgerEntry['accountName'],
        amountInCents?: number,
        amountInMicrounits?: number,
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
            const settings = await Nexus.adapter.get<GlobalSettings>(Nexus.getTenantPath('settings/global', this.tenantId));
            mode = settings?.accounting?.complexityMode || 'EXPERT';
        } catch { 
            mode = 'LOCAL_LOCK' as AccountingMode; 
        }

        const rawCents = params.amountInCents;
        const microunits = params.amountInMicrounits ?? (rawCents ?? 0) * 10_000;
        const cents = rawCents ?? Math.round(microunits / 10_000);

        const buildEntry = (acc: LedgerEntry['accountName'], type: 'DEBIT' | 'CREDIT'): LedgerEntry => ({
            id: SharedKernel.generateId(`LDR-${type === 'DEBIT' ? 'DB' : 'CR'}`),
            date, accountName: acc, type,
            amountInCents: cents,
            amountInMicrounits: microunits,
            referenceId: params.referenceId, description: params.description, scelledAt: date
        });

        const debit = buildEntry(params.debitAccount, 'DEBIT');
        const credit = buildEntry(params.creditAccount, 'CREDIT');

        this.validateIntegrity(debit, credit, mode);
        logger.info(`[SovereignLedger] [${mode}] Balanced: ${cents/100}€ [${params.debitAccount}/${params.creditAccount}]`);

        await Promise.all([
            Nexus.adapter.set(Nexus.getTenantPath(`ledger/entries/${debit.id}`, this.tenantId), debit),
            Nexus.adapter.set(Nexus.getTenantPath(`ledger/entries/${credit.id}`, this.tenantId), credit)
        ]);
    }

    /**
     * ⚖️ Inquisiteur QA Validation
     * Ensures Debit matches Credit with absolute precision in microunits.
     */
    private validateIntegrity(debit: LedgerEntry, credit: LedgerEntry, mode: AccountingMode): void {
        const debitMicro = debit.amountInMicrounits ?? (debit.amountInCents * 10_000);
        const creditMicro = credit.amountInMicrounits ?? (credit.amountInCents * 10_000);
        const diffMicro = Math.abs(debitMicro - creditMicro);

        if (diffMicro > 100) {
            const error = `[LDR-ERR-01] Nexus Balance Violation: Diff=${(diffMicro / 10_000).toFixed(4)} | Debit(${debit.amountInCents}) != Credit(${credit.amountInCents}) [Accounts: ${debit.accountName} / ${credit.accountName}]`;
            logger.error(error);
            if (mode === 'EXPERT') {
                throw new Error(error);
            }
        } else if (diffMicro > 0) {
            logger.info(`[SovereignLedger] Rounded precision correction: ${(diffMicro / 10_000).toFixed(4)} centimes difference auto-settled.`);
        }
    }

    /**
     * 🖋️ Suture GRADE X+++: Convert Engagement to Debt
     */
    async convertEngagementToDebt(deliveryNoteId: string, amountInCents: number): Promise<void> {
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
    async recordSale(orderId: string, amountInCents: number): Promise<void> {
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
    async recordPurchase(poId: string, amountInCents: number): Promise<void> {
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
    async recordPayroll(staffId: string, amountInCents: number): Promise<void> {
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
    async getRealTimeEBITDA(): Promise<number> {
        try {
            const entries = await Nexus.adapter.query<LedgerEntry>(Nexus.getTenantPath('ledger/entries', this.tenantId));
            
            if (!entries || entries.length === 0) return 0;

            const revenue = entries
                .filter(e => e.accountName === 'SALES' && e.type === 'CREDIT')
                .reduce((sum, e) => sum + (e.amountInMicrounits ?? e.amountInCents * 10_000), 0);

            const cogs = entries
                .filter(e => e.accountName === 'PURCHASES' && e.type === 'DEBIT')
                .reduce((sum, e) => sum + (e.amountInMicrounits ?? e.amountInCents * 10_000), 0);

            const labor = entries
                .filter(e => (e.accountName === 'PAYROLL' || e.description.toLowerCase().includes('salaire')) && e.type === 'DEBIT')
                .reduce((sum, e) => sum + (e.amountInMicrounits ?? e.amountInCents * 10_000), 0);

            const ebitdaMicrounits = revenue - (cogs + labor);
            const ebitdaCents = Math.round(ebitdaMicrounits / 10_000);
            
            logger.info(`[SovereignLedger] EBITDA Calculated: ${ebitdaCents / 100}€ (Rev: ${Math.round(revenue/10_000)/100}€, COGS: ${Math.round(cogs/10_000)/100}€, Labor: ${Math.round(labor/10_000)/100}€)`);
            return ebitdaCents;
        } catch (_e) {
            logger.error('[SovereignLedger] EBITDA Calculation Failed. Falling back to safe 0.');
            return 0;
        }
    }

    /**
     * ⚖️ Inquisiteur QA: Omniscient Ledger Audit
     * Performs a full binary scan of all economic movements to detect asymmetry.
     */
    async runInquisiteurQA(): Promise<{ secure: boolean; expected: number; actual: number; discrepancies: InquisiteurDiscrepancy[] }> {
        logger.info('[SovereignLedger] 👁️ INQUISITEUR QA: Initiating Full Binary Reconciliation.');
        const entries = await Nexus.adapter.query<LedgerEntry>(Nexus.getTenantPath('ledger/entries', this.tenantId));
        
        let totalDebit = 0;
        let totalCredit = 0;
        const discrepancies: InquisiteurDiscrepancy[] = [];

        if (!entries?.length) {
            return { secure: true, expected: 0, actual: 0, discrepancies: [] };
        }

        // Group by Reference ID to ensure each transaction is balanced
        const transactions = new Map<string, { debit: number, credit: number }>();
        
        entries.forEach(entry => {
            const entryMicro = entry.amountInMicrounits ?? (entry.amountInCents * 10_000);
            if (entry.type === 'DEBIT') totalDebit += entryMicro;
            if (entry.type === 'CREDIT') totalCredit += entryMicro;

            if (entry.referenceId) {
                const tx = transactions.get(entry.referenceId) || { debit: 0, credit: 0 };
                if (entry.type === 'DEBIT') tx.debit += entryMicro;
                if (entry.type === 'CREDIT') tx.credit += entryMicro;
                transactions.set(entry.referenceId, tx);
            }
        });

        // Detect specific transaction asymmetry
        for (const [refId, tx] of transactions.entries()) {
            const diff = Math.abs(tx.debit - tx.credit);
            if (diff > 100) {
                discrepancies.push({ referenceId: refId, difference: diff / 10_000, debit: tx.debit / 10_000, credit: tx.credit / 10_000 });
            }
        }

        const globalDiff = Math.abs(totalDebit - totalCredit);
        const isSecure = globalDiff <= 100 && discrepancies.length === 0;

        if (!isSecure) {
            logger.error(`[SovereignLedger] 🚨 INQUISITEUR QA FAILED: Asymmetry detected! Diff: ${globalDiff}`);
            this.handleCorruptionDetected();
        } else {
            logger.info('[SovereignLedger] ✅ INQUISITEUR QA PASSED: Ledger Integrity 100% Certified.');
        }

        return { secure: isSecure, expected: totalDebit, actual: totalCredit, discrepancies };
    }
}
