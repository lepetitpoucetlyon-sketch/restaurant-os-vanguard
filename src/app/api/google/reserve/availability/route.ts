/**
 * GET /api/google/reserve/availability?merchant_id=X&service_id=Y&start_time=T&covers=N
 * Feed Reserve with Google — disponibilités temps réel.
 * Format : Google Actions Center AvailabilityFeed JSON (v3).
 *
 * Réutilise la logique de /api/widget/availability (même source Nexus : tables + reservations).
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';

const RESERVE_SECRET = process.env.GOOGLE_RESERVE_SECRET;
const SLOT_DURATION_MIN = 90;     // durée moyenne d'un repas
const SLOT_INTERVAL_MIN = 30;     // créneaux toutes les 30 min

export const dynamic = 'force-dynamic';

interface Table { id?: string; capacity?: number; onlineBookable?: boolean }
interface Reservation { date?: string; time?: string; covers?: number; status?: string }

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization');
  if (!RESERVE_SECRET || auth !== `Bearer ${RESERVE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const merchantId = params.get('merchant_id');
  const startTimeStr = params.get('start_time');  // ISO 8601
  const covers = parseInt(params.get('covers') ?? '2', 10);

  if (!merchantId || !startTimeStr) {
    return NextResponse.json({ error: 'merchant_id, start_time requis' }, { status: 400 });
  }

  const startDate = new Date(startTimeStr);
  if (isNaN(startDate.getTime())) {
    return NextResponse.json({ error: 'start_time invalide (ISO 8601)' }, { status: 400 });
  }

  const dateStr = startDate.toISOString().split('T')[0];

  const [tables, reservations] = await Promise.all([
    Nexus.adapter.query(`tenants/${merchantId}/tables`, { limit: 200 }) as Promise<Table[]>,
    Nexus.adapter.query(`tenants/${merchantId}/reservations`, {
      where: [{ field: 'date', operator: '==', value: dateStr }, { field: 'status', operator: '!=', value: 'cancelled' }],
      limit: 500,
    }) as Promise<Reservation[]>,
  ]);

  const bookableTables = tables.filter(t => t.onlineBookable && (t.capacity ?? 0) >= covers);

  // Générer les créneaux de la journée (9h–23h par défaut)
  const slots: { start_time: string; duration_sec: number; spots_open: number; spots_total: number }[] = [];

  for (let h = 9 * 60; h <= 22 * 60; h += SLOT_INTERVAL_MIN) {
    const slotStart = new Date(startDate);
    slotStart.setHours(0, h, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MIN * 60 * 1000);
    const slotTimeStr = `${String(Math.floor(h / 60)).padStart(2, '0')}:${String(h % 60).padStart(2, '0')}`;

    // Compter les tables déjà réservées sur ce créneau
    const busyTableIds = new Set(
      reservations
        .filter(r => r.time === slotTimeStr)
        .flatMap(() => bookableTables.slice(0, 1).map(t => t.id))
    );

    const spotsTotal = bookableTables.length;
    const spotsOpen = Math.max(0, spotsTotal - busyTableIds.size);

    slots.push({
      start_time: slotStart.toISOString(),
      duration_sec: SLOT_DURATION_MIN * 60,
      spots_open: spotsOpen,
      spots_total: spotsTotal,
    });

    void slotEnd;
  }

  return NextResponse.json(
    { merchant_id: merchantId, slots },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
  );
}
