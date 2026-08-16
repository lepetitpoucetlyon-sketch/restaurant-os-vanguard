import 'server-only';
import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { ConnectorHub } from '@/modules/intelligence';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { decryptCredentials } from '@/lib/server/credentialCipher';
import { ConnectorRegistry, type ConnectorId } from '@/modules/commerce';
import { logger } from '@/lib/logger';
import type { ConnectorState } from '@/shared/connector-manifest';
import { toError } from "@/lib/toError";

/**
 * POST /api/connectors/[id]/test
 * Teste la connexion avec les credentials stockés.
 * Si le test réussit : status → 'active'.
 * Si le test échoue  : status → 'error' + errorMessage.
 * Rôle minimum : directeur
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const caller = await requireTenantRole(req, 'directeur');
  if (isDenied(caller)) return caller;

  const { id } = await params;
  const { tenantId } = caller;

  let manifest;
  try {
    manifest = ConnectorHub.getManifest(id);
  } catch {
    return NextResponse.json({ error: `Connecteur inconnu : ${id}` }, { status: 404 });
  }

  // Connecteurs sans auth → toujours OK
  if (manifest.authType === 'none') {
    await Nexus.adapter.set(`tenants/${tenantId}/connectors/${id}`, {
      status: 'active',
      activatedAt: Date.now(),
      activatedBy: caller.uid,
    } satisfies ConnectorState);
    return NextResponse.json({ ok: true, message: 'Aucune configuration requise — connecteur actif' });
  }

  // Lire l'état stocké
  const stored = await Nexus.adapter.get(`tenants/${tenantId}/connectors/${id}`) as (ConnectorState & { credentials?: string }) | null;
  if (!stored?.credentials) {
    return NextResponse.json({ ok: false, error: 'Aucun credential trouvé — utilisez PUT /credentials d\'abord' }, { status: 422 });
  }

  let credentials: Record<string, string>;
  try {
    credentials = decryptCredentials(stored.credentials);
  } catch (err) {
    logger.error(`[connectors/test] Déchiffrement échoué tenant=${tenantId} connector=${id}`, err);
    return NextResponse.json({ ok: false, error: 'Credentials corrompus — veuillez les ressaisir' }, { status: 500 });
  }

  // Test via le ConnectorRegistry d'onboarding si le connecteur est connu là
  let testResult: { ok: boolean; error?: string } = { ok: false, error: 'Test non implémenté pour ce connecteur' };

  const migrationIds = ConnectorRegistry.available() as string[];
  if (migrationIds.includes(id)) {
    try {
      const connector = ConnectorRegistry.get(id as ConnectorId);
      const result = await connector.testConnection({ apiKey: credentials.apiKey, accessToken: credentials.accessToken, ...credentials });
      testResult = { ok: result.ok, error: result.error };
    } catch (err) {
      testResult = { ok: false, error: toError(err).message };
    }
  } else {
    // Pour les autres providers runtime : vérification de présence des champs requis
    const allFieldsPresent = !manifest.fields || manifest.fields
      .filter(f => !f.optional)
      .every(f => !!credentials[f.key]);
    testResult = allFieldsPresent
      ? { ok: true }
      : { ok: false, error: 'Champs de configuration manquants' };
  }

  // Mettre à jour le statut selon le résultat
  const newStatus: ConnectorState['status'] = testResult.ok ? 'active' : 'error';
  await Nexus.adapter.set(`tenants/${tenantId}/connectors/${id}`, {
    ...stored,
    status: newStatus,
    ...(testResult.ok ? { errorMessage: undefined, lastSyncAt: Date.now() } : { errorMessage: testResult.error }),
  });

  if (testResult.ok) {
    await NexusEventBus.emit('connectors.activated', { tenantId, connectorId: id, activatedBy: caller.uid });
  } else {
    await NexusEventBus.emit('connectors.sync_failed', { tenantId, connectorId: id, error: testResult.error ?? 'Test échoué' });
  }

  logger.info(`[connectors/test] tenant=${tenantId} connector=${id} ok=${testResult.ok}`);

  return NextResponse.json({ ok: testResult.ok, status: newStatus, error: testResult.error });
}
