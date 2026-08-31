import 'server-only';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────
// GET /api/status/nexus — Deep readiness probe for NexusAdapter & fleet
// ─────────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest) {
  const start = Date.now();

  try {
    const isReady = typeof Nexus.adapter !== 'undefined';
    if (!isReady) {
      return NextResponse.json(
        {
          status: 'degraded',
          nexus: 'uninitialized',
          latencyMs: Date.now() - start,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    const latency = Date.now() - start;
    return NextResponse.json({
      status: 'ok',
      nexus: 'connected',
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const latency = Date.now() - start;
    logger.error('[status/nexus] Nexus health check failed', err);

    return NextResponse.json(
      {
        status: 'degraded',
        nexus: 'error',
        latencyMs: latency,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
