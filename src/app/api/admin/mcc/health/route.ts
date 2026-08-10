import { requireFleetAdmin, requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { NextRequest, NextResponse } from 'next/server';

export interface MCCHealthStatus {
  provisioningEngine: 'ready' | 'degraded' | 'offline';
  axiomLogIngest:     'streaming' | 'degraded' | 'offline';
  nf525SealEngine:   'secured' | 'degraded' | 'offline';
  fleetIntelligence:  'aggregating' | 'degraded' | 'offline';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(request, 'mcc_support');
  if (isDenied(caller)) return caller;

  const status: MCCHealthStatus = {
    provisioningEngine: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? 'ready'
      : 'degraded',
    axiomLogIngest: process.env.AXIOM_DATASET && process.env.AXIOM_TOKEN
      ? 'streaming'
      : 'degraded',
    nf525SealEngine: process.env.FISCAL_SIGNING_SECRET
      ? 'secured'
      : 'offline',
    fleetIntelligence: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? 'aggregating'
      : 'degraded',
  };

  return NextResponse.json(status);
}
