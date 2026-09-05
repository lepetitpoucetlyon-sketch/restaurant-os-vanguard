/**
 * POST /api/admin/mdm/lock
 * Verrouille un appareil via Mosyle MDM.
 * Auth : super_admin.
 * Body : { serialNumber: string }
 */
import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { withMccRoute } from '@/lib/server/routeWrapper';
import type { MccRole } from '@/lib/server/adminAuthGuard';
import { MosyleClient } from '@/lib/MosyleClient';
import { logger } from '@/lib/logger';

export const POST = withMccRoute(
  async (req, { caller }) => {
    const { serialNumber } = await req.json() as { serialNumber?: string };
    if (!serialNumber) {
      return NextResponse.json({ error: 'serialNumber requis' }, { status: 400 });
    }

    if (!process.env.MOSYLE_API_KEY) {
      logger.info(`[MDM] lock ${serialNumber} — mode démo (pas de MOSYLE_API_KEY)`);
      return NextResponse.json({ ok: true, demo: true });
    }

    await MosyleClient.lockDevice(serialNumber);
    logger.info(`[MDM] lock ${serialNumber} — OK (caller: ${caller.uid})`);
    return NextResponse.json({ ok: true });
  },
  { minLevel: 'mcc_super_admin' },
);

