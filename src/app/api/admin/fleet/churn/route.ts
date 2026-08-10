import { requireFleetAdmin, requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
/**
 * Churn Predictor IA — mcc-growth-3
 *
 * GET /api/admin/fleet/churn?tenantId  — score de churn pour un tenant (0–100)
 * GET /api/admin/fleet/churn           — top 10 tenants à risque (tous)
 *
 * Signaux utilisés :
 *   - Jours depuis dernière commande POS
 *   - Nombre de tickets support ouverts (non résolus)
 *   - Statut billing (past_due / suspended / active)
 *   - Score de santé (si disponible)
 *   - Activation des modules IA (faible engagement = signal)
 *
 * Score 0–30 = faible risque, 31–60 = moyen, 61–100 = élevé.
 * Protégé : mcc_support.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { JsonObject } from "@/shared/types/json";
import { toError } from "@/lib/toError";

interface ChurnSignals {
  daysSinceLastOrder:   number;
  openTickets:          number;
  billingStatus:        string;
  healthScore:          number | null;
  aiModuleActive:       boolean;
}

function computeChurnScore(signals: ChurnSignals): number {
  let score = 0;

  // Inactivité POS (max 40pts)
  if      (signals.daysSinceLastOrder > 30) score += 40;
  else if (signals.daysSinceLastOrder > 14) score += 25;
  else if (signals.daysSinceLastOrder > 7)  score += 10;

  // Tickets support ouverts (max 20pts)
  score += Math.min(signals.openTickets * 7, 20);

  // Billing (max 25pts)
  if      (signals.billingStatus === 'suspended')  score += 25;
  else if (signals.billingStatus === 'past_due')   score += 15;
  else if (signals.billingStatus === 'past_due_grace') score += 8;

  // Santé (max 10pts)
  if (signals.healthScore !== null && signals.healthScore < 50) score += 10;
  else if (signals.healthScore !== null && signals.healthScore < 70) score += 5;

  // Désengagement IA (5pts)
  if (!signals.aiModuleActive) score += 5;

  return Math.min(Math.round(score), 100);
}

async function getChurnForTenant(tenantId: string): Promise<{
  tenantId: string; score: number; risk: 'low' | 'medium' | 'high'; signals: ChurnSignals;
}> {
  const [config, orders, tickets] = await Promise.allSettled([
    Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`),
    Nexus.adapter.query(`tenants/${tenantId}/orders`),
    Nexus.adapter.query(`tenants/${tenantId}/supportTickets`),
  ]);

  const cfg         = config.status === 'fulfilled' ? config.value as JsonObject : null;
  const orderList   = orders.status === 'fulfilled' ? orders.value as Array<{ createdAt?: string }> : [];
  const ticketList  = tickets.status === 'fulfilled'
    ? (tickets.value as Array<{ status?: string }>).filter(t => t.status === 'open')
    : [];

  const lastOrder   = orderList.sort((a, b) =>
    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  )[0];
  const daysSinceLast = lastOrder?.createdAt
    ? Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / 86400_000)
    : 999;

  const billing  = (cfg as { billing?: { status?: string } } | null)?.billing;
  const health   = (cfg as { healthScore?: number } | null)?.healthScore ?? null;
  const features = (cfg as { featureFlags?: { ia?: boolean } } | null)?.featureFlags;

  const signals: ChurnSignals = {
    daysSinceLastOrder: daysSinceLast,
    openTickets:        ticketList.length,
    billingStatus:      billing?.status ?? 'unknown',
    healthScore:        health,
    aiModuleActive:     features?.ia === true,
  };

  const score = computeChurnScore(signals);
  const risk  = score < 31 ? 'low' : score < 61 ? 'medium' : 'high';
  return { tenantId, score, risk, signals };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');

  if (tenantId) {
    const result = await getChurnForTenant(tenantId);
    logger.info(`[Churn] ${tenantId} → score ${result.score} (${result.risk})`);
    return NextResponse.json(result);
  }

  // Fleet-wide : top 10 risque élevé
  try {
    const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;
    const results   = await Promise.all(
      instances.slice(0, 50).map(i => getChurnForTenant(i.id ?? String(Math.random())))
    );
    const sorted = results.sort((a, b) => b.score - a.score).slice(0, 10);
    return NextResponse.json({ churns: sorted, analyzedCount: instances.length });
  } catch (err) {
    logger.error('[Churn] Fleet scan error:', toError(err).message);
    return NextResponse.json({ churns: [], analyzedCount: 0 });
  }
}
