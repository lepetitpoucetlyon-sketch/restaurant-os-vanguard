/**
 * POST /api/admin/fleet/rag
 * Gestion Sovereign RAG sur la flotte depuis le MCC.
 *
 * Actions :
 *   { action: 'health' }                                        → état RAG de toutes les instances
 *   { action: 'reindex', instanceId: string }                   → réindexe une instance spécifique
 *   { action: 'push_version', version: string, otaUrl?: string }  → broadcast OTA nouvelle version
 *   { action: 'rollback_version', version: string, otaUrl?: string } → rollback OTA vers version antérieure
 *
 * Protégé : fleet_admin uniquement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFleetAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { sovereignHealth, sovereignAdminReindex, sovereignAdminStats } from '@/modules/intelligence/rag/SovereignRAGClient';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

type RagAction = 'health' | 'reindex' | 'push_version' | 'rollback_version' | 'stats';

interface RagRequest {
  action: RagAction;
  instanceId?: string;
  version?: string;
  otaUrl?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireFleetAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;

  let body: RagRequest;
  try {
    body = await req.json() as RagRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, instanceId, version, otaUrl } = body;

  try {
    switch (action) {
      case 'health': {
        const health = await sovereignHealth();
        return NextResponse.json({ success: true, health });
      }

      case 'stats': {
        const stats = await sovereignAdminStats();
        return NextResponse.json({ success: true, stats });
      }

      case 'reindex': {
        if (!instanceId) {
          return NextResponse.json({ error: 'instanceId required for reindex' }, { status: 400 });
        }
        logger.info(`[FleetRAG] Reindex requested for instance ${instanceId}`);
        // workspace_id = tenantId de l'instance (même valeur dans notre modèle)
        const result = await sovereignAdminReindex(instanceId);
        return NextResponse.json({ success: true, result });
      }

      case 'push_version': {
        if (!version) {
          return NextResponse.json({ error: 'version est requis pour push_version' }, { status: 400 });
        }
        await Nexus.adapter.set('mcc/deployments/latest', {
            targetVersion: version,
            otaUrl: otaUrl ?? null,
            broadcastAt: new Date().toISOString(),
            action: 'push',
        }, { merge: true });
        empireAudit.log({
            module: 'system',
            action: 'OTA_VERSION_PUSH',
            severity: 'medium',
            details: { version, otaUrl: otaUrl ?? '' } as unknown as import('@/shared/nexus-contract').SovereignData,
            timestamp: new Date(),
        });
        logger.info(`[FleetRAG] OTA push_version: ${version}`);
        return NextResponse.json({
          success: true,
          message: `Version ${version} diffusée — instances updated on next heartbeat`,
          targetVersion: version,
        });
      }

      case 'rollback_version': {
        if (!version) {
          return NextResponse.json({ error: 'version est requis pour rollback_version' }, { status: 400 });
        }
        await Nexus.adapter.set('mcc/deployments/latest', {
            targetVersion: version,
            otaUrl: otaUrl ?? null,
            broadcastAt: new Date().toISOString(),
            action: 'rollback',
        }, { merge: true });
        empireAudit.log({
            module: 'system',
            action: 'OTA_VERSION_ROLLBACK',
            severity: 'high',
            details: { rollbackTo: version, otaUrl: otaUrl ?? '' } as unknown as import('@/shared/nexus-contract').SovereignData,
            timestamp: new Date(),
        });
        logger.info(`[FleetRAG] OTA rollback_version: ${version}`);
        return NextResponse.json({
          success: true,
          message: `Rollback vers ${version} diffusé — instances updated on next heartbeat`,
          targetVersion: version,
          isRollback: true,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    logger.error('[FleetRAG] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
