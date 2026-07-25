import { TransactionCategory, JournalEntry, FiscalSeal } from '@nexus/contracts';
import { ExpenseData } from '@nexus/contracts/domain.types';
import { FiscalEngine } from '@/domain/services/FiscalEngine';

/**
 * 🧾 AccountingService - Restaurant OS
 * Central Domain Logic for local-tenant accounting.
 * Grade VI: Industrialized ledger entries and PCG bridges.
 */
export class AccountingService {

    /**
     * Standard PCG (Plan Comptable Général) Mapping
     */
    static readonly CATEGORY_ACCOUNT_MAP: Partial<Record<TransactionCategory, { code: string; name: string }>> = {
        purchases: { code: '601', name: 'Achats Marchandises' },
        fixed: { code: '613', name: 'Charges Externes (Loyer/Energy)' },
        payroll: { code: '641', name: 'Rémunérations du personnel' },
        other: { code: '606', name: 'Fournitures & Divers' },
        sales: { code: '707', name: 'Ventes' },
        bank: { code: '512', name: 'Banque' },
        tax: { code: '44566', name: 'TVA déductible' }
    };

    /**
     * Orchestrates the creation of a Journal Entry and its Fiscal Seal.
     */
    static async prepareExpenseTransaction(
        tenantId: string, 
        expenseId: string, 
        expenseData: ExpenseData, 
        lastHash: string | null
    ): Promise<{ seal: FiscalSeal; journalEntry: Partial<JournalEntry> }> {
        
        const timestamp = new Date();
        
        // 1. Generate Fiscal Seal (NF525 Logic)
        const seal = await FiscalEngine.sealEntry(expenseId, {
            type: 'EXPENSE',
            amountInCents: expenseData.amountInCents,
            category: expenseData.category,
            timestamp: timestamp.toISOString()
        }, {
            lastSeal: lastHash ? { hash: lastHash } as FiscalSeal : undefined,
            instanceId: tenantId
        });

        // 2. Prepare Double-Entry Journal Content
        const categoryKey = (typeof expenseData.category === 'string' && expenseData.category in this.CATEGORY_ACCOUNT_MAP)
            ? (expenseData.category as TransactionCategory)
            : 'other' as TransactionCategory;

        const targetAccount = this.CATEGORY_ACCOUNT_MAP[categoryKey] || this.CATEGORY_ACCOUNT_MAP['other']!;

        const journalEntry: Partial<JournalEntry> = {
            pieceNumber: `EXP-${timestamp.getTime()}`,
            date: timestamp,
            description: `Note de Frais: ${expenseData.description}`,
            status: 'draft',
            referenceId: expenseId,
            referenceType: 'expense',
            isSystemGenerated: true,
            isValidated: false,
            fiscalSealHash: seal.hash,
            lines: [
                {
                    accountId: `acc_${targetAccount.code}`,
                    accountCode: targetAccount.code,
                    accountName: targetAccount.name,
                    description: expenseData.description,
                    side: 'debit',
                    amountInCents: expenseData.amountInCents,
                    date: timestamp.toISOString(),
                    pieceNumber: `EXP-${timestamp.getTime()}`,
                    debitInCents: expenseData.amountInCents,
                    creditInCents: 0,
                    runningBalanceInCents: 0
                },
                {
                    accountId: 'acc_421',
                    accountCode: '421',
                    accountName: 'Personnel - Rémunérations dues',
                    description: 'Remboursement à effectuer',
                    side: 'credit',
                    amountInCents: expenseData.amountInCents,
                    date: timestamp.toISOString(),
                    pieceNumber: `EXP-${timestamp.getTime()}`,
                    debitInCents: 0,
                    creditInCents: expenseData.amountInCents,
                    runningBalanceInCents: 0
                }
            ]
        };

        return { seal, journalEntry };
    }

    /**
     * Validates account code hierarchy for the tenant.
     */
    static validateAccountCode(code: string): boolean {
        return /^[1-7][0-9]+$/.test(code);
    }
}
