/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { NexusEventBus, NexusEventPayload } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { GeminiProvider, AI_MODELS } from '@/modules/intelligence';
import { ChangelogService } from '@/lib/mcc/ChangelogService';
import { TenantConfigSchema } from '@/modules/system';
import { SupportDraftSchema } from '@/shared/schemas';
import { toError } from "@/lib/toError";

const SYSTEM_PROMPT = `Tu es un agent SAV L0 pour Restaurant OS, un logiciel tout-en-un de gestion de restaurant (POS, KDS, réservations, stocks, comptabilité NF525, HACCP, RH). Un opérateur restaurant vient de soumettre une requête depuis sa propre plateforme. Tu analyses cette requête à la lumière du contexte réel de son instance (version, modules actifs, overrides) et tu prépares un BROUILLON structuré — jamais une action appliquée directement. Un opérateur MCC validera, corrigera ou refusera ce brouillon.`;

/**
 * Contexte réduit injecté dans le prompt : uniquement ce qui aide au
 * diagnostic, jamais de secrets (clés API, credentials Firebase).
 */
function buildContextSnapshot(tenantId: string, rawConfig: unknown): string {
  const parsed = TenantConfigSchema.safeParse(rawConfig);
  if (!parsed.success) {
    logger.warn(`[SupportTicketAnalysis] tenantConfig invalide pour ${tenantId} — contexte partiel`);
    return JSON.stringify({ tenantId, warning: 'tenantConfig non disponible ou invalide' });
  }
  const cfg = parsed.data;
  return JSON.stringify({
    tenantId,
    tier: cfg.tier,
    billingPlan: cfg.billing?.plan,
    enabledModules: cfg.marketplace?.enabledModules ?? [],
    capabilities: cfg.capabilities ?? {},
    features: cfg.features ?? {},
    customFeatures: cfg.customFeatures ?? {},
    overrides: cfg.overrides ?? {},
    status: cfg.status ? {
      maintenanceMode: cfg.status.maintenanceMode,
      targetVersion:   cfg.status.targetVersion,
      targetState:     cfg.status.targetState,
      licenceStatus:   cfg.status.licenceStatus,
    } : undefined,
  });
}

function buildUserPrompt(description: string, screenshotUrl: string | undefined, contextSnapshot: string): string {
  return `Requête opérateur : ${description}
${screenshotUrl ? `Screenshot : ${screenshotUrl}` : ''}

Contexte réel de l'instance du tenant :
${contextSnapshot}

Retourne UNIQUEMENT un objet JSON valide avec ces champs exacts :
{
  "kind": "config_patch" | "code_fix" | "evolution_proposal",
  "title": "string court (3-140 caractères)",
  "summary": "string — résumé du problème et de la résolution proposée",
  "rootCause": "string — cause technique probable (optionnel)",
  "proposedPatch": { /* uniquement si kind=config_patch : fragment de tenantConfig.overrides à merger, sinon omettre */ },
  "codeBrief": "string — brief pour un développeur si kind=code_fix ou evolution_proposal (optionnel)",
  "riskLevel": "low" | "medium" | "high",
  "autoApplicable": boolean,
  "confidence": number entre 0 et 1
}`;
}

async function analyze(payload: NexusEventPayload<'support.ticket_submitted'>): Promise<void> {
  const { ticketId, tenantId, description, screenshotUrl } = payload;
  const ticketPath = `mcc/supportTickets/${ticketId}`;

  await Nexus.adapter.set(ticketPath, { status: 'analyzing' }, { merge: true });

  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    await Nexus.adapter.set(ticketPath, {
      status: 'analysis_failed',
      analysisError: 'Configuration IA manquante (GEMINI_API_KEY)',
    }, { merge: true });
    logger.error(`[SupportTicketAnalysis] GEMINI_API_KEY absent — ticket ${ticketId} non analysé`);
    return;
  }

  try {
    const rawConfig = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`);
    const contextSnapshot = buildContextSnapshot(tenantId, rawConfig);
    const userPrompt = buildUserPrompt(description, screenshotUrl, contextSnapshot);

    const response = await new GeminiProvider().generateText({
      model: AI_MODELS.reasoning,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2,
      maxTokens: 1024,
      responseMimeType: 'application/json',
    });

    const clean = response.text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    let candidate: unknown;
    try {
      candidate = JSON.parse(clean);
    } catch {
      await Nexus.adapter.set(ticketPath, {
        status: 'analysis_failed',
        analysisError: 'Réponse IA non parseable en JSON',
      }, { merge: true });
      logger.error(`[SupportTicketAnalysis] JSON.parse a échoué pour ticket ${ticketId}`, clean);
      return;
    }

    const validated = SupportDraftSchema.safeParse(candidate);
    if (!validated.success) {
      await Nexus.adapter.set(ticketPath, {
        status: 'analysis_failed',
        analysisError: validated.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      }, { merge: true });
      logger.error(`[SupportTicketAnalysis] Sortie IA invalide pour ticket ${ticketId}`, validated.error.issues);
      return;
    }

    const draft = validated.data;
    await Nexus.adapter.set(ticketPath, { draft, status: 'draft_ready' }, { merge: true });

    await ChangelogService.record({
      tenantId,
      action: 'SUPPORT_DRAFT_GENERATED',
      key: `supportTickets.${ticketId}`,
      after: draft,
      description: draft.title,
      appliedBy: 'ai-agent:gemini',
      scope: 'tenant',
      category: 'CUSTOM',
    });

    logger.info(`[SupportTicketAnalysis] Brouillon généré pour ticket ${ticketId} (tenant ${tenantId})`);
  } catch (err) {
    await Nexus.adapter.set(ticketPath, {
      status: 'analysis_failed',
      analysisError: toError(err).message,
    }, { merge: true });
    logger.error(`[SupportTicketAnalysis] Échec analyse ticket ${ticketId}`, err);
    throw err;
  }
}

let registered = false;

/**
 * Enregistre le handler d'analyse IA sur NexusEventBus.
 * Appelé depuis la route API serveur elle-même (idempotent) — pas depuis
 * registerHandlers.ts, qui reste réservé au contexte client (voir NexusEventBus.ts).
 */
export function registerSupportTicketAnalysisHandler(): () => void {
  if (registered) return () => {};
  registered = true;
  return NexusEventBus.on('support.ticket_submitted', analyze, {
    id: 'support-ticket-analysis',
    priority: 'HIGH',
  });
}
