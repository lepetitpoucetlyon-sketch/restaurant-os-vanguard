import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { createHash } from 'node:crypto';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';
import { logger } from '@/lib/logger';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

interface StoredApiKey {
  id: string;
  keyHash: string;
  permissions: string[];
  revokedAt: string | null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate-limit par IP — 20 tentatives / 15 min pour contrer le brute-force
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const rl = await getRateLimiter().check(`api-key-validate:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    logger.warn(`[api-keys/validate] Rate limit dépassé ip=${ip}`);
    return NextResponse.json({ error: 'Trop de tentatives — réessayez dans 15 min.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null) as { key?: string; tenantId?: string } | null;
  if (!body?.key || !body?.tenantId) {
    return NextResponse.json({ error: 'key et tenantId requis' }, { status: 400 });
  }

  const hash = hashKey(body.key);
  const all = await Nexus.adapter.query<StoredApiKey>(`tenants/${body.tenantId}/apiKeys`);
  const match = all.find(k => k.keyHash === hash && !k.revokedAt);

  if (!match) return NextResponse.json({ valid: false }, { status: 401 });

  await Nexus.adapter.set(
    `tenants/${body.tenantId}/apiKeys/${match.id}`,
    { lastUsedAt: new Date().toISOString() },
    { merge: true },
  );

  return NextResponse.json({ valid: true, permissions: match.permissions ?? [] });
}
