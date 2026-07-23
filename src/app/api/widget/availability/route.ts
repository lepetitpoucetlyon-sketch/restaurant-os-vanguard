import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TableSchema, ReservationSchema } from '@/domain/schemas/ops';
import { logger } from '@/lib/logger';
import { getRateLimiter } from '@/lib/rate-limiter';

const QuerySchema = z.object({
  tenantId: z.string().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide: yyyy-MM-dd'),
  covers: z.coerce.number().int().min(1).max(100),
});

type Table = z.infer<typeof TableSchema> & { onlineBookable?: boolean };
type Reservation = z.infer<typeof ReservationSchema>;

interface SlotResult {
  time: string;
  available: boolean;
  tableId: string;
}

/** Generate time slots for a day: 12:00–14:30 and 19:00–22:30 every 30 min */
function generateSlots(): string[] {
  const slots: string[] = [];
  const ranges = [
    { start: 12 * 60, end: 14 * 60 + 30 },
    { start: 19 * 60, end: 22 * 60 + 30 },
  ];
  for (const { start, end } of ranges) {
    for (let m = start; m <= end; m += 30) {
      const h = Math.floor(m / 60).toString().padStart(2, '0');
      const min = (m % 60).toString().padStart(2, '0');
      slots.push(`${h}:${min}`);
    }
  }
  return slots;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const rl = await getRateLimiter().check(`widget:availability:${ip}`, 30, 60 * 60 * 1000); // 30/heure
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes — réessayez dans 1h.' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      tenantId: searchParams.get('tenantId'),
      date: searchParams.get('date'),
      covers: searchParams.get('covers'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parametres invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tenantId, date, covers } = parsed.data;
    const context = { vassalId: tenantId, actorId: 'widget' };

    // 1. Tables with sufficient capacity and online booking enabled
    const allTables = await Nexus.adapter.query<Table>('tables', undefined, context);
    const eligibleTables = allTables.filter(
      (t) => (t.seats ?? 0) >= covers && t.onlineBookable === true
    );

    if (eligibleTables.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 2. Reservations already booked for this date (confirmed / pending / arrived)
    const reservations = await Nexus.adapter.query<Reservation>(
      'reservations',
      {
        where: [{ field: 'date', operator: '==', value: date }],
      },
      context
    );

    const occupied = reservations
      .filter((r) => ['pending', 'confirmed', 'arrived', 'seated'].includes(r.status))
      .reduce<Record<string, Set<string>>>((acc, r) => {
        if (r.tableId && r.time) {
          if (!acc[r.time]) acc[r.time] = new Set();
          acc[r.time].add(r.tableId);
        }
        return acc;
      }, {});

    // 3. For each slot, check if at least one eligible table is free
    const timeSlots = generateSlots();
    const results: SlotResult[] = timeSlots.map((time) => {
      const occupiedAtSlot = occupied[time] ?? new Set<string>();
      const freeTable = eligibleTables.find((t) => !occupiedAtSlot.has(t.id));
      return {
        time,
        available: !!freeTable,
        tableId: freeTable?.id ?? '',
      };
    });

    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    logger.error('[widget/availability]', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
