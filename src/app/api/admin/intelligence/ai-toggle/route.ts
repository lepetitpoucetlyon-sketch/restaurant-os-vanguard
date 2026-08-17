/**
 * Toggles modules IA par restaurant — ai-toggle-1
 *
 * GET  /api/admin/intelligence/ai-toggle?tenantId — lit les toggles IA du tenant
 * POST /api/admin/intelligence/ai-toggle          — active/désactive un module IA
 *
 * Modules IA disponibles :
 *   smart_recommendations : suggestions personnalisées client
 *   demand_forecast       : prévision de demande hebdomadaire
 *   churn_prediction      : prédiction churn client
 *   auto_pricing          : pricing dynamique (yield)
 *   rag_assistant         : assistant conversationnel RAG
 *
 * Les toggles sont stockés dans tenants/{tenantId}/tenantConfig.aiModules.{key} = boolean
 * Protégé : mcc_support pour GET, super_admin pour POST.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

const AI_MODULES = {
  smart_recommendations: { label: 'Recommandations personnalisées',  impact: 'low'    },
  demand_forecast:        { label: 'Prévision de demande',            impact: 'medium' },
  churn_prediction:       { label: 'Prédiction churn client',         impact: 'medium' },
  auto_pricing:           { label: 'Pricing dynamique (Yield)',        impact: 'high'   },
  rag_assistant:          { label: 'Assistant conversationnel RAG',    impact: 'medium' },
} as const;

type AIModuleKey = keyof typeof AI_MODULES;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const config  = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as
    { aiModules?: Record<string, boolean> } | null;
  const enabled = config?.aiModules ?? {};

  const modules = Object.entries(AI_MODULES).map(([key, meta]) => ({
    key,
    ...meta,
    enabled: enabled[key] === true,
  }));

  return NextResponse.json({ tenantId, modules });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: { tenantId: string; module: AIModuleKey; enabled: boolean };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tenantId, module: mod, enabled } = body;
  if (!tenantId || !mod) {
    return NextResponse.json({ error: 'tenantId et module requis' }, { status: 400 });
  }

  if (!Object.keys(AI_MODULES).includes(mod)) {
    return NextResponse.json({ error: `Module invalide: ${Object.keys(AI_MODULES).join(', ')}` }, { status: 400 });
  }

  await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
    aiModules: { [mod]: enabled },
  }, { merge: true });

  empireAudit.log({
    module: 'fleet',
    action: enabled ? 'AI_MODULE_ENABLED' : 'AI_MODULE_DISABLED',
    severity: 'medium',
    details: { tenantId, aiModule: mod, enabled },
    timestamp: new Date(),
  });

  logger.info(`[AIToggle] ${mod} → ${enabled ? 'ON' : 'OFF'} pour ${tenantId}`);
  return NextResponse.json({ success: true, tenantId, module: mod, enabled, label: AI_MODULES[mod].label });
}
