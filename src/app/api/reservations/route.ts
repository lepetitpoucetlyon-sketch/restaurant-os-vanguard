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
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

type ReservationStatus = 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'no_show';
const VALID_STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'];

const CreateReservationSchema = z.object({
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  time:         z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  covers:       z.number().int().min(1).max(200),
  customerName: z.string().min(1).max(100).trim(),
  phone:        z.string().max(30).optional(),
  email:        z.string().email().max(254).optional(),
  notes:        z.string().max(500).optional(),
  tableId:      z.string().max(80).optional(),
});

const PatchReservationSchema = z.object({
  status:  z.enum(['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show']).optional(),
  tableId: z.string().max(80).optional(),
  notes:   z.string().max(500).optional(),
});

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

  const raw = await req.json().catch(() => null);
  const parsed = CreateReservationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
  }
  const { date, time, covers, customerName, phone, email, notes, tableId } = parsed.data;

  const id = Nexus.adapter.generateId(`tenants/${tenantId}/reservations`);
  const reservation = {
    id,
    date,
    time,
    covers,
    customerName,
    ...(phone   ? { phone }   : {}),
    ...(email   ? { email }   : {}),
    ...(notes   ? { notes }   : {}),
    ...(tableId ? { tableId } : {}),
    status:        'confirmed' as ReservationStatus,
    source:        'backoffice',
    schemaVersion: 2,
    createdAt:     new Date().toISOString(),
    updatedAt:     Date.now(),
  };

  await Nexus.adapter.set(`tenants/${tenantId}/reservations/${id}`, reservation);

  logger.info(`[Reservations] Réservation backoffice ${id} créée — ${customerName} le ${date}`);
  return NextResponse.json({ success: true, reservation });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const rawPatch = await req.json().catch(() => null);
  const patchParsed = PatchReservationSchema.safeParse(rawPatch);
  if (!patchParsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: patchParsed.error.flatten() }, { status: 400 });
  }
  const { status, tableId, notes } = patchParsed.data;

  const update: Record<string, unknown> = { updatedAt: Date.now() };
  if (status  !== undefined) update.status  = status;
  if (tableId !== undefined) update.tableId = tableId;
  if (notes   !== undefined) update.notes   = notes;

  await Nexus.adapter.set(`tenants/${tenantId}/reservations/${id}`, update, { merge: true });

  logger.info(`[Reservations] Réservation ${id} mise à jour — status: ${status ?? 'inchangé'}`);
  return NextResponse.json({ success: true, id, updated: patchParsed.data });
}
