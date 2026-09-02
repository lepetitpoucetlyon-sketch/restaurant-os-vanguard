import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { MCCAIRegistry } from '@/kernel/ai/mcc';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';

interface DiagnoseBody {
  tenantId: string;
  description: string;
  screenshotUrl?: string;
}

interface DiagnosticResult {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  probableCause: string;
  recommendedFix: string;
  escalate: boolean;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const body = await req.json().catch(() => null) as DiagnoseBody | null;
  if (!body?.tenantId?.trim() || !body?.description?.trim()) {
    return NextResponse.json({ error: 'tenantId et description requis' }, { status: 400 });
  }

  const tenantId = body.tenantId.trim();
  const description = body.description.trim();

  const { ChangelogService } = await import('@/lib/mcc/ChangelogService');
  const recentHistory = await ChangelogService.getRecentContextForAI(tenantId, 10);

  const systemPrompt = MCCAIRegistry.composePrompt('diagnose', {
    tenantId,
  });

  const userPrompt = `Analyse ce problème signalé par un opérateur.
Tenant : ${tenantId}
Description : ${description}
${body.screenshotUrl ? `Screenshot : ${body.screenshotUrl}` : ''}

Historique récent des modifications & interventions (Registre Dev / IA / Flotte) :
${recentHistory}

Retourne UNIQUEMENT un objet JSON valide avec ces champs :
{
  "severity": "critical" | "high" | "medium" | "low",
  "category": "string (ex: POS, Fiscal, Réseau, Auth, Stocks, KDS, RH, HACCP)",
  "probableCause": "string — cause technique concise",
  "recommendedFix": "string — étapes de résolution en français",
  "escalate": boolean
}`;

  let raw = '';
  try {
    const response = await MCCAIRegistry.provider.generateText({
      model: MCCAIRegistry.activeModel,
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      maxTokens: 512,
    });
    raw = response.text;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur IA';
    logger.error('[support-ai] MCC LLM failure', { error: msg });

    // R8 — Alerte critique, jamais silencieux
    await OpsAlertGateway.send({
      title: 'Support AI Diagnose Failure',
      message: `Échec du diagnostic IA pour tenant ${body.tenantId}: ${msg}`,
      severity: 'critical',
      source: 'support-ai-diagnose',
      context: { tenantId: body.tenantId },
    });

    return NextResponse.json({ error: `Erreur IA: ${msg}` }, { status: 502 });
  }

  let diagnostic: DiagnosticResult;
  try {
    const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    diagnostic = JSON.parse(clean) as DiagnosticResult;
  } catch {
    logger.error('[support-ai] Failed to parse LLM response', { raw });
    return NextResponse.json({ error: 'Réponse IA non parseable' }, { status: 502 });
  }

  const ticketId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await Nexus.adapter.set(`mcc/supportTickets/${ticketId}`, {
    id: ticketId,
    tenantId: body.tenantId.trim(),
    description: body.description.trim(),
    screenshotUrl: body.screenshotUrl ?? null,
    diagnostic,
    createdAt,
    createdBy: caller.uid,
    escalated: false,
  });

  logger.info(`[support-ai] Ticket ${ticketId} for tenant ${body.tenantId} (by ${caller.uid})`);
  return NextResponse.json({ ticketId, diagnostic, createdAt }, { status: 201 });
}
