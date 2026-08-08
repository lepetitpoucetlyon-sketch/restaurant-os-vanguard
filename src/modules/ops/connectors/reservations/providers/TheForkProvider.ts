import type { IReservationProvider, Reservation, ReservationStatus } from '../types';
import { logger } from '@/lib/logger';

const THEFORK_BASE = 'https://api.thefork.com/v2';

interface TheForkBooking {
  id: string;
  reservation_date: string;
  reservation_time: string;
  pax: number;
  customer: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'PENDING';
  special_request?: string;
  special_occasion?: string;
  yums_code?: string;
}

function normalize(tenantId: string, b: TheForkBooking): Reservation {
  const notes = [
    b.special_request,
    b.special_occasion ? `Occasion: ${b.special_occasion}` : null,
    b.yums_code ? `Yums: ${b.yums_code}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  const status: ReservationStatus =
    b.status === 'CONFIRMED'
      ? 'confirmed'
      : b.status === 'CANCELLED'
      ? 'cancelled'
      : b.status === 'NO_SHOW'
      ? 'noshow'
      : 'pending';

  return {
    id: `thefork_${b.id}`,
    tenantId,
    externalId: b.id,
    source: 'thefork',
    guestName: `${b.customer?.first_name || ''} ${b.customer?.last_name || ''}`.trim(),
    guestEmail: b.customer?.email,
    guestPhone: b.customer?.phone,
    partySize: b.pax,
    date: b.reservation_date,
    time: b.reservation_time,
    notes,
    status,
  };
}

/**
 * 🍴 TheForkProvider (GAP 6)
 * Connecteur officiel TheFork / LaFourchette.
 * Gère la synchronisation bidirectionnelle et la normalisation des occasions spéciales & codes Yums.
 */
export class TheForkProvider implements IReservationProvider {
  readonly id = 'thefork';

  private get apiKey(): string {
    const key = process.env.THEFORK_API_KEY;
    if (!key) throw new Error('THEFORK_API_KEY non configurée');
    return key;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${THEFORK_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) throw new Error(`TheFork ${path} → ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  async listUpcoming(tenantId: string): Promise<Reservation[]> {
    try {
      const data = await this.fetch<{ data: TheForkBooking[] }>(`/restaurants/${tenantId}/bookings?status=CONFIRMED`);
      return (data.data || []).map(b => normalize(tenantId, b));
    } catch (err) {
      logger.error(`[TheForkProvider] listUpcoming fail for tenant ${tenantId}`, err);
      return [];
    }
  }

  onCreate(webhook: unknown): Reservation {
    return normalize('default', webhook as TheForkBooking);
  }

  async confirmReservation(id: string): Promise<void> {
    await this.fetch(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
  }

  async cancelReservation(id: string, _reason?: string): Promise<void> {
    await this.fetch(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
  }

  async syncAll(tenantId: string): Promise<number> {
    const items = await this.listUpcoming(tenantId);
    return items.length;
  }
}

