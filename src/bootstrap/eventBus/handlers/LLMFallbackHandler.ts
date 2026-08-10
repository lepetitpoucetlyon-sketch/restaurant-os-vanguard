import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/**
 * Chaîne de fallback modèle LLM.
 * Si attemptCount dépasse la longueur de la chaîne, le dernier modèle est utilisé.
 */
const FALLBACK_CHAIN = ['gemini-1.5-flash', 'gemini-1.5-pro', 'claude-haiku-4-5-20251001'] as const;

/**
 * LLMFallbackHandler (P08-J)
 * Écoute llm.timeout et orchestre le fallback automatique vers un modèle
 * de substitution selon la chaîne FALLBACK_CHAIN.
 *
 * L'événement oracle.query est réémis avec le modèle fallback sélectionné.
 */
export function registerLLMFallbackHandler(): () => void {
  return NexusEventBus.on(
    'llm.timeout',
    async (payload) => {
      const { tenantId, requestId, model, prompt, attemptCount } = payload;

      const nextModel = FALLBACK_CHAIN[attemptCount] ?? FALLBACK_CHAIN[FALLBACK_CHAIN.length - 1];
      const now = new Date().toISOString();

      // Persistance de la tentative de retry LLM
      await Nexus.adapter.set(
        `tenants/${tenantId}/llm/retries/RETRY-${requestId}`,
        {
          requestId,
          originalModel: model,
          fallbackModel: nextModel,
          prompt,
          attemptCount,
          status: 'queued',
          createdAt: now,
        },
      );

      // Réémettre la requête vers le modèle fallback via oracle.query
      await NexusEventBus.emitDurable('oracle.query', {
        v: 1,
        tenantId,
        requestId,
        model: nextModel,
        prompt,
        isFallback: true,
      });

      logger.warn(
        `[LLMFallback] Timeout sur ${model} (tentative ${attemptCount}) — fallback vers ${nextModel} pour requête ${requestId}`,
      );

      empireAudit.log({
        module: 'orchestration',
        action: 'LLM_FALLBACK_TRIGGERED',
        details: { originalModel: model, fallbackModel: nextModel, attemptCount, requestId },
        severity: 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'llm-fallback', priority: 'BACKGROUND' },
  );
}
