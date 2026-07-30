/**
 * StrategyOracle API — mcc-ai-4
 *
 * Génère un briefing stratégique empire à partir des vraies données géo + santé.
 * S'appuie sur MacroBrain.analyzeFleet() + AIProviderRouter (Gemini → Claude fallback).
 *
 * GET /api/admin/intelligence/strategy-oracle  — briefing pour toute la flotte
 * POST /api/admin/intelligence/strategy-oracle — briefing ciblé avec contexte custom
 *   Body: { tenantIds?: string[]; focus?: string }
 *
 * Données utilisées :
 *   - tenantConfig.healthScore (calculé par health-score endpoint)
 *   - tenantConfig.dataRegion.label (géo)
 *   - tenantConfig.billing.status
 *   - tenantConfig.aiModules (modules actifs)
 *   - Résultat MacroBrain.getConsolidatedMetrics (depuis fleet instances)
 *
 * Protégé : mcc_support.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { aiRouter } from '@/modules/intelligence';
import { logger } from '@/lib/logger';

interface TenantSnapshot {
  tenantId:     string;
  name:         string;
  healthScore:  number | null;
  region:       string;
  billing:      string;
  aiModules:    string[];
}

async function collectTenantSnapshot(tenantId: string): Promise<TenantSnapshot> {
  const cfg = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as Record<string, unknown> | null;
  const billing = (cfg as { billing?: { status?: string } } | null)?.billing;
  const region  = (cfg as { dataRegion?: { label?: string } } | null)?.dataRegion;
  const aiMods  = (cfg as { aiModules?: Record<string, boolean> } | null)?.aiModules ?? {};

  return {
    tenantId,
    name:         (cfg as { name?: string } | null)?.name ?? tenantId,
    healthScore:  (cfg as { healthScore?: number } | null)?.healthScore ?? null,
    region:       region?.label ?? 'Non définie',
    billing:      billing?.status ?? 'unknown',
    aiModules:    Object.entries(aiMods).filter(([, v]) => v).map(([k]) => k),
  };
}

function buildOraclePrompt(snapshots: TenantSnapshot[], focus?: string): string {
  const fleet = snapshots.map(s =>
    `- ${s.name} [${s.region}] score:${s.healthScore ?? 'N/A'} billing:${s.billing} IA:[${s.aiModules.join(',')}]`
  ).join('\n');

  return `Tu es l'Oracle Stratégique d'un empire SaaS de restauration (${snapshots.length} restaurants).
Analyse les données réelles de la flotte et génère 3 priorités stratégiques immédiates.

FLOTTE:
${fleet}

${focus ? `FOCUS DEMANDÉ: ${focus}\n` : ''}
Réponds en JSON: { "priorities": [{ "rank": 1, "title": string, "reasoning": string, "action": string }] }
Maximum 3 priorités. Sois concis et actionnable.`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;
  const snapshots = await Promise.all(
    instances.slice(0, 20).map(i => collectTenantSnapshot(i.id ?? ''))
  );

  const prompt = buildOraclePrompt(snapshots);

  try {
    const result = await aiRouter.generateText(prompt, 'mcc', { maxTokens: 800, temperature: 0.4 });
    let priorities: unknown[] = [];
    try {
      const parsed = JSON.parse(result.text) as { priorities?: unknown[] };
      priorities = parsed.priorities ?? [];
    } catch {
      priorities = [{ rank: 1, title: 'Analyse indisponible', reasoning: result.text, action: 'Réessayer' }];
    }

    logger.info(`[StrategyOracle] Briefing généré via ${result.provider} pour ${snapshots.length} tenants`);
    return NextResponse.json({
      priorities,
      provider:       result.provider,
      model:          result.model,
      tenantCount:    snapshots.length,
      generatedAt:    new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[StrategyOracle] GET — AI provider indisponible', err);
    return NextResponse.json({ error: 'Service IA temporairement indisponible' }, { status: 503 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  let body: { tenantIds?: string[]; focus?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let targetIds: string[];
  if (body.tenantIds?.length) {
    targetIds = body.tenantIds;
  } else {
    const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;
    targetIds = instances.slice(0, 20).map(i => i.id ?? '').filter(Boolean);
  }

  const snapshots = await Promise.all(targetIds.map(id => collectTenantSnapshot(id)));
  const prompt    = buildOraclePrompt(snapshots, body.focus);

  try {
    const result = await aiRouter.generateText(prompt, 'mcc', { maxTokens: 1024, temperature: 0.4 });
    let priorities: unknown[] = [];
    try {
      const parsed = JSON.parse(result.text) as { priorities?: unknown[] };
      priorities = parsed.priorities ?? [];
    } catch {
      priorities = [{ rank: 1, title: 'Analyse brute', reasoning: result.text, action: 'Voir details' }];
    }

    return NextResponse.json({
      priorities,
      provider:    result.provider,
      model:       result.model,
      tenantCount: snapshots.length,
      focus:       body.focus ?? null,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[StrategyOracle] POST — AI provider indisponible', err);
    return NextResponse.json({ error: 'Service IA temporairement indisponible' }, { status: 503 });
  }
}
