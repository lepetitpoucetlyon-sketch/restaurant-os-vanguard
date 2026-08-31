import 'server-only';
import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { ConnectorHub } from '@/modules/intelligence';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { decryptCredentials } from '@/lib/server/credentialCipher';
import { logger } from '@/lib/logger';
import type { ConnectorState } from '@/shared/connector-manifest';
import { toError } from "@/lib/toError";

// Pilier-specific factories — importés à la demande selon la catégorie du manifest
const SYNC_HANDLERS: Record<string, (tenantId: string, credentials: Record<string, string>) => Promise<number>> = {
  reservations: async (tenantId, credentials) => {
    const { ReservationProviderFactory } = await import('@/modules/ops/connectors/reservations');
    const provider = ReservationProviderFactory.get(credentials._providerId);
    const items = await provider.listUpcoming(tenantId);
    await Promise.all(items.map(r => Nexus.adapter.set(`tenants/${tenantId}/reservations/${r.id}`, r)));
    return items.length;
  },
  reviews: async (tenantId, _credentials) => {
    const { ReviewProviderFactory } = await import('@/modules/commerce/connectors/reviews');
    const provider = ReviewProviderFactory.get();
    const since = new Date(Date.now() - 7 * 86_400_000); // 7 derniers jours
    const items = await provider.fetchRecent(tenantId, since);
    await Promise.all(items.map(r => Nexus.adapter.set(`tenants/${tenantId}/reviews/${r.id}`, r)));
    return items.length;
  },
  delivery: async (tenantId, credentials) => {
    const { DeliveryProviderFactory } = await import('@/modules/ops/connectors/delivery');
    const provider = DeliveryProviderFactory.get(credentials._providerId);
    const items = await provider.listPendingOrders(tenantId);
    return items.length;
  },
  accounting: async (tenantId, credentials) => {
    // Sync manuel comptable : rapatrie la balance du mois en cours depuis le
    // provider externe (Pennylane pour l'instant). Le push temps réel est fait
    // en parallèle par AccountingSyncHandler sur chaque order.paid /
    // supplier.invoice_processed.
    const { AccountingProviderFactory } = await import('@/modules/finance');
    const provider = AccountingProviderFactory.get(credentials._providerId, credentials);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await provider.syncPeriod(tenantId, from, now);
    return result.pushed + result.pulled;
  },
};

/**
 * POST /api/connectors/[id]/sync
 * Déclenche une synchronisation manuelle pour un connecteur actif.
 * Rôle minimum : manager (CONNECTOR_PERM_LEVELS['manage'] = 70)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  const { id } = await params;
  const { tenantId } = caller;

  let manifest;
  try {
    manifest = ConnectorHub.getManifest(id);
  } catch {
    return NextResponse.json({ error: `Connecteur inconnu : ${id}` }, { status: 404 });
  }

  const stored = await Nexus.adapter.get(`tenants/${tenantId}/connectors/${id}`) as (ConnectorState & { credentials?: string }) | null;
  if (!stored || stored.status !== 'active') {
    return NextResponse.json({ error: 'Connecteur non actif — activez-le d\'abord' }, { status: 409 });
  }

  const credentials: Record<string, string> = stored.credentials
    ? { ...decryptCredentials(stored.credentials), _providerId: id }
    : { _providerId: id };

  const handler = SYNC_HANDLERS[manifest.category];
  if (!handler) {
    // Pas de handler dédié : émettre un événement générique pour traitement asynchrone
    await NexusEventBus.emit('connectors.sync_completed', { tenantId, connectorId: id, itemsSynced: 0 });
    logger.info(`[connectors/sync] tenant=${tenantId} connector=${id} → async (no sync handler)`);
    return NextResponse.json({ queued: true, message: 'Synchronisation mise en file d\'attente' });
  }

  try {
    const count = await handler(tenantId, credentials);

    await Nexus.adapter.set(`tenants/${tenantId}/connectors/${id}`, {
      ...stored,
      lastSyncAt: Date.now(),
      errorMessage: undefined,
    });

    await NexusEventBus.emit('connectors.sync_completed', { tenantId, connectorId: id, itemsSynced: count });
    logger.info(`[connectors/sync] tenant=${tenantId} connector=${id} synced=${count}`);

    return NextResponse.json({ ok: true, itemsSynced: count });
  } catch (err) {
    const error = toError(err).message;
    await Nexus.adapter.set(`tenants/${tenantId}/connectors/${id}`, { ...stored, status: 'error', errorMessage: error });
    await NexusEventBus.emit('connectors.sync_failed', { tenantId, connectorId: id, error });
    logger.error(`[connectors/sync] tenant=${tenantId} connector=${id} failed`, err);
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
