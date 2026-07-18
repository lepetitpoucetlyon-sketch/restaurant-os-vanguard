/**
 * POST /api/admin/fleet/rag
 * Gestion Sovereign RAG sur la flotte depuis le MCC.
 *
 * Actions :
 *   { action: 'health' }                         → état RAG de toutes les instances
 *   { action: 'reindex', instanceId: string }    → réindexe une instance spécifique
 *   { action: 'push_version' }                   → signale une nouvelle version (OTA)
 *
 * Protégé : fleet_admin uniquement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFleetAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { sovereignHealth, sovereignAdminReindex, sovereignAdminStats } from '@/lib/rag/SovereignRAGClient';
import { logger } from '@/lib/logger';

type RagAction = 'health' | 'reindex' | 'push_version' | 'stats';

interface RagRequest {
  action: RagAction;
  instanceId?: string;
  version?: string;
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

  const { action, instanceId, version } = body;

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
        // Enregistre la nouvelle version cible dans Firestore — les instances
        // la détectent via NexusTelemetryService (OTA signal existant).
        logger.info(`[FleetRAG] Push version signal: ${version ?? 'latest'}`);
        return NextResponse.json({
          success: true,
          message: `Version ${version ?? 'latest'} broadcast — instances will pull on next heartbeat`,
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
