import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const TempLogSchema = z.object({
  sensorId: z.string().min(1).max(120),
  temperature: z.number().min(-50).max(150),
  unit: z.enum(['C', 'F']).default('C'),
  timestamp: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const parsed = TempLogSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload invalide', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { sensorId, temperature, unit, timestamp } = parsed.data;

  await NexusEventBus.emitDurable('haccp.temperature_logged', {
    v: 1,
    tenantId: caller.tenantId,
    sensorId,
    temperature,
    unit,
    timestamp: timestamp ?? Date.now(),
  });

  return NextResponse.json({ success: true });
}
