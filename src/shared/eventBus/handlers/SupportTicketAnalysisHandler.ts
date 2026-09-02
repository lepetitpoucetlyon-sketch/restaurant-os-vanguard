 
import { NexusEventBus, NexusEventPayload } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { MCCAIRegistry } from '@/kernel/ai/mcc';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';
import { ChangelogService } from '@/lib/mcc/ChangelogService';
import { TenantConfigSchema } from '@/modules/system';
import { SupportDraftSchema } from '@/shared/schemas';
import { toError } from "@/lib/toError";

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

function buildUserPrompt(description: string, screenshotUrl: string | undefined, contextSnapshot: string, recentHistory: string): string {
  return `Requête opérateur : ${description}
${screenshotUrl ? `Screenshot : ${screenshotUrl}` : ''}

Contexte réel de l'instance du tenant :
${contextSnapshot}

Historique récent des modifications & interventions (Registre Dev / IA / Flotte) :
${recentHistory}

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

  try {
    const [rawConfig, recentHistory] = await Promise.all([
      Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`),
      ChangelogService.getRecentContextForAI(tenantId, 10),
    ]);
    const contextSnapshot = buildContextSnapshot(tenantId, rawConfig);

    const systemPrompt = MCCAIRegistry.composePrompt('supportDraft', {
      tenantId,
    });
    const userPrompt = buildUserPrompt(description, screenshotUrl, contextSnapshot, recentHistory);

    let rawText = '';
    try {
      const response = await MCCAIRegistry.provider.generateText({
        model: MCCAIRegistry.activeModel,
        systemPrompt,
        userPrompt,
        temperature: 0.2,
        maxTokens: 1024,
        responseMimeType: 'application/json',
      });
      rawText = response.text;
    } catch (llmErr) {
      // R8 — Alerte critique, jamais silencieux
      await OpsAlertGateway.send({
        title: 'Support Ticket Analysis LLM Failure',
        message: `Échec analyse ticket ${ticketId} pour tenant ${tenantId}: ${toError(llmErr).message}`,
        severity: 'critical',
        source: 'support-ticket-analysis',
        context: { ticketId, tenantId },
      });
      throw llmErr;
    }

    const clean = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
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
      appliedBy: `ai-agent:${MCCAIRegistry.activeProviderName}`,
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
