import { NextRequest, NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { QueryFilter } from '@nexus/contracts/infrastructure/storage.contracts';
import { logger } from '@/lib/logger';
import { ShiftPlanInputSchema, shiftPlansPath } from '@/modules/human/effectifs/ShiftPlanSchema';
import { z } from 'zod';

const WeekQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  employeeId: z.string().optional(),
});

/**
 * GET  /api/hr/shift-plans?weekStart=YYYY-MM-DD — Planning semaine
 * POST /api/hr/shift-plans — Créer un créneau
 * Auth : manager minimum
 */

export async function GET(request: NextRequest) {
  try {
    const caller = await requireTenantRole(request, 'manager');
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const url = new URL(request.url);
    const query = WeekQuerySchema.safeParse({
      weekStart: url.searchParams.get('weekStart') ?? '',
      employeeId: url.searchParams.get('employeeId') ?? undefined,
    });
    if (!query.success) return NextResponse.json({ error: 'weekStart requis (YYYY-MM-DD)' }, { status: 400 });

    const start = query.data.weekStart;
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 7);
    const end = endDate.toISOString().slice(0, 10);

    const whereFilters: QueryFilter[] = [
      { field: 'date', operator: '>=', value: start },
      { field: 'date', operator: '<', value: end },
    ];
    if (query.data.employeeId) {
      whereFilters.push({ field: 'employeeId', operator: '==', value: query.data.employeeId });
    }

    const shifts = await Nexus.adapter.query(shiftPlansPath(tenantId), {
      where: whereFilters,
    });

    return NextResponse.json({ shifts, count: shifts.length });
  } catch (err) {
    logger.error('[shift-plans] GET', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await requireTenantRole(request, 'manager');
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const body = await request.json();
    const parsed = ShiftPlanInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload invalide' },
        { status: 400 },
      );
    }

    const id = Nexus.adapter.generateId(shiftPlansPath(tenantId));
    const shift = {
      ...parsed.data,
      id,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await Nexus.adapter.set(`${shiftPlansPath(tenantId)}/${id}`, shift);

    logger.info(`[shift-plans] Créneau créé ${id} pour ${parsed.data.employeeId} le ${parsed.data.date}`);
    return NextResponse.json({ ok: true, shift }, { status: 201 });
  } catch (err) {
    logger.error('[shift-plans] POST', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
