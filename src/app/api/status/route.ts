export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latencyMs?: number;
}

async function pingStripe(): Promise<ServiceCheck> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { name: 'Stripe', status: 'degraded' };
  const start = Date.now();
  try {
    const res = await fetch('https://api.stripe.com/v1/charges?limit=1', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(3000),
    });
    return { name: 'Stripe', status: res.ok ? 'operational' : 'degraded', latencyMs: Date.now() - start };
  } catch {
    return { name: 'Stripe', status: 'outage', latencyMs: Date.now() - start };
  }
}

async function pingResend(): Promise<ServiceCheck> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { name: 'Email (Resend)', status: 'degraded' };
  const start = Date.now();
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(3000),
    });
    return { name: 'Email (Resend)', status: res.status < 500 ? 'operational' : 'degraded', latencyMs: Date.now() - start };
  } catch {
    return { name: 'Email (Resend)', status: 'outage', latencyMs: Date.now() - start };
  }
}

async function pingNexus(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    await Promise.race([
      Nexus.adapter.get('__health__'),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
    return { name: 'Base de données', status: 'operational', latencyMs: Date.now() - start };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      name: 'Base de données',
      status: String(err).includes('timeout') ? 'degraded' : 'outage',
      latencyMs,
    };
  }
}

export async function GET(): Promise<NextResponse> {
  const [stripeResult, resendResult, nexusResult] = await Promise.allSettled([
    pingStripe(),
    pingResend(),
    pingNexus(),
  ]);

  const services: ServiceCheck[] = [
    stripeResult.status === 'fulfilled' ? stripeResult.value : { name: 'Stripe', status: 'outage' as ServiceStatus },
    resendResult.status === 'fulfilled' ? resendResult.value : { name: 'Email (Resend)', status: 'outage' as ServiceStatus },
    nexusResult.status === 'fulfilled' ? nexusResult.value : { name: 'Base de données', status: 'outage' as ServiceStatus },
  ];

  const overall: ServiceStatus = services.some(s => s.status === 'outage')
    ? 'outage'
    : services.some(s => s.status === 'degraded')
    ? 'degraded'
    : 'operational';

  const snapshot = { overall, services, checkedAt: new Date().toISOString() };

  // Store history uniquement si le serveur possède une clé interne (évite l'écriture non authentifiée)
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret) {
    (async () => {
      try {
        const existing = await Nexus.adapter.get('mcc/statusHistory') as { entries?: typeof services[] } | null;
        const prev = (existing?.entries ?? []) as typeof services[];
        const entries = [snapshot, ...prev].slice(0, 144);
        await Nexus.adapter.set('mcc/statusHistory', { entries, updatedAt: snapshot.checkedAt });
      } catch (err) {
        logger.warn('[status] Failed to persist history', String(err));
      }
    })();
  }

  return NextResponse.json(snapshot, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
  });
}
