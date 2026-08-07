import 'server-only';
import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { ConnectorHub } from '@/modules/intelligence/connectors/hub';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import type { ConnectorState } from '@/shared/connector-manifest';

/**
 * POST /api/connectors/[id]/activate
 * Active un connecteur pour le tenant.
 * - authType 'none' → status 'active' immédiatement
 * - authType autre  → status 'pending_config' (credentials requis via PUT /credentials)
 * Rôle minimum : directeur (niveau 90 = CONNECTOR_PERM_LEVELS['configure'])
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const caller = await requireTenantRole(req, 'directeur');
  if (isDenied(caller)) return caller;

  const { id } = await params;
  const { tenantId, uid } = caller;

  let manifest;
  try {
    manifest = ConnectorHub.getManifest(id);
  } catch {
    return NextResponse.json({ error: `Connecteur inconnu : ${id}` }, { status: 404 });
  }

  const tenantConfig = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as Record<string, unknown> | null;
  if (!tenantConfig || !ConnectorHub.isAvailableForTenant(id, tenantConfig as Parameters<typeof ConnectorHub.isAvailableForTenant>[1])) {
    return NextResponse.json({ error: 'Connecteur non disponible pour ce vertical ou ces capabilities' }, { status: 403 });
  }

  const status: ConnectorState['status'] = manifest.authType === 'none' ? 'active' : 'pending_config';

  const existing = await Nexus.adapter.get(`tenants/${tenantId}/connectors/${id}`) as ConnectorState | null;
  if (existing?.status === 'active') {
    return NextResponse.json({ message: 'Déjà actif', status: 'active' });
  }

  const state: ConnectorState = {
    status,
    activatedAt: Date.now(),
    activatedBy: uid,
    ...(existing?.credentials ? { credentials: existing.credentials } : {}),
  };

  await Nexus.adapter.set(`tenants/${tenantId}/connectors/${id}`, state);

  await NexusEventBus.emit('connectors.activated', { tenantId, connectorId: id, activatedBy: uid });

  logger.info(`[connectors/activate] tenant=${tenantId} connector=${id} status=${status} by=${uid}`);

  return NextResponse.json({ status, message: status === 'active' ? 'Connecteur actif' : 'En attente de configuration' });
}

/**
 * DELETE /api/connectors/[id]/activate
 * Désactive un connecteur (status → 'disabled'). Les credentials chiffrés sont conservés.
 * Rôle minimum : directeur
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const caller = await requireTenantRole(req, 'directeur');
  if (isDenied(caller)) return caller;

  const { id } = await params;
  const { tenantId, uid } = caller;

  try { ConnectorHub.getManifest(id); } catch {
    return NextResponse.json({ error: `Connecteur inconnu : ${id}` }, { status: 404 });
  }

  const existing = await Nexus.adapter.get(`tenants/${tenantId}/connectors/${id}`) as ConnectorState | null;
  if (!existing || existing.status === 'disabled') {
    return NextResponse.json({ message: 'Déjà désactivé', status: 'disabled' });
  }

  await Nexus.adapter.set(`tenants/${tenantId}/connectors/${id}`, {
    ...existing,
    status: 'disabled',
  });

  await NexusEventBus.emit('connectors.deactivated', { tenantId, connectorId: id, deactivatedBy: uid });

  logger.info(`[connectors/deactivate] tenant=${tenantId} connector=${id} by=${uid}`);

  return NextResponse.json({ status: 'disabled' });
}
