/**
 * TheFork (LaFourchette) Connector
 * API partenaire — réservations + clients (emails souvent masqués @thefork.com).
 */
import type { ISourceConnector, ConnectorMeta, ConnectorCredentials, ConnectorTestResult } from '../types';
import type { ImportCategory, ParsedFile, ParsedRow } from '../../types';
import { isMaskedEmail } from '../../emailFilters';

const BASE = 'https://manager-api.thefork.com/v1';

export class TheForkConnector implements ISourceConnector {
    readonly meta: ConnectorMeta = {
        id: 'thefork',
        displayName: 'TheFork (LaFourchette)',
        logo: '🍴',
        authMethod: 'api_key',
        availableCategories: ['reservations', 'crm'],
        guideUrl: 'https://manager.thefork.com/settings/integrations',
        exportGuide: 'Manager TheFork → Paramètres → Intégrations → API → Copier la clé',
    };

    availableCategories(): ImportCategory[] {
        return this.meta.availableCategories;
    }

    async testConnection(credentials: ConnectorCredentials): Promise<ConnectorTestResult> {
        try {
            const res = await fetch(`${BASE}/restaurant`, {
                headers: this.headers(credentials),
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
            const data = await res.json() as { name?: string };
            return { ok: true, providerName: 'TheFork', accountInfo: { name: data.name } };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }

    async pull(category: ImportCategory, credentials: ConnectorCredentials): Promise<ParsedFile> {
        const from = new Date(Date.now() - 365 * 86400_000).toISOString().split('T')[0];
        const to   = new Date().toISOString().split('T')[0];

        const res = await fetch(
            `${BASE}/bookings?from=${from}&to=${to}&limit=500`,
            { headers: this.headers(credentials), signal: AbortSignal.timeout(20000) },
        );
        if (!res.ok) throw new Error(`TheFork /bookings ${res.status}`);

        const data = await res.json() as { bookings?: Array<Record<string, unknown>> };
        const bookings = data.bookings ?? [];

        const masked: string[] = [];
        const headers = ['booking_date', 'booking_time', 'party_size', 'customer_email', 'customer_first_name', 'customer_last_name', 'customer_phone', 'status'];
        const rows: ParsedRow[] = bookings.map(b => {
            const email = String(b.customer_email ?? '');
            if (email && isMaskedEmail(email)) masked.push(email);
            return {
                booking_date:          String(b.date ?? ''),
                booking_time:          String(b.time ?? ''),
                party_size:            String(b.party_size ?? ''),
                customer_email:        email,
                customer_first_name:   String(b.first_name ?? ''),
                customer_last_name:    String(b.last_name ?? ''),
                customer_phone:        String(b.phone ?? ''),
                status:                String(b.status ?? 'confirmed'),
            };
        });

        const warnings = masked.length > 0
            ? [{ row: 0, field: 'email', message: `${masked.length} email(s) masqué(s) @thefork.com — importés mais marqués non-contactables`, severity: 'warning' as const }]
            : [];

        return { format: 'json', source: 'thefork', headers, rows, warnings };
    }

    private headers(c: ConnectorCredentials) {
        return {
            'Authorization': `Bearer ${c.apiKey ?? c.accessToken}`,
            'Content-Type': 'application/json',
        };
    }
}
