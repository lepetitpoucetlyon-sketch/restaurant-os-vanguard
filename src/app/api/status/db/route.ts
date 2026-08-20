import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────
// GET /api/status/db — Deep readiness probe for database connectivity
// Returns 200 if Firestore is accessible, 503 otherwise
// ─────────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest) {
  const start = Date.now();

  try {
    // Attempt a lightweight read to verify Firestore connectivity
    await Nexus.adapter.get('_meta/healthcheck');
    const latency = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      database: 'firestore',
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const latency = Date.now() - start;
    logger.error('[status/db] Firestore health check failed', err);

    return NextResponse.json(
      {
        status: 'degraded',
        database: 'firestore',
        latencyMs: latency,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
