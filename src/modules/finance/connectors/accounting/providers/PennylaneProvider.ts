import type { IAccountingProvider, LedgerEntry, ExpenseEntry, AccountingBalance, SyncResult } from '../types';
import { logger } from '@/lib/logger';

const PENNYLANE_BASE = 'https://app.pennylane.com/api/external/v1';

/**
 * Pennylane — API REST publique, la mieux documentée du marché FR.
 * Doc : https://pennylane.readme.io/
 *
 * Multi-tenant : le token API est fourni par tenant via `credentials.api_token`
 * (stocké chiffré dans `tenants/{tenantId}/connectors/pennylane`).
 * Fallback env `PENNYLANE_API_TOKEN` uniquement pour tests / mono-tenant.
 */
export class PennylaneProvider implements IAccountingProvider {
    readonly id = 'pennylane';

    constructor(private readonly credentials?: Record<string, string>) {}

    private get token(): string {
        const t = this.credentials?.api_token ?? process.env.PENNYLANE_API_TOKEN;
        if (!t) throw new Error('Pennylane : api_token manquant (credentials tenant ou PENNYLANE_API_TOKEN)');
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
        // Le token étant lié au tenant via constructor, on n'utilise plus tenantId côté API.
        const data = await this.fetch<{ balance: Record<string, number> }>('/balance_sheet');
        return {
            totalRevenue:  data.balance['revenue'] ?? 0,
            totalExpenses: data.balance['expenses'] ?? 0,
            netIncome:     data.balance['net_income'] ?? 0,
            period:        { from: '', to: '' },
        };
    }

    async syncPeriod(tenantId: string, from: Date, to: Date): Promise<SyncResult> {
        // Le vrai import bulk (pull toutes les écritures Pennylane de la période
        // pour réconciliation locale) reste TODO — c'est un chantier à part entière.
        // Ici on rapatrie au moins la balance courante pour un feedback utile,
        // et on log explicitement que le bulk import n'est pas câblé.
        logger.info(
            `[PennylaneProvider] syncPeriod tenant=${tenantId} from=${from.toISOString().slice(0,10)} to=${to.toISOString().slice(0,10)} — balance pull only, bulk import not wired yet`
        );
        try {
            const balance = await this.pullBalance(tenantId);
            return {
                pushed: 0,
                pulled: balance.totalRevenue > 0 || balance.totalExpenses > 0 ? 1 : 0,
                errors: [],
            };
        } catch (err) {
            return {
                pushed: 0,
                pulled: 0,
                errors: [err instanceof Error ? err.message : String(err)],
            };
        }
    }
}
