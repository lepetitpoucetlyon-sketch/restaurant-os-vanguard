/**
 * POST /api/admin/mdm/erase
 * Efface un appareil via Mosyle MDM (IRRÉVERSIBLE).
 * Auth : super_admin obligatoire.
 * Body : { serialNumber: string, confirmation: "ERASE CONFIRMED" }
 *
 * La confirmation textuelle côté serveur empêche les appels accidentels/automatisés.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { MosyleClient } from '@/lib/MosyleClient';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

const REQUIRED_CONFIRMATION = 'ERASE CONFIRMED';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
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

  // P12-I: Audit trail for device erase
  empireAudit.log({
    module: 'system',
    action: 'MDM_DEVICE_ERASED',
    userId: uid,
    instanceId: serialNumber,
    details: { serialNumber, erasedBy: uid, erasedAt: new Date().toISOString() },
    severity: 'critical',
    timestamp: new Date(),
  });

  // Notification pour les opérateurs MCC mcc_super_admin (audit du wipe).
  const notifId = `mdm_erase_${serialNumber}_${Date.now()}`;
  await Nexus.adapter.set(`mcc/notifications/${notifId}`, {
    type: 'device_erased',
    title: 'Appareil efface (MDM)',
    message: `L'appareil ${serialNumber} a ete efface par ${uid}. Action irreversible.`,
    targetRole: 'mcc_super_admin',
    serialNumber,
    read: false,
    createdAt: Date.now(),
  });

  logger.info(`[MDM] erase ${serialNumber} — DONE (caller: ${uid})`);

  return NextResponse.json({ ok: true });
}
