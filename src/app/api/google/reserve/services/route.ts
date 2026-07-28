/**
 * GET /api/google/reserve/services?merchant_id={tenantId}
 * Feed Reserve with Google — services (créneaux / types de réservation) par restaurant.
 * Format : Google Actions Center ServiceFeed JSON (v3).
 *
 * Un "service" correspond à un type de table ou créneau réservable.
 * Par convention : un service "dining" par restaurant avec les créneaux midi et soir.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';

const RESERVE_SECRET = process.env.GOOGLE_RESERVE_SECRET;

export const dynamic = 'force-dynamic';

interface TenantConfig {
  name?: string;
  reservations?: {
    enabled?: boolean;
    maxCovers?: number;
    openingTime?: string;   // HH:mm
    closingTime?: string;
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization');
  if (!RESERVE_SECRET || auth !== `Bearer ${RESERVE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchantId = req.nextUrl.searchParams.get('merchant_id');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchant_id requis' }, { status: 400 });
  }

  const config = await Nexus.adapter.get(`tenants/${merchantId}/tenantConfig`) as TenantConfig | null;
  if (!config?.reservations?.enabled) {
    return NextResponse.json({ services: [] });
  }

  const openingTime = config.reservations.openingTime ?? '12:00';
  const closingTime = config.reservations.closingTime ?? '23:00';
  const maxCovers = config.reservations.maxCovers ?? 20;

  const services = [
    {
      service_id: `${merchantId}__dining`,
      merchant_id: merchantId,
      name: 'Réservation de table',
      description: `Réservez une table chez ${config.name ?? merchantId}`,
      category: 'DINING',
      scheduling_rules: {
        // Réservations disponibles 1h à 30j à l'avance
        min_advance_booking: 3600,       // 1 heure en secondes
        max_advance_booking: 2592000,    // 30 jours en secondes
      },
      intake_form: {
        party_size: { min: 1, max: maxCovers },
        special_requests: true,
      },
      hours: [
        {
          open: `${openingTime}:00`,
          close: `${closingTime}:00`,
          day_of_week: [1, 2, 3, 4, 5, 6, 7],
        },
      ],
    },
  ];

  return NextResponse.json(
    { services },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
  );
}
