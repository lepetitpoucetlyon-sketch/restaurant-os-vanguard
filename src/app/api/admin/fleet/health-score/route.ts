/**
 * Tenant Health Score — mcc-growth-4
 *
 * GET  /api/admin/fleet/health-score?tenantId  — calcule et retourne le score de santé
 * POST /api/admin/fleet/health-score           — recalcule + persiste le score pour tous les tenants
 *
 * Dimensions (25pts chacune, total 100) :
 *   1. Activité POS      — commandes/semaine vs baseline
 *   2. Sync Nexus        — dernière sync (IndexedDB → Firestore)
 *   3. Compliance HACCP  — alertes ouvertes / zéro défaut = max
 *   4. Support tickets   — tickets résolus / total
 *
 * Score stocké dans tenants/{tenantId}/tenantConfig.healthScore (number)
 * Protégé : mcc_support.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

interface HealthDimension {
  score: number;   // 0–25
  label: string;
  details: string;
}

async function computeHealthScore(tenantId: string): Promise<{
  total: number;
  dimensions: Record<string, HealthDimension>;
  computedAt: string;
}> {
  const computedAt = new Date().toISOString();
  const now        = Date.now();
  const weekMs     = 7 * 86400_000;

  const [orders, syncMeta, haccpAlerts, tickets] = await Promise.allSettled([
    Nexus.adapter.query(`tenants/${tenantId}/orders`),
    Nexus.adapter.get(`tenants/${tenantId}/syncMeta`),
    Nexus.adapter.query(`tenants/${tenantId}/haccpAlerts`),
    Nexus.adapter.query(`tenants/${tenantId}/supportTickets`),
  ]);

  // 1. Activité POS
  const orderList = orders.status === 'fulfilled' ? orders.value as Array<{ createdAt?: string }> : [];
  const recentOrders = orderList.filter(o => o.createdAt && now - new Date(o.createdAt).getTime() < weekMs);
  const posScore = recentOrders.length >= 50 ? 25 : recentOrders.length >= 20 ? 20 : recentOrders.length >= 5 ? 12 : 0;

  // 2. Sync Nexus
  const sync  = syncMeta.status === 'fulfilled' ? syncMeta.value as { lastSync?: string } | null : null;
  const syncAge = sync?.lastSync ? (now - new Date(sync.lastSync).getTime()) / 3600_000 : 999;
  const syncScore = syncAge < 1 ? 25 : syncAge < 6 ? 18 : syncAge < 24 ? 10 : 0;

  // 3. Compliance HACCP
  const haccp     = haccpAlerts.status === 'fulfilled' ? haccpAlerts.value as Array<{ resolved?: boolean }> : [];
  const openHaccp = haccp.filter(a => !a.resolved).length;
  const haccpScore = openHaccp === 0 ? 25 : openHaccp <= 2 ? 15 : openHaccp <= 5 ? 5 : 0;

  // 4. Support tickets
  const tkList   = tickets.status === 'fulfilled' ? tickets.value as Array<{ status?: string }> : [];
  const tkTotal  = tkList.length;
  const tkResolved = tkList.filter(t => t.status === 'resolved').length;
  const tkScore  = tkTotal === 0 ? 25 : Math.round((tkResolved / tkTotal) * 25);

  const total = posScore + syncScore + haccpScore + tkScore;

  return {
    total,
    computedAt,
    dimensions: {
      pos:        { score: posScore,   label: 'Activité POS',     details: `${recentOrders.length} cmd/sem` },
      sync:       { score: syncScore,  label: 'Sync Nexus',       details: `${Math.round(syncAge)}h depuis dernière sync` },
      haccp:      { score: haccpScore, label: 'Compliance HACCP', details: `${openHaccp} alerte(s) ouverte(s)` },
      support:    { score: tkScore,    label: 'Support',          details: `${tkResolved}/${tkTotal} tickets résolus` },
    },
  };
}

const CRITICAL_HEALTH_THRESHOLD = 50;

async function alertIfCritical(tenantId: string, healthScore: number, computedAt: string): Promise<void> {
  if (healthScore >= CRITICAL_HEALTH_THRESHOLD) return;

  const notifId = `health_critical_${tenantId}_${Date.now()}`;

  // Create tenant notification
  await Nexus.adapter.set(`tenants/${tenantId}/notifications/${notifId}`, {
    type: 'health_critical',
    title: 'Sante tenant critique',
    message: `Score de sante a ${healthScore}/100 — intervention recommandee.`,
    severity: 'high',
    read: false,
    createdAt: Date.now(),
  });

  // Create auto support ticket suggestion for MCC
  await Nexus.adapter.set(`mcc/support/auto-tickets/${notifId}`, {
    tenantId,
    type: 'health_score_critical',
    healthScore,
    computedAt,
    title: `Sante critique (${healthScore}/100) pour tenant ${tenantId}`,
    suggestedAction: 'Contacter le tenant pour diagnostiquer les problemes de sante.',
    status: 'pending',
    createdAt: Date.now(),
  });

  logger.warn(`[HealthScore] Tenant ${tenantId} — score critique ${healthScore}/100, ticket auto cree`);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const health = await computeHealthScore(tenantId);

  await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
    healthScore: health.total, healthComputedAt: health.computedAt,
  }, { merge: true });

  // P12-F: Alert if health score is below critical threshold
  await alertIfCritical(tenantId, health.total, health.computedAt);

  return NextResponse.json(health);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  try {
    const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;
    const results   = await Promise.all(
      instances.map(async i => {
        const tid    = i.id ?? '';
        const health = await computeHealthScore(tid);
        await Nexus.adapter.set(`tenants/${tid}/tenantConfig`, {
          healthScore: health.total, healthComputedAt: health.computedAt,
        }, { merge: true });
        await alertIfCritical(tid, health.total, health.computedAt);
        return { tenantId: tid, score: health.total };
      })
    );
    logger.info(`[HealthScore] Recalcul fleet — ${results.length} tenants mis à jour`);
    return NextResponse.json({ updated: results.length, scores: results });
  } catch (err) {
    logger.error('[health-score] Recalcul fleet failed', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
