/**
 * GET /api/admin/mdm/devices
 * Liste les appareils MDM gérés via Mosyle Business API.
 * Auth : fleet_admin minimum.
 * Fallback : retourne des appareils mock si MOSYLE_API_KEY est absent.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { MosyleClient, type MosyleDevice } from '@/infrastructure/services/MosyleClient';
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
