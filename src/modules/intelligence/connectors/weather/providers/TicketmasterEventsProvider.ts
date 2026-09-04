import type { IEventsProvider, LocalEvent } from '../types';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

/**
 * Ticketmaster — API événements locaux pour anticiper l'affluence.
 * Variable requise : TICKETMASTER_API_KEY
 * Doc : https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */
export class TicketmasterEventsProvider implements IEventsProvider {
    readonly id = 'ticketmaster';

    private get apiKey(): string {
        const key = process.env.TICKETMASTER_API_KEY;
        if (!key) throw new Error('TICKETMASTER_API_KEY manquant');
        return key;
    }

    async getLocalEvents(lat: number, lng: number, radiusKm: number, days: number): Promise<LocalEvent[]> {
        try {
            const endDate = new Date(Date.now() + days * 86400 * 1000).toISOString().replace('.000', '');
            const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${this.apiKey}&latlong=${lat},${lng}&radius=${radiusKm}&unit=km&endDateTime=${endDate}&size=20&sort=date,asc`;
            const res = await fetchWithTimeout(url, {}, 8_000);
            if (!res.ok) throw new Error(`Ticketmaster → ${res.status}`);
            const data = await res.json() as {
                _embedded?: { events?: Array<Record<string, unknown>> }
            };
            return (data._embedded?.events ?? []).map(e => {
                const dates  = e['dates'] as Record<string, unknown> | undefined;
                const start  = dates?.['start'] as Record<string, unknown> | undefined;
                const venues = (e['_embedded'] as Record<string, unknown> | undefined)?.['venues'];
                const venue0 = Array.isArray(venues) ? venues[0] as Record<string, unknown> : undefined;
                const clsArr = e['classifications'] as Array<Record<string, unknown>> | undefined;
                const seg    = (clsArr?.[0]?.['segment']) as Record<string, unknown> | undefined;
                return {
                    id:       String(e['id'] ?? ''),
                    name:     String(e['name'] ?? ''),
                    date:     String(start?.['localDate'] ?? ''),
                    time:     String(start?.['localTime'] ?? ''),
                    venue:    String(venue0?.['name'] ?? ''),
                    category: String(seg?.['name'] ?? ''),
                    url:      String(e['url'] ?? ''),
                };
            });
        } catch (err) {
            logger.error('[TicketmasterEventsProvider] getLocalEvents error', toError(err).message);
            return [];
        }
    }
}
