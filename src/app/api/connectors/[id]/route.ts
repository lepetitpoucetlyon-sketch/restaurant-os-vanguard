import 'server-only';
import { NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { ConnectorHub } from '@/modules/intelligence';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ConnectorState } from '@/lib/connectors/manifest';

/**
 * GET /api/connectors/[id]
 * Détail d'un connecteur (manifest + état). Sans credentials.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const { id } = await params;
  const { tenantId } = caller;

  let manifest;
  try {
    manifest = ConnectorHub.getManifest(id);
  } catch {
    return NextResponse.json({ error: `Connecteur inconnu : ${id}` }, { status: 404 });
  }

  const raw = await Nexus.adapter.get(`tenants/${tenantId}/connectors/${id}`) as ConnectorState & { credentials?: unknown } | null;
  const state = raw ? (({ credentials: _c, ...s }) => s)(raw) : null;

  return NextResponse.json({ manifest, state });
}
