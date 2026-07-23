/**
 * Reservations API — res-arch-1 : Architecture biface
 *
 * Surface BACKOFFICE (employés) :
 *   GET  /api/reservations?date=YYYY-MM-DD  — liste jour (requireTenantUser)
 *   POST /api/reservations                  — création interne (requireTenantUser)
 *   PATCH /api/reservations?id=xxx          — mise à jour statut/table (requireTenantUser)
 *
 * Surface WIDGET PUBLIC :
 *   POST /api/widget/book         — réservation client externe (sans auth)
 *   GET  /api/widget/availability — créneaux libres (sans auth)
 *
 * Cette route gère la surface interne (backoffice).
 * La surface publique est dans /api/widget/* (rate-limitée, sans auth).
 *
 * Règles :
 *   - jamais de cross-tenant : tenantId TOUJOURS depuis le token
 *   - statuts valides : 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'no_show'
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

type ReservationStatus = 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'no_show';
const VALID_STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const date = req.nextUrl.searchParams.get('date');

  const all = await Nexus.adapter.query(`tenants/${tenantId}/reservations`) as Array<{ date?: string }>;
  const filtered = date ? all.filter(r => r.date === date) : all;

  return NextResponse.json({ reservations: filtered, date: date ?? 'all', total: filtered.length });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  let body: {
    date:         string;
    time:         string;
    covers:       number;
    customerName: string;
    phone?:       string;
    email?:       string;
    notes?:       string;
    tableId?:     string;
  };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.date || !body.time || !body.covers || !body.customerName) {
    return NextResponse.json({ error: 'date, time, covers, customerName requis' }, { status: 400 });
  }

  const id = Nexus.adapter.generateId(`tenants/${tenantId}/reservations`);
  const reservation = {
    id,
    ...body,
    status:        'confirmed' as ReservationStatus,
    source:        'backoffice',
    schemaVersion: 2,
    createdAt:     new Date().toISOString(),
    updatedAt:     Date.now(),
  };

  await Nexus.adapter.set(`tenants/${tenantId}/reservations/${id}`, reservation);

  logger.info(`[Reservations] Réservation backoffice ${id} créée — ${body.customerName} le ${body.date}`);
  return NextResponse.json({ success: true, reservation });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  let body: { status?: ReservationStatus; tableId?: string; notes?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: `Statut invalide: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
  }

  await Nexus.adapter.set(`tenants/${tenantId}/reservations/${id}`, {
    ...body,
    updatedAt: Date.now(),
  }, { merge: true });

  logger.info(`[Reservations] Réservation ${id} mise à jour — status: ${body.status ?? 'inchangé'}`);
  return NextResponse.json({ success: true, id, updated: body });
}
