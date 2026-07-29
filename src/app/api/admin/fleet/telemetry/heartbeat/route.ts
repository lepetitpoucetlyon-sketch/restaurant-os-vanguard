import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const HeartbeatSchema = z.object({
  tenantId: z.string().min(1),
  deviceId: z.string().min(1),
  timestamp: z.string().datetime(),
  version: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  networkQuality: z.enum(['excellent', 'good', 'fair', 'poor', 'offline']).optional(),
  metrics: z.record(z.string(), z.number()).optional()
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: z.infer<typeof HeartbeatSchema>;
  try {
    body = HeartbeatSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { tenantId, deviceId, ...telemetry } = body;

  try {
    await Nexus.adapter.set(
      `mcc/telemetry/devices/${tenantId}_${deviceId}`,
      {
        tenantId,
        deviceId,
        lastSeen: new Date().toISOString(),
        ...telemetry
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, receivedAt: new Date().toISOString() });
  } catch (error) {
    logger.error(`[Telemetry/Heartbeat] Erreur pour ${tenantId}/${deviceId}:`, error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
