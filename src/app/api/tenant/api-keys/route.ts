import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';

interface StoredApiKey {
  id: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  permissions: string[];
  createdAt: string;
  createdBy: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
}

function generateApiKey(tenantId: string): string {
  const secret = process.env.INTERNAL_API_SECRET ?? 'fallback-secret-for-dev';
  const token = jwt.sign({ tenantId }, secret);
  return `ros_${token}`;
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller;

  const all = await Nexus.adapter.query<StoredApiKey>(`tenants/${tenantId}/apiKeys`);
  const active = all
    .filter(k => !k.revokedAt)
    .map(k => ({
      id: k.id,
      keyPrefix: k.keyPrefix,
      name: k.name,
      permissions: k.permissions ?? [],
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));

  return NextResponse.json({ keys: active });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller;

  const body = await req.json().catch(() => null) as { name?: string; permissions?: string[] } | null;
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'name requis' }, { status: 400 });
  }

  const key = generateApiKey(tenantId);
  const keyHash = hashKey(key);
  const keyPrefix = key.slice(0, 12);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await Nexus.adapter.set(`tenants/${tenantId}/apiKeys/${id}`, {
    id,
    keyHash,
    keyPrefix,
    name: body.name.trim(),
    permissions: body.permissions ?? [],
    createdAt: now,
    createdBy: caller.uid,
    revokedAt: null,
    lastUsedAt: null,
  });

  logger.info(`[api-keys] Created ${id} for tenant ${tenantId} by ${caller.uid}`);

  return NextResponse.json(
    { key, keyPrefix, id, name: body.name.trim(), permissions: body.permissions ?? [], createdAt: now },
    { status: 201 },
  );
}
