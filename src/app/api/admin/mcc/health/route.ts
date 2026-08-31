import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export interface MCCHealthStatus {
  provisioningEngine: 'ready' | 'degraded' | 'offline';
  axiomLogIngest:     'streaming' | 'degraded' | 'offline';
  nf525SealEngine:   'secured' | 'degraded' | 'offline';
  fleetIntelligence:  'aggregating' | 'degraded' | 'offline';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(request, 'mcc_support');
  if (isDenied(caller)) return caller;

  const nexusAlive = await Promise.race<boolean>([
    Nexus.adapter.get('_health/ping').then(() => true).catch(() => false),
    new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000)),
  ]);

  const hasFbConfig = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

  const status: MCCHealthStatus = {
    provisioningEngine: nexusAlive && hasFbConfig ? 'ready' : nexusAlive ? 'degraded' : 'offline',
    axiomLogIngest: process.env.AXIOM_DATASET && process.env.AXIOM_TOKEN ? 'streaming' : 'degraded',
    nf525SealEngine: process.env.FISCAL_SIGNING_SECRET ? 'secured' : 'offline',
    fleetIntelligence: nexusAlive && hasFbConfig ? 'aggregating' : nexusAlive ? 'degraded' : 'offline',
  };

  return NextResponse.json(status);
}
