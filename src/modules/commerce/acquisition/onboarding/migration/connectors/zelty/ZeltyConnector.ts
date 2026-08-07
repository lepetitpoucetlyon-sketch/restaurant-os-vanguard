/**
 * Zelty Connector
 * API REST — menu (price_cents), clients, commandes.
 * Zelty exporte toujours les prix en centimes.
 */
import type { ISourceConnector, ConnectorMeta, ConnectorCredentials, ConnectorTestResult } from '../types';
import type { ImportCategory, ParsedFile, ParsedRow } from '../../types';
import { toError } from "@/lib/toError";

const BASE = 'https://api.zelty.fr/2.7';

export class ZeltyConnector implements ISourceConnector {
    readonly meta: ConnectorMeta = {
        id: 'zelty',
        displayName: 'Zelty',
        logo: '🟢',
        authMethod: 'api_key',
        availableCategories: ['menu', 'crm', 'inventory'],
        guideUrl: 'https://www.zelty.fr/api',
        exportGuide: 'Dashboard Zelty → Paramètres → API → Générer une clé → coller ici',
    };

    availableCategories(): ImportCategory[] {
        return this.meta.availableCategories;
    }

    async testConnection(credentials: ConnectorCredentials): Promise<ConnectorTestResult> {
        try {
            const res = await fetch(`${BASE}/catalog`, {
                headers: this.headers(credentials),
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
            return { ok: true, providerName: 'Zelty' };
        } catch (e) {
            return { ok: false, error: toError(e).message };
        }
    }

    async pull(category: ImportCategory, credentials: ConnectorCredentials): Promise<ParsedFile> {
        switch (category) {
            case 'menu': return this.pullMenu(credentials);
            case 'crm':  return this.pullCustomers(credentials);
            default:
                throw new Error(`[Zelty] Catégorie non supportée: ${category}`);
        }
    }

    private async pullMenu(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const [catRes, prodRes] = await Promise.all([
            fetch(`${BASE}/catalog/categories`, { headers: this.headers(credentials), signal: AbortSignal.timeout(15000) }),
            fetch(`${BASE}/catalog/dishes`, { headers: this.headers(credentials), signal: AbortSignal.timeout(15000) }),
        ]);

        if (!catRes.ok || !prodRes.ok) throw new Error('Zelty catalog error');

        const cats  = await catRes.json() as Array<{ id: string; name: string }>;
        const prods = await prodRes.json() as Array<Record<string, unknown>>;
        const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));

        const headers = ['product_name', 'price_cents', 'category', 'description', 'tva'];
        const rows: ParsedRow[] = prods.map(p => ({
            product_name: String(p.name ?? ''),
            price_cents:  String(p.price ?? p.price_cents ?? '0'),  // Zelty = centimes
            category:     catMap[String(p.category_id ?? '')] ?? 'Autre',
            description:  String(p.description ?? ''),
            tva:          String(p.tax_rate ?? '10'),
        }));

        return {
            format: 'json',
            source: 'zelty',
            headers,
            rows,
            warnings: [{ row: 0, field: 'price', message: 'Zelty : prix en centimes → conversion automatique en euros', severity: 'info' }],
        };
    }

    private async pullCustomers(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const res = await fetch(`${BASE}/customers?limit=500`, {
            headers: this.headers(credentials),
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) throw new Error(`Zelty /customers ${res.status}`);

        const data = await res.json() as Array<Record<string, unknown>>;
        const headers = ['email', 'first_name', 'last_name', 'phone', 'visits', 'last_visit'];
        const rows: ParsedRow[] = data.map(c => ({
            email:      String(c.email ?? ''),
            first_name: String(c.first_name ?? ''),
            last_name:  String(c.last_name ?? ''),
            phone:      String(c.phone ?? ''),
            visits:     String(c.visits_count ?? '0'),
            last_visit: String(c.last_visit ?? ''),
        }));

        return { format: 'json', source: 'zelty', headers, rows, warnings: [] };
    }

    private headers(c: ConnectorCredentials) {
        return {
            'Authorization': `Bearer ${c.apiKey ?? c.accessToken}`,
            'Content-Type': 'application/json',
        };
    }
}
