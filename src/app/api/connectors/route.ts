import 'server-only';
import { NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { ConnectorHub } from '@/modules/intelligence/connectors/hub';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ConnectorState } from '@/shared/connector-manifest';

/**
 * GET /api/connectors
 * Liste tous les connecteurs disponibles pour le tenant avec leur état Nexus.
 * Accessible à tous les rôles — les credentials chiffrés sont toujours omis.
 */
export async function GET(req: Request) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const { tenantId } = caller;

  let tenantConfig: Record<string, unknown> | null = null;
  let states: (ConnectorState & { id: string })[] = [];
  try {
    tenantConfig = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as Record<string, unknown> | null;
    if (tenantConfig) {
      states = await Nexus.adapter.query<ConnectorState & { id: string }>(`tenants/${tenantId}/connectors`, {}).catch(() => []);
    }
  } catch {
    // Nexus server adapter non configuré (dev local sans Firebase) — on utilise un config par défaut
  }
  // Fallback dev : config minimale pour afficher le catalogue
  if (!tenantConfig) tenantConfig = { variant: 'restaurant' };

  const stateMap: Record<string, ConnectorState> = {};
  for (const s of states) {
    const { id, ...rest } = s;
    // Ne jamais exposer les credentials chiffrés au client
    const { credentials: _creds, ...safeState } = rest as ConnectorState & { credentials?: unknown };
    stateMap[id] = safeState as ConnectorState;
  }

  const connectors = ConnectorHub.forTenant(
    tenantConfig as Parameters<typeof ConnectorHub.forTenant>[0],
    stateMap,
  );

  return NextResponse.json({ connectors });
}
