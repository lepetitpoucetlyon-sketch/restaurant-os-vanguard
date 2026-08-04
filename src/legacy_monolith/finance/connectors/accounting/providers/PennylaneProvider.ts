import type { IAccountingProvider, LedgerEntry, ExpenseEntry, AccountingBalance, SyncResult } from '../types';
import { logger } from '@/lib/logger';

const PENNYLANE_BASE = 'https://app.pennylane.com/api/external/v1';

/**
 * Pennylane — API REST publique, la mieux documentée du marché FR.
 * Variable requise : PENNYLANE_API_TOKEN
 * Doc : https://pennylane.readme.io/
 */
export class PennylaneProvider implements IAccountingProvider {
    readonly id = 'pennylane';

    private get token(): string {
        const t = process.env.PENNYLANE_API_TOKEN;
        if (!t) throw new Error('PENNYLANE_API_TOKEN manquant');
        return t;
    }

    private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
        const res = await fetch(`${PENNYLANE_BASE}${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type':  'application/json',
                ...options?.headers,
            },
        });
        if (!res.ok) throw new Error(`Pennylane ${path} → ${res.status}`);
        return res.json() as Promise<T>;
    }

    async pushEntry(entry: LedgerEntry): Promise<string> {
        const result = await this.fetch<{ id: string }>('/journal_entries', {
            method: 'POST',
            body: JSON.stringify({
                date:    entry.date,
                label:   entry.label,
                amount:  entry.type === 'debit' ? -entry.amount : entry.amount,
                account: entry.accountCode ?? '70100000',
            }),
        });
        logger.info('[PennylaneProvider] pushEntry', result.id);
        return result.id;
    }

    async pushExpense(expense: ExpenseEntry): Promise<string> {
        const result = await this.fetch<{ id: string }>('/supplier_invoices', {
            method: 'POST',
            body: JSON.stringify({
                date:       expense.date,
                label:      expense.vendor,
                amount:     expense.amount,
                vat_rate:   expense.vatRate ?? 0.2,
                category:   expense.category,
            }),
        });
        logger.info('[PennylaneProvider] pushExpense', result.id);
        return result.id;
    }

    async pullBalance(_tenantId: string): Promise<AccountingBalance> {
        const data = await this.fetch<{ balance: Record<string, number> }>('/balance_sheet');
        return {
            totalRevenue:  data.balance['revenue'] ?? 0,
            totalExpenses: data.balance['expenses'] ?? 0,
            netIncome:     data.balance['net_income'] ?? 0,
            period:        { from: '', to: '' },
        };
    }

    async syncPeriod(_tenantId: string, from: Date, to: Date): Promise<SyncResult> {
        logger.info('[PennylaneProvider] syncPeriod', from.toISOString(), to.toISOString());
        return { pushed: 0, pulled: 0, errors: [] };
    }
}
