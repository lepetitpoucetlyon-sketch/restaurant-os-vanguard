/**
 * Lightspeed Connector (Restaurant)
 * OAuth2 — menu, stocks, clients.
 * API doc : https://developers.lightspeedhq.com/restaurant/introduction/
 */
import type { ISourceConnector, ConnectorMeta, ConnectorCredentials, ConnectorTestResult } from '../types';
import type { ImportCategory, ParsedFile, ParsedRow } from '../../types';
import { toError } from "@/lib/toError";

const BASE = 'https://api.lightspeedhq.com/restaurant/1';

export class LightspeedConnector implements ISourceConnector {
    readonly meta: ConnectorMeta = {
        id: 'lightspeed',
        displayName: 'Lightspeed Restaurant',
        logo: '⚡',
        authMethod: 'oauth2',
        oauthUrl: 'https://cloud.lightspeedhq.com/oauth/authorize',
        availableCategories: ['menu', 'inventory', 'crm'],
        exportGuide: 'Back-office Lightspeed → Produits → Exporter tout → CSV ou XLSX',
    };

    availableCategories(): ImportCategory[] {
        return this.meta.availableCategories;
    }

    async testConnection(credentials: ConnectorCredentials): Promise<ConnectorTestResult> {
        try {
            const res = await fetch(`${BASE}/account`, {
                headers: this.headers(credentials),
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
            const data = await res.json() as { name?: string; id?: string };
            return { ok: true, providerName: 'Lightspeed', accountInfo: { name: data.name, id: data.id } };
        } catch (e) {
            return { ok: false, error: toError(e).message };
        }
    }

    async pull(category: ImportCategory, credentials: ConnectorCredentials): Promise<ParsedFile> {
        switch (category) {
            case 'menu':      return this.pullMenu(credentials);
            case 'inventory': return this.pullInventory(credentials);
            case 'crm':       return this.pullCustomers(credentials);
            default:
                throw new Error(`[Lightspeed] Catégorie non supportée: ${category}`);
        }
    }

    private async pullMenu(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const res = await fetch(`${BASE}/items?limit=500`, {
            headers: this.headers(credentials),
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) throw new Error(`Lightspeed /items ${res.status}`);
        const data = await res.json() as { items?: Array<Record<string, unknown>> };
        const items = data.items ?? [];

        const headers = ['ProductName', 'Price', 'Stock', 'Barcode', 'Category', 'CostPrice'];
        const rows: ParsedRow[] = items.map(i => ({
            ProductName: String(i.description ?? i.name ?? ''),
            Price:       String(i.price ?? '0'),
            Stock:       String(i.stock ?? '0'),
            Barcode:     String(i.barcode ?? ''),
            Category:    String((i.category as { name?: string })?.name ?? ''),
            CostPrice:   String(i.cost_price ?? '0'),
        }));

        return { format: 'json', source: 'lightspeed', headers, rows, warnings: [] };
    }

    private async pullInventory(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const res = await fetch(`${BASE}/inventory?limit=500`, {
            headers: this.headers(credentials),
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) throw new Error(`Lightspeed /inventory ${res.status}`);
        const data = await res.json() as { inventory?: Array<Record<string, unknown>> };
        const items = data.inventory ?? [];

        const headers = ['name', 'quantity', 'unit', 'cost', 'supplier'];
        const rows: ParsedRow[] = items.map(i => ({
            name:     String(i.name ?? ''),
            quantity: String(i.qty ?? i.quantity ?? '0'),
            unit:     String(i.unit ?? 'unit'),
            cost:     String(i.cost_price ?? '0'),
            supplier: String(i.supplier ?? ''),
        }));

        return { format: 'json', source: 'lightspeed', headers, rows, warnings: [] };
    }

    private async pullCustomers(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const res = await fetch(`${BASE}/customers?limit=500`, {
            headers: this.headers(credentials),
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) throw new Error(`Lightspeed /customers ${res.status}`);
        const data = await res.json() as { customers?: Array<Record<string, unknown>> };
        const customers = data.customers ?? [];

        const headers = ['email', 'first_name', 'last_name', 'phone', 'visits'];
        const rows: ParsedRow[] = customers.map(c => ({
            email:      String(c.email ?? ''),
            first_name: String(c.first_name ?? ''),
            last_name:  String(c.last_name ?? ''),
            phone:      String(c.phone ?? ''),
            visits:     String(c.visits_count ?? '0'),
        }));

        return { format: 'json', source: 'lightspeed', headers, rows, warnings: [] };
    }

    private headers(c: ConnectorCredentials) {
        return {
            'Authorization': `Bearer ${c.accessToken ?? c.apiKey}`,
            'Content-Type': 'application/json',
        };
    }
}
