/**
 * POST /api/admin/mdm/lock
 * Verrouille un appareil via Mosyle MDM.
 * Auth : fleet_admin.
 * Body : { serialNumber: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { MosyleClient } from '@/infrastructure/services/MosyleClient';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const { serialNumber } = await req.json() as { serialNumber?: string };
  if (!serialNumber) {
    return NextResponse.json({ error: 'serialNumber requis' }, { status: 400 });
  }

  if (!process.env.MOSYLE_API_KEY) {
    logger.info(`[MDM] lock ${serialNumber} — mode démo (pas de MOSYLE_API_KEY)`);
    return NextResponse.json({ ok: true, demo: true });
  }

  await MosyleClient.lockDevice(serialNumber);
  logger.info(`[MDM] lock ${serialNumber} — OK (caller: ${(caller as import('@/lib/server/adminAuthGuard').AdminCaller).uid})`);
  return NextResponse.json({ ok: true });
}
