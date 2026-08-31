import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';

const CrashReportSchema = z.object({
  tenantId: z.string().min(1),
  deviceId: z.string().min(1),
  errorName: z.string().min(1),
  errorMessage: z.string(),
  stackTrace: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string().optional(),
  timestamp: z.string().datetime(),
  version: z.string().optional()
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller;

  let body: z.infer<typeof CrashReportSchema>;
  try {
    body = CrashReportSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { tenantId, deviceId, errorName, ...crashDetails } = body;

  try {
    const reportId = crypto.randomUUID();
    const crashRecord = {
      id: reportId,
      tenantId,
      deviceId,
      errorName,
      ...crashDetails,
      status: 'new', // new, investigating, resolved
      receivedAt: new Date().toISOString()
    };

    // Stockage centralisé dans MCC
    await Nexus.adapter.set(`mcc/telemetry/crashes/${reportId}`, crashRecord);

    logger.error(`[Telemetry/Crash] ${errorName} sur ${tenantId}/${deviceId}: ${crashDetails.errorMessage}`);

    return NextResponse.json({ success: true, reportId });
  } catch (error) {
    logger.error(`[Telemetry/Crash] Erreur d'ingestion pour ${tenantId}/${deviceId}:`, error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
