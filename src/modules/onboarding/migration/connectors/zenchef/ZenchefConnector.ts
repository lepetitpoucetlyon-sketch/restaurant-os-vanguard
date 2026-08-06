/**
 * Zenchef Connector
 * API REST partenaire — réservations, clients, couverts historiques.
 * Doc: https://developers.zenchef.com/
 */
import type { ISourceConnector, ConnectorMeta, ConnectorCredentials, ConnectorTestResult } from '../types';
import type { ImportCategory, ParsedFile, ParsedRow } from '../../types';

const BASE = 'https://api.zenchef.com/v1';

export class ZenchefConnector implements ISourceConnector {
    readonly meta: ConnectorMeta = {
        id: 'zenchef',
        displayName: 'Zenchef',
        logo: '🍽️',
        authMethod: 'api_key',
        availableCategories: ['reservations', 'crm', 'staff'],
        guideUrl: 'https://manager.zenchef.com/settings/api',
        exportGuide: 'Dashboard Zenchef → Paramètres → API → Copier la clé API',
    };

    availableCategories(): ImportCategory[] {
        return this.meta.availableCategories;
    }

    async testConnection(credentials: ConnectorCredentials): Promise<ConnectorTestResult> {
        try {
            const res = await fetch(`${BASE}/restaurants/me`, {
                headers: this.headers(credentials),
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
            const data = await res.json() as { name?: string; id?: string };
            return { ok: true, providerName: 'Zenchef', accountInfo: { name: data.name, id: data.id } };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }

    async pull(category: ImportCategory, credentials: ConnectorCredentials): Promise<ParsedFile> {
        switch (category) {
            case 'reservations': return this.pullReservations(credentials);
            case 'crm':          return this.pullCustomers(credentials);
            default:
                throw new Error(`[Zenchef] Catégorie non supportée: ${category}`);
        }
    }

    private async pullReservations(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const from = new Date(Date.now() - 365 * 86400_000).toISOString().split('T')[0];
        const to   = new Date().toISOString().split('T')[0];

        const res = await fetch(
            `${BASE}/bookings?date_from=${from}&date_to=${to}&limit=500`,
            { headers: this.headers(credentials), signal: AbortSignal.timeout(20000) },
        );
        if (!res.ok) throw new Error(`Zenchef /bookings ${res.status}`);

        const data = await res.json() as { bookings?: Array<Record<string, unknown>> };
        const bookings = data.bookings ?? [];

        const headers = ['date_reservation', 'heure', 'nb_couverts', 'prenom', 'nom', 'email', 'telephone', 'statut', 'source'];
        const rows: ParsedRow[] = bookings.map(b => ({
            date_reservation: String(b.date ?? ''),
            heure:            String(b.time ?? ''),
            nb_couverts:      String(b.covers ?? b.party_size ?? ''),
            prenom:           String(b.customer_first_name ?? ''),
            nom:              String(b.customer_last_name ?? ''),
            email:            String(b.customer_email ?? ''),
            telephone:        String(b.customer_phone ?? ''),
            statut:           String(b.status ?? 'confirmed'),
            source:           'zenchef',
        }));

        return { format: 'json', source: 'zenchef', headers, rows, warnings: [] };
    }

    private async pullCustomers(credentials: ConnectorCredentials): Promise<ParsedFile> {
        const res = await fetch(
            `${BASE}/customers?limit=500`,
            { headers: this.headers(credentials), signal: AbortSignal.timeout(20000) },
        );
        if (!res.ok) throw new Error(`Zenchef /customers ${res.status}`);

        const data = await res.json() as { customers?: Array<Record<string, unknown>> };
        const customers = data.customers ?? [];

        const headers = ['email', 'prenom', 'nom', 'telephone', 'nb_visites', 'derniere_visite'];
        const rows: ParsedRow[] = customers.map(c => ({
            email:          String(c.email ?? ''),
            prenom:         String(c.first_name ?? ''),
            nom:            String(c.last_name ?? ''),
            telephone:      String(c.phone ?? ''),
            nb_visites:     String(c.visits_count ?? '0'),
            derniere_visite: String(c.last_visit ?? ''),
        }));

        return { format: 'json', source: 'zenchef', headers, rows, warnings: [] };
    }

    private headers(c: ConnectorCredentials) {
        return {
            'Authorization': `Bearer ${c.apiKey ?? c.accessToken}`,
            'Content-Type': 'application/json',
        };
    }
}
