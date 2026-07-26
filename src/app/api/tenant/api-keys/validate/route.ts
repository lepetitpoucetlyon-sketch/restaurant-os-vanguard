import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { createHash } from 'node:crypto';

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
