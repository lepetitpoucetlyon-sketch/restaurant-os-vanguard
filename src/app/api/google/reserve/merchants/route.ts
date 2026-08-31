/**
 * GET /api/google/reserve/merchants
 * Feed Reserve with Google — liste des marchands (restaurants inscrits).
 * Format : Google Actions Center MerchantFeed JSON (v3).
 *
 * Authentification : Bearer GOOGLE_RESERVE_SECRET (partagé avec Google Actions Center).
 * Ne retourner que les tenants avec reservations.enabled = true.
 *
 * ENV : GOOGLE_RESERVE_SECRET (optionnel — sans clé, retourne 401)
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'restaurantos.app';
const RESERVE_SECRET = process.env.GOOGLE_RESERVE_SECRET;

export const dynamic = 'force-dynamic';

interface TenantConfig {
  name?: string;
  slug?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  reservations?: { enabled?: boolean };
  landingConfig?: { hours?: { label: string; time: string }[] };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Vérification du secret partagé Google
  const auth = req.headers.get('authorization');
  if (!RESERVE_SECRET || auth !== `Bearer ${RESERVE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allTenants = await Nexus.adapter.query('tenants', { limit: 500 }) as { id?: string }[];

  const merchants = (
    await Promise.all(
      allTenants.map(async (t) => {
        const id = t.id ?? '';
        if (!id) return null;
        const config = await Nexus.adapter.get(`tenants/${id}/tenantConfig`) as TenantConfig | null;
        if (!config?.reservations?.enabled) return null;
        const slug = config.slug ?? id;
        return {
          merchant_id: id,
          name: config.name ?? id,
          telephone: config.phone ?? '',
          url: `https://${slug}.${APP_DOMAIN}`,
          geo: {
            latitude: config.latitude ?? 0,
            longitude: config.longitude ?? 0,
            address: { street_address: config.address ?? '' },
          },
          category: 'gcid:restaurant',
          booking_url: `https://${slug}.${APP_DOMAIN}/reservations`,
        };
      })
    )
  ).filter(Boolean);

  return NextResponse.json(
    { merchants },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
  );
}
