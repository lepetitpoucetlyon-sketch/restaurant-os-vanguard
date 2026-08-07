/**
 * Pennylane Connector
 * API REST — FEC, factures fournisseurs, plan comptable.
 * Doc: https://pennylane.readme.io/reference/
 */
import type { ISourceConnector, ConnectorMeta, ConnectorCredentials, ConnectorTestResult } from '../types';
import type { ImportCategory, ParsedFile, ParsedRow } from '../../types';
import { toError } from "@/lib/toError";

const BASE = 'https://app.pennylane.com/api/external/v1';

export class PennylaneConnector implements ISourceConnector {
    readonly meta: ConnectorMeta = {
        id: 'pennylane',
        displayName: 'Pennylane',
        logo: '🟡',
        authMethod: 'api_key',
        availableCategories: ['fec', 'statements'],
        guideUrl: 'https://app.pennylane.com/settings/integrations',
        exportGuide: 'Pennylane → Paramètres → API & Intégrations → Générer un token API',
    };

    availableCategories(): ImportCategory[] {
        return this.meta.availableCategories;
    }

    async testConnection(credentials: ConnectorCredentials): Promise<ConnectorTestResult> {
        try {
            const res = await fetch(`${BASE}/companies/me`, {
                headers: this.headers(credentials),
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
            const data = await res.json() as { company?: { name?: string } };
            return { ok: true, providerName: 'Pennylane', accountInfo: { name: data.company?.name } };
        } catch (e) {
            return { ok: false, error: toError(e).message };
        }
    }

    async pull(category: ImportCategory, credentials: ConnectorCredentials): Promise<ParsedFile> {
        switch (category) {
            case 'fec':        return this.pullFEC(credentials);
            case 'statements': return this.pullTransactions(credentials);
            default:
                throw new Error(`[Pennylane] Catégorie non supportée: ${category}`);
        }
    }

    private async pullFEC(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const year = new Date().getFullYear() - 1;
        const res = await fetch(
            `${BASE}/accounting_entries?fiscal_year=${year}&per_page=500`,
            { headers: this.headers(credentials), signal: AbortSignal.timeout(30000) },
        );
        if (!res.ok) throw new Error(`Pennylane /accounting_entries ${res.status}`);

        const data = await res.json() as { accounting_entries?: Array<Record<string, unknown>> };
        const entries = data.accounting_entries ?? [];

        const FEC_HEADERS = [
            'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
            'CompteNum', 'CompteLib', 'EcritureLib', 'Debit', 'Credit',
        ];
        const rows: ParsedRow[] = entries.map((e, i) => ({
            JournalCode: String(e.journal_code ?? 'ACH'),
            JournalLib:  String(e.journal_name ?? ''),
            EcritureNum: String(e.reference ?? `${i + 1}`.padStart(8, '0')),
            EcritureDate: String(e.date ?? '').replace(/-/g, ''),
            CompteNum:   String(e.account_number ?? ''),
            CompteLib:   String(e.account_name ?? ''),
            EcritureLib: String(e.label ?? ''),
            Debit:       String(Math.max(0, Number(e.debit ?? 0)).toFixed(2)),
            Credit:      String(Math.max(0, Number(e.credit ?? 0)).toFixed(2)),
        }));

        return {
            format: 'fec',
            source: 'generic',
            headers: FEC_HEADERS,
            rows,
            warnings: [{ row: 0, field: '', message: `FEC ${year} importé depuis Pennylane — sera scellé SHA-256 (NF525, immuable)`, severity: 'warning' }],
        };
    }

    private async pullTransactions(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const res = await fetch(`${BASE}/bank_transactions?per_page=200`, {
            headers: this.headers(credentials),
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) throw new Error(`Pennylane /bank_transactions ${res.status}`);

        const data = await res.json() as { bank_transactions?: Array<Record<string, unknown>> };
        const txs = data.bank_transactions ?? [];

        const headers = ['date', 'label', 'amount', 'pcgAccount'];
        const rows: ParsedRow[] = txs.map(t => ({
            date:       String(t.date ?? ''),
            label:      String(t.label ?? ''),
            amount:     String(Number(t.amount ?? 0).toFixed(2)),
            pcgAccount: String(t.account_number ?? ''),
        }));

        return { format: 'json', source: 'generic', headers, rows, warnings: [] };
    }

    private headers(c: ConnectorCredentials) {
        return {
            'Authorization': `Bearer ${c.apiKey ?? c.accessToken}`,
            'Content-Type': 'application/json',
        };
    }
}
