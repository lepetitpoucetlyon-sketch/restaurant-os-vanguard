import type { IReservationProvider, Reservation } from '../types';
import { logger } from '@/lib/logger';
import { computeHmacHex, timingSafeCompareHex } from '@/lib/server/webhookVerify';

const ZENCHEF_BASE = 'https://api.zenchef.com/v1';

interface ZenchefBooking {
    id: string;
    booking_date: string;
    booking_time: string;
    covers: number;
    customer_firstname: string;
    customer_lastname: string;
    customer_email?: string;
    customer_phone?: string;
    status: string;
    comment?: string;
}

function normalize(tenantId: string, b: ZenchefBooking): Reservation {
    return {
        id:          `zenchef_${b.id}`,
        tenantId,
        externalId:  b.id,
        source:      'zenchef',
        guestName:   `${b.customer_firstname} ${b.customer_lastname}`.trim(),
        guestEmail:  b.customer_email,
        guestPhone:  b.customer_phone,
        partySize:   b.covers,
        date:        b.booking_date,
        time:        b.booking_time,
        notes:       b.comment,
        status: b.status === 'confirmed' ? 'confirmed'
              : b.status === 'cancelled' ? 'cancelled'
              : 'pending',
    };
}

export class ZenchefProvider implements IReservationProvider {
    readonly id = 'zenchef';

    private get apiKey(): string {
        const key = process.env.ZENCHEF_API_KEY;
        if (!key) throw new Error('ZENCHEF_API_KEY manquant');
        return key;
    }

    private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
        const res = await fetch(`${ZENCHEF_BASE}${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
        if (!res.ok) throw new Error(`Zenchef ${path} → ${res.status} ${res.statusText}`);
        return res.json() as Promise<T>;
    }

    async listUpcoming(tenantId: string): Promise<Reservation[]> {
        const from = new Date().toISOString().slice(0, 10);
        const data = await this.fetch<{ bookings: ZenchefBooking[] }>(
            `/bookings?from=${from}&limit=200`
        );
        return data.bookings.map(b => normalize(tenantId, b));
    }

    onCreate(webhook: unknown): Reservation {
        const payload = webhook as { booking: ZenchefBooking; restaurant_id: string };
        return normalize(payload.restaurant_id, payload.booking);
    }

    async confirmReservation(id: string): Promise<void> {
        const externalId = id.replace('zenchef_', '');
        await this.fetch(`/bookings/${externalId}/confirm`, { method: 'POST' });
        logger.info('[ZenchefProvider] confirmed', externalId);
    }

    async cancelReservation(id: string, reason?: string): Promise<void> {
        const externalId = id.replace('zenchef_', '');
        await this.fetch(`/bookings/${externalId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
        logger.info('[ZenchefProvider] cancelled', externalId);
    }

    async syncAll(tenantId: string): Promise<number> {
        const reservations = await this.listUpcoming(tenantId);
        logger.info(`[ZenchefProvider] syncAll → ${reservations.length} réservations`);
        return reservations.length;
    }

    verifySignature(rawBody: string, headers: Headers): boolean {
        const secret = process.env.ZENCHEF_WEBHOOK_SECRET;
        if (!secret) return false;
        const incoming = headers.get('x-zenchef-signature') ?? '';
        const expected = computeHmacHex(secret, rawBody);
        return timingSafeCompareHex(incoming, expected);
    }
}
