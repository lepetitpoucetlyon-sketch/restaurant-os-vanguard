/**
 * RAG Stats Workspace + Purge Orphelins — mcc-ai-3
 *
 * GET /api/admin/rag/workspace-stats?tenantId  — stats workspace LightRAG
 * GET /api/admin/rag/workspace-stats           — stats fleet (tous les workspaces)
 * DELETE /api/admin/rag/workspace-stats?tenantId — purge les documents orphelins
 *
 * Appelle LightRAGClient avec le workspace isolé par tenant.
 * Un document est "orphelin" si son ID de référence n'existe plus dans Nexus.
 *
 * Protégé : mcc_support pour GET, fleet_admin pour DELETE.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { LightRAGClient } from '@/modules/intelligence';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

async function getWorkspaceStats(tenantId: string): Promise<{
  tenantId: string;
  workspaceId: string;
  documentCount: number | null;
  status: 'online' | 'offline' | 'error';
}> {
  const workspaceId = `rag_workspace_tenant_${tenantId}`;
  try {
    const client = new LightRAGClient({ workspace: workspaceId });
    const docs   = await client.getDocuments();
    return {
      tenantId,
      workspaceId,
      documentCount: Object.keys(docs).length,
      status: 'online',
    };
  } catch {
    return { tenantId, workspaceId, documentCount: null, status: 'offline' };
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');

  if (tenantId) {
    const stats = await getWorkspaceStats(tenantId);
    return NextResponse.json(stats);
  }

  // Fleet-wide
  try {
    const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;
    const results   = await Promise.all(
      instances.slice(0, 20).map(i => getWorkspaceStats(i.id ?? ''))
    );
    const online  = results.filter(r => r.status === 'online').length;
    const offline = results.filter(r => r.status === 'offline').length;
    return NextResponse.json({ workspaces: results, online, offline, total: results.length });
  } catch (err) {
    logger.error('[RAG] workspace-stats fleet error', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const workspaceId = `rag_workspace_tenant_${tenantId}`;
  let purgedCount   = 0;

  try {
    const client = new LightRAGClient({ workspace: workspaceId });
    const docsMap = await client.getDocuments();
    const docs    = Object.entries(docsMap).map(([id]) => ({ id }));

    for (const doc of docs) {
      // Un doc est orphelin si son ID de référence n'existe plus dans Nexus
      // Convention: doc.id = '{collection}_{nexusId}'
      const parts = doc.id.split('_');
      if (parts.length >= 2) {
        const collection = parts[0];
        const nexusId    = parts.slice(1).join('_');
        const exists     = await Nexus.adapter.get(`tenants/${tenantId}/${collection}/${nexusId}`);
        if (!exists) {
          await client.deleteDocument?.(doc.id);
          purgedCount++;
        }
      }
    }

    empireAudit.log({
      module: 'fleet',
      action: 'RAG_ORPHANS_PURGED',
      severity: 'medium',
      details: { tenantId, workspaceId, purgedCount } as unknown as import('@/shared/nexus-contract').SovereignData,
      timestamp: new Date(),
    });

    logger.info(`[RAG] Purge orphelins ${tenantId} — ${purgedCount}/${docs.length} supprimés`);
    return NextResponse.json({ success: true, purgedCount, totalScanned: docs.length });

  } catch (err) {
    logger.error('[RAG] Purge orphelins error', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
