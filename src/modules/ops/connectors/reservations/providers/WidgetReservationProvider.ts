import type { IReservationProvider, Reservation } from '../types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * Widget propre — réservations créées via /[slug]/reservations ou l'API interne.
 * Pas d'API externe : lit/écrit directement dans Nexus.
 */
export class WidgetReservationProvider implements IReservationProvider {
    readonly id = 'widget';

    async listUpcoming(tenantId: string): Promise<Reservation[]> {
        try {
            const raw = await Nexus.adapter.get(`tenants/${tenantId}/reservations`) as Record<string, unknown> | null;
            if (!raw) return [];
            const now = new Date().toISOString().slice(0, 10);
            return Object.values(raw)
                .filter((r): r is Reservation => !!r && typeof r === 'object' && (r as Reservation).date >= now)
                .sort((a, b) => `${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1);
        } catch (err) {
            logger.error('[WidgetReservationProvider] listUpcoming error', String(err));
            return [];
        }
    }

    onCreate(webhook: unknown): Reservation {
        // Widget interne — le payload est déjà une Reservation Nexus normalisée.
        return webhook as Reservation;
    }

    async confirmReservation(id: string): Promise<void> {
        // In-app confirmation — status mis à jour directement dans Nexus par useReservations.
        logger.info('[WidgetReservationProvider] confirmReservation', id);
    }

    async cancelReservation(id: string, _reason?: string): Promise<void> {
        logger.info('[WidgetReservationProvider] cancelReservation', id);
    }

    async syncAll(_tenantId: string): Promise<number> {
        // Pas de source externe à synchroniser — toujours 0 nouvelles.
        return 0;
    }
}
