/**
 * POST /api/admin/mdm/erase
 * Efface un appareil via Mosyle MDM (IRRÉVERSIBLE).
 * Auth : fleet_admin obligatoire.
 * Body : { serialNumber: string, confirmation: "ERASE CONFIRMED" }
 *
 * La confirmation textuelle côté serveur empêche les appels accidentels/automatisés.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { MosyleClient } from '@/infrastructure/services/MosyleClient';
import { logger } from '@/lib/logger';

const REQUIRED_CONFIRMATION = 'ERASE CONFIRMED';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const { serialNumber, confirmation } = await req.json() as {
    serialNumber?: string;
    confirmation?: string;
  };

  if (!serialNumber) {
    return NextResponse.json({ error: 'serialNumber requis' }, { status: 400 });
  }

  if (confirmation !== REQUIRED_CONFIRMATION) {
    return NextResponse.json(
      { error: `La confirmation doit être exactement "${REQUIRED_CONFIRMATION}"` },
      { status: 422 },
    );
  }

  if (!process.env.MOSYLE_API_KEY) {
    logger.info(`[MDM] erase ${serialNumber} — mode démo (pas de MOSYLE_API_KEY)`);
    return NextResponse.json({ ok: true, demo: true });
  }

  await MosyleClient.eraseDevice(serialNumber);

  const uid = (caller as import('@/lib/server/adminAuthGuard').AdminCaller).uid;
  logger.info(`[MDM] erase ${serialNumber} — DONE (caller: ${uid})`);

  return NextResponse.json({ ok: true });
}
