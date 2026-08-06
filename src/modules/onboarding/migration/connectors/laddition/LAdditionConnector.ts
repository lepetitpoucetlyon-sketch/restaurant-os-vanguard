/**
 * L'Addition Connector
 * API REST (sur demande) — menu (Montant TTC en centimes), tickets, CRM.
 * L'Addition exporte les prix en centimes avec colonnes "Libellé / Montant TTC / TVA / HT".
 */
import type { ISourceConnector, ConnectorMeta, ConnectorCredentials, ConnectorTestResult } from '../types';
import type { ImportCategory, ParsedFile, ParsedRow } from '../../types';

const BASE = 'https://api.laddition.com/v1';

export class LAdditionConnector implements ISourceConnector {
    readonly meta: ConnectorMeta = {
        id: 'laddition',
        displayName: "L'Addition",
        logo: '➕',
        authMethod: 'api_key',
        availableCategories: ['menu', 'crm', 'statements'],
        exportGuide: "Back-office L'Addition → Rapports → Export → Choisir la période → CSV",
    };

    availableCategories(): ImportCategory[] {
        return this.meta.availableCategories;
    }

    async testConnection(credentials: ConnectorCredentials): Promise<ConnectorTestResult> {
        try {
            const res = await fetch(`${BASE}/me`, {
                headers: this.headers(credentials),
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
            const data = await res.json() as { restaurant_name?: string };
            return { ok: true, providerName: "L'Addition", accountInfo: { name: data.restaurant_name } };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }

    async pull(category: ImportCategory, credentials: ConnectorCredentials): Promise<ParsedFile> {
        switch (category) {
            case 'menu': return this.pullMenu(credentials);
            default:
                throw new Error(`[LAddition] Catégorie non supportée via API: ${category}. Utilisez l'export CSV manuel.`);
        }
    }

    private async pullMenu(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const res = await fetch(`${BASE}/articles`, {
            headers: this.headers(credentials),
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error(`L'Addition /articles ${res.status}`);

        const data = await res.json() as Array<Record<string, unknown>>;
        const headers = ['Libellé', 'Montant TTC', 'Taux TVA', 'Catégorie'];
        const rows: ParsedRow[] = data.map(a => ({
            'Libellé':     String(a.name ?? a.libelle ?? ''),
            'Montant TTC': String(a.price_cents ?? a.montant_ttc ?? '0'),
            'Taux TVA':    String(a.tva ?? a.tax_rate ?? '10'),
            'Catégorie':   String(a.category ?? a.famille ?? 'Autre'),
        }));

        return {
            format: 'json',
            source: 'laddition',
            headers,
            rows,
            warnings: [{ row: 0, field: 'price', message: "L'Addition : prix en centimes → conversion automatique", severity: 'info' }],
        };
    }

    private headers(c: ConnectorCredentials) {
        return {
            'Authorization': `Bearer ${c.apiKey ?? c.accessToken}`,
            'Content-Type': 'application/json',
        };
    }
}
