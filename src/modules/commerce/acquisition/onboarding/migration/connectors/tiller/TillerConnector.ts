/**
 * Tiller (SumUp) Connector
 * API REST — menu, tickets, staff.
 */
import type { ISourceConnector, ConnectorMeta, ConnectorCredentials, ConnectorTestResult } from '../types';
import type { ImportCategory, ParsedFile, ParsedRow } from '../../types';

const BASE = 'https://api.tillersystems.com/api';

export class TillerConnector implements ISourceConnector {
    readonly meta: ConnectorMeta = {
        id: 'tiller',
        displayName: 'Tiller (SumUp)',
        logo: '🔵',
        authMethod: 'api_key',
        availableCategories: ['menu', 'staff'],
        exportGuide: 'Tiller Dashboard → Paramètres → API → Générer un token',
    };

    availableCategories(): ImportCategory[] {
        return this.meta.availableCategories;
    }

    async testConnection(credentials: ConnectorCredentials): Promise<ConnectorTestResult> {
        try {
            const res = await fetch(`${BASE}/establishments`, {
                headers: this.headers(credentials),
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
            const data = await res.json() as Array<{ name?: string }>;
            return { ok: true, providerName: 'Tiller', accountInfo: { name: data[0]?.name } };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }

    async pull(category: ImportCategory, credentials: ConnectorCredentials): Promise<ParsedFile> {
        switch (category) {
            case 'menu':  return this.pullMenu(credentials);
            case 'staff': return this.pullStaff(credentials);
            default:
                throw new Error(`[Tiller] Catégorie non supportée: ${category}`);
        }
    }

    private async pullMenu(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const res = await fetch(`${BASE}/products`, {
            headers: this.headers(credentials),
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error(`Tiller /products ${res.status}`);
        const data = await res.json() as Array<Record<string, unknown>>;

        const headers = ['name', 'price', 'category', 'description', 'tax_rate'];
        const rows: ParsedRow[] = data.map(p => ({
            name:        String(p.name ?? ''),
            price:       String((Number(p.price ?? 0) / 100).toFixed(2)), // Tiller = centimes
            category:    String(p.category_name ?? p.category ?? 'Autre'),
            description: String(p.description ?? ''),
            tax_rate:    String(p.tax_rate ?? '10'),
        }));

        return {
            format: 'json',
            source: 'generic',
            headers,
            rows,
            warnings: [{ row: 0, field: 'price', message: 'Tiller : prix convertis de centimes en euros', severity: 'info' }],
        };
    }

    private async pullStaff(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const res = await fetch(`${BASE}/users`, {
            headers: this.headers(credentials),
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error(`Tiller /users ${res.status}`);
        const data = await res.json() as Array<Record<string, unknown>>;

        const headers = ['name', 'role', 'email', 'phone'];
        const rows: ParsedRow[] = data.map(u => ({
            name:  String(u.firstname ?? '') + ' ' + String(u.lastname ?? ''),
            role:  String(u.role ?? 'serveur'),
            email: String(u.email ?? ''),
            phone: String(u.phone ?? ''),
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
