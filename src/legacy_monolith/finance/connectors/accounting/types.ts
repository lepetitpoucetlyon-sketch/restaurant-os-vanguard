export interface AccountingBalance {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    period: { from: string; to: string };
}

export interface SyncResult {
    pushed: number;
    pulled: number;
    errors: string[];
}

export interface LedgerEntry {
    id: string;
    amount: number;   // en euros (float) — côté comptabilité externe, pas microunits
    label: string;
    date: string;     // YYYY-MM-DD
    type: 'debit' | 'credit';
    accountCode?: string; // plan comptable
}

export interface ExpenseEntry {
    id: string;
    amount: number;
    vendor: string;
    date: string;
    category?: string;
    vatRate?: number;
}

export interface IAccountingProvider {
    readonly id: string;
    pushEntry(entry: LedgerEntry): Promise<string>;
    pushExpense(expense: ExpenseEntry): Promise<string>;
    pullBalance(tenantId: string): Promise<AccountingBalance>;
    syncPeriod(tenantId: string, from: Date, to: Date): Promise<SyncResult>;
}
