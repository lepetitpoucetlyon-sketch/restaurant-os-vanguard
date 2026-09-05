import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export const DELETE = withTenantRoute<{ params: Promise<{ keyId: string }> }>(
  async (req, { tenantId, caller }, routeParams) => {
    if (!routeParams?.params) {
      return NextResponse.json({ error: 'Paramètres de route manquants' }, { status: 400 });
    }
    const { keyId } = await routeParams.params;

    const path = `tenants/${tenantId}/apiKeys/${keyId}`;
    const existing = await Nexus.adapter.get(path) as { revokedAt?: string | null } | null;

    if (!existing) return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 });
    if (existing.revokedAt) return NextResponse.json({ error: 'Clé déjà révoquée' }, { status: 409 });

    await Nexus.adapter.set(path, { revokedAt: new Date().toISOString(), revokedBy: caller.uid }, { merge: true });
    logger.info(`[api-keys] Revoked ${keyId} for tenant ${tenantId} by ${caller.uid}`);

    return NextResponse.json({ ok: true });
  },
  { requireAdmin: true },
);

