import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const TempLogSchema = z.object({
  sensorId: z.string().min(1).max(120),
  temperature: z.number().min(-50).max(150),
  unit: z.enum(['C', 'F']).default('C'),
  timestamp: z.number().int().positive().optional(),
});

export const POST = withTenantRoute(
  async (req, { tenantId }) => {
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
      tenantId,
      sensorId,
      temperature,
      unit,
      timestamp: timestamp ?? Date.now(),
    });

    return NextResponse.json({ success: true });
  },
  { minRole: 'plongeur' },
);

