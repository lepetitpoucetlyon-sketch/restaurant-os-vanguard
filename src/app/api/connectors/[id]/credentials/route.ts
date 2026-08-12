import 'server-only';
import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { ConnectorHub } from '@/modules/intelligence';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { encryptCredentials, validateCredentialFields } from '@/lib/server/credentialCipher';
import { logger } from '@/lib/logger';
import type { ConnectorState } from '@/lib/connectors/manifest';

/**
 * PUT /api/connectors/[id]/credentials
 * Sauvegarde les credentials chiffrés pour un connecteur.
 * Les champs requis du manifest sont validés avant chiffrement.
 * Après sauvegarde le status passe à 'pending_config' — utiliser POST /test pour activer.
 * Rôle minimum : directeur
 */
export async function PUT(
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

  if (manifest.authType === 'none') {
    return NextResponse.json({ error: 'Ce connecteur ne requiert pas de credentials' }, { status: 400 });
  }

  const body = await req.json() as Record<string, string>;

  // Valider les champs requis selon le manifest
  if (manifest.fields && manifest.fields.length > 0) {
    const { valid, missing } = validateCredentialFields(body, manifest.fields);
    if (!valid) {
      return NextResponse.json({ error: 'Champs manquants', missing }, { status: 422 });
    }
  }

  const encrypted = encryptCredentials(body);

  const existing = await Nexus.adapter.get(`tenants/${tenantId}/connectors/${id}`) as ConnectorState | null;
  const state: ConnectorState = {
    status: 'pending_config',
    activatedAt: existing?.activatedAt ?? Date.now(),
    activatedBy: existing?.activatedBy ?? uid,
    credentials: encrypted,
  };

  await Nexus.adapter.set(`tenants/${tenantId}/connectors/${id}`, state);
  await NexusEventBus.emit('connectors.config_saved', { tenantId, connectorId: id, savedBy: uid });

  logger.info(`[connectors/credentials] PUT tenant=${tenantId} connector=${id} by=${uid}`);

  return NextResponse.json({
    message: 'Credentials sauvegardés — utilisez POST /test pour valider et activer',
    status: 'pending_config',
  });
}

/**
 * DELETE /api/connectors/[id]/credentials
 * Supprime les credentials et repasse le connecteur en 'pending_config'.
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
  if (!existing) return NextResponse.json({ error: 'Connecteur non activé' }, { status: 404 });

  const { credentials: _removed, ...stateWithout } = existing as ConnectorState & { credentials?: unknown };
  await Nexus.adapter.set(`tenants/${tenantId}/connectors/${id}`, {
    ...stateWithout,
    status: 'pending_config',
  });

  logger.info(`[connectors/credentials] DELETE tenant=${tenantId} connector=${id} by=${uid}`);

  return NextResponse.json({ message: 'Credentials supprimés', status: 'pending_config' });
}
