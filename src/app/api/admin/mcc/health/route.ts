import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export interface MCCHealthStatus {
  provisioningEngine: 'ready' | 'degraded' | 'offline';
  axiomLogIngest:     'streaming' | 'degraded' | 'offline';
  nf525SealEngine:   'secured' | 'degraded' | 'offline';
  fleetIntelligence:  'aggregating' | 'degraded' | 'offline';
  // §4.5 — Checks live (non juste env vars)
  firestorePing:      'ok' | 'error';
  openAlerts:         number;
  checkedAt:          string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(request, 'mcc_support');
  if (isDenied(caller)) return caller;

  const checkedAt = new Date().toISOString();

  // Ping Firestore réel
  let firestorePing: 'ok' | 'error' = 'ok';
  let openAlerts = 0;
  try {
    await Nexus.adapter.get('mcc/healthPing');
    const alerts = await Nexus.adapter.query('mcc/fleet/alerts', {
      where: [{ field: 'status', operator: '==', value: 'open' }],
      limit: 200,
    });
    openAlerts = alerts.length;
  } catch {
    firestorePing = 'error';
  }

  const status: MCCHealthStatus = {
    provisioningEngine: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'ready' : 'degraded',
    axiomLogIngest: process.env.AXIOM_DATASET && process.env.AXIOM_TOKEN ? 'streaming' : 'degraded',
    nf525SealEngine: process.env.FISCAL_SIGNING_SECRET ? 'secured' : 'offline',
    fleetIntelligence: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'aggregating' : 'degraded',
    firestorePing,
    openAlerts,
    checkedAt,
  };

  const httpStatus = firestorePing === 'error' ? 503 : 200;
  return NextResponse.json(status, { status: httpStatus });
}
