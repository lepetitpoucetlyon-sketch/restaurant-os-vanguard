import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';
import { parsePaginationParams, paginateAfterId } from '@/lib/api/pagination';

const CreateKeySchema = z.object({
  name: z.string().min(1).max(120),
  permissions: z.array(z.string().max(80)).max(40).optional(),
});

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
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) throw new Error('INTERNAL_API_SECRET non configuré');
  const token = jwt.sign({ tenantId }, secret);
  return `ros_${token}`;
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export const GET = withTenantRoute(
  async (req, { tenantId }) => {
    const all = await Nexus.adapter.query<StoredApiKey>(`tenants/${tenantId}/apiKeys`);
    const pagination = parsePaginationParams(req.url);
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
    const page = paginateAfterId(active, pagination);

    return NextResponse.json({ keys: page.items, total: page.total, nextCursor: page.nextCursor });
  },
  { requireAdmin: true },
);

export const POST = withTenantRoute(
  async (req, { tenantId, caller }) => {
    const parsed = CreateKeySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload invalide', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { name, permissions = [] } = parsed.data;

    const key = generateApiKey(tenantId);
    const keyHash = hashKey(key);
    const keyPrefix = key.slice(0, 12);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await Nexus.adapter.set(`tenants/${tenantId}/apiKeys/${id}`, {
      id,
      keyHash,
      keyPrefix,
      name: name.trim(),
      permissions,
      createdAt: now,
      createdBy: caller.uid,
      revokedAt: null,
      lastUsedAt: null,
    });

    logger.info(`[api-keys] Created ${id} for tenant ${tenantId} by ${caller.uid}`);

    return NextResponse.json(
      { key, keyPrefix, id, name: name.trim(), permissions, createdAt: now },
      { status: 201 },
    );
  },
  { requireAdmin: true },
);

