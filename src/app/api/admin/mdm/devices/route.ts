/**
 * GET /api/admin/mdm/devices
 * Liste les appareils MDM gérés via Mosyle Business API.
 * Auth : fleet_admin minimum.
 * Fallback : retourne des appareils mock si MOSYLE_API_KEY est absent.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { MosyleClient, type MosyleDevice } from '@/infrastructure/services/MosyleClient';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

const MOCK_DEVICES: MosyleDevice[] = [
  {
    serialNumber: 'C02ZX1YGMD6T',
    deviceName: 'iPad Caisse 1',
    model: 'iPad Pro 11" (4th gen)',
    status: 'online',
    lastSeen: new Date(Date.now() - 5 * 60_000).toISOString(),
    osVersion: 'iPadOS 17.5.1',
    batteryLevel: 87,
  },
  {
    serialNumber: 'FVFZK2V5Q6L7',
    deviceName: 'iPad KDS Cuisine',
    model: 'iPad 10th gen',
    status: 'online',
    lastSeen: new Date(Date.now() - 12 * 60_000).toISOString(),
    osVersion: 'iPadOS 17.5.1',
    batteryLevel: 62,
  },
  {
    serialNumber: 'DX4K9M2PQ3RT',
    deviceName: 'iPhone Manager',
    model: 'iPhone 15',
    status: 'offline',
    lastSeen: new Date(Date.now() - 16 * 3600_000).toISOString(),
    osVersion: 'iOS 17.5.1',
    batteryLevel: 15,
  },
  {
    serialNumber: 'FVHXQ2P8WR4M',
    deviceName: 'iPad Réservations',
    model: 'iPad Air 5th gen',
    status: 'offline',
    lastSeen: new Date(Date.now() - 5 * 3600_000).toISOString(),
    osVersion: 'iPadOS 17.4.0',
    batteryLevel: 44,
  },
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  if (!process.env.MOSYLE_API_KEY) {
    logger.info('[MDM] MOSYLE_API_KEY absent — mode démo');
    return NextResponse.json({ devices: MOCK_DEVICES, demo: true });
  }

  try {
    const devices = await MosyleClient.listDevices();
    return NextResponse.json({ devices, demo: false });
  } catch (err) {
    logger.warn('[MDM] listDevices failed — fallback mock', String(err));
    return NextResponse.json({ devices: MOCK_DEVICES, demo: true });
  }
}

/**
 * POST /api/admin/mdm/devices
 * Provisionne un nouvel appareil MDM pour un tenant.
 * Body: { serialNumber: string, tenantId: string, deviceName: string }
 * Auth : fleet_admin minimum.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const { serialNumber, tenantId, deviceName } = await req.json() as {
    serialNumber?: string;
    tenantId?: string;
    deviceName?: string;
  };

  if (!serialNumber || !tenantId || !deviceName) {
    return NextResponse.json(
      { error: 'serialNumber, tenantId et deviceName requis' },
      { status: 400 },
    );
  }

  const uid = (caller as import('@/lib/server/adminAuthGuard').AdminCaller).uid;
  const now = Date.now();

  try {
    // Register in Mosyle if API key is available
    if (process.env.MOSYLE_API_KEY) {
      try {
        // MosyleClient doesn't have a dedicated provision method —
        // we rely on Mosyle's auto-enrollment (DEP/ADE). The assignment
        // record below is what the platform tracks internally.
        logger.info(`[MDM] Device ${serialNumber} — Mosyle API present, enrollment expected via DEP`);
      } catch (mosyleErr) {
        logger.warn(`[MDM] Mosyle provision call failed for ${serialNumber}`, String(mosyleErr));
      }
    }

    // Write device assignment record
    const assignment: Record<string, unknown> = {
      serialNumber,
      tenantId,
      deviceName,
      provisionedAt: now,
      provisionedBy: uid,
      status: 'provisioned',
    };

    await Nexus.adapter.set(
      `mcc/deviceAssignments/${tenantId}/${serialNumber}`,
      assignment,
    );

    // Also append serial to the tenant's serial list for the MDM kill switch
    const existing = await Nexus.adapter.get(`mcc/deviceAssignments/${tenantId}`) as {
      serialNumbers?: string[];
    } | null;
    const serials = existing?.serialNumbers ?? [];
    if (!serials.includes(serialNumber)) {
      serials.push(serialNumber);
      await Nexus.adapter.set(`mcc/deviceAssignments/${tenantId}`, {
        serialNumbers: serials,
        updatedAt: now,
      }, { merge: true });
    }

    empireAudit.log({
      module: 'system',
      action: 'MDM_DEVICE_PROVISIONED',
      userId: uid,
      instanceId: tenantId,
      details: { serialNumber, deviceName },
      severity: 'medium',
      timestamp: new Date(),
    });

    logger.info(`[MDM] Device ${serialNumber} provisioned for tenant ${tenantId} by ${uid}`);

    return NextResponse.json({ ok: true, device: assignment }, { status: 201 });
  } catch (err) {
    logger.error(`[MDM] Provisioning failed for ${serialNumber}`, err);
    return NextResponse.json({ error: 'Erreur provisionnement' }, { status: 500 });
  }
}
