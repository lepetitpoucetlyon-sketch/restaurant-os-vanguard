import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> },
): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller;
  const { keyId } = await params;

  const path = `tenants/${tenantId}/apiKeys/${keyId}`;
  const existing = await Nexus.adapter.get(path) as { revokedAt?: string | null } | null;

  if (!existing) return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 });
  if (existing.revokedAt) return NextResponse.json({ error: 'Clé déjà révoquée' }, { status: 409 });

  await Nexus.adapter.set(path, { revokedAt: new Date().toISOString(), revokedBy: caller.uid }, { merge: true });
  logger.info(`[api-keys] Revoked ${keyId} for tenant ${tenantId} by ${caller.uid}`);

  return NextResponse.json({ ok: true });
}
