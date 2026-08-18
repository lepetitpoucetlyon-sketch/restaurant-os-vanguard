/**
 * AI Provider Router — multi-provider fallback & agnostique
 *
 * Route les requêtes IA selon la hiérarchie configurée :
 * 1. Sovereign SLM (si serveur GPU local/vLLM configuré)
 * 2. Gemini (Google Vertex / AI Studio)
 * 3. Claude (Anthropic API)
 * 4. OpenAI (GPT-4o)
 * 5. Mistral (Mistral AI)
 *
 * Usage:
 *   const router = new AIProviderRouter();
 *   const result = await router.generateText(prompt, tenantId);
 */
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";
import { createLLMProvider, AIProviderName } from './LLMProviderFactory';

export interface AIResponse {
  text:     string;
  provider: AIProviderName | string;
  model:    string;
  fallback: boolean;
}

export interface AIProviderOptions {
  maxTokens?: number;
  temperature?: number;
  contextScope?: { userId?: string; scope?: string };
  preferredProvider?: AIProviderName;
}

export class AIProviderRouter {
  async generateText(
    prompt: string,
    tenantId: string,
    opts: AIProviderOptions = {},
  ): Promise<AIResponse> {
    try {
      const { NexusEventBus } = await import('@/shared/eventBus/NexusEventBus');
      NexusEventBus.emit('ai.query_received', {
        v: 1,
        tenantId,
        userId: opts.contextScope?.userId ?? 'system_oracle',
        query: prompt.slice(0, 200),
        contextScope: opts.contextScope?.scope ?? 'general',
      });
    } catch {
      // EventBus non bloquant
    }

    const priorityChain: AIProviderName[] = opts.preferredProvider
      ? [opts.preferredProvider, 'sovereign', 'gemini', 'anthropic', 'openai', 'mistral']
      : ['sovereign', 'gemini', 'anthropic', 'openai', 'mistral'];

    // Élimine les doublons tout en gardant l'ordre
    const uniqueChain = Array.from(new Set(priorityChain));
    let lastError: Error | null = null;
    let isFirst = true;

    for (const providerName of uniqueChain) {
      if (!this.isProviderConfigured(providerName)) continue;

      try {
        const provider = createLLMProvider(providerName);
        const response = await provider.generateText({
          model: '', // Auto-résolu par le provider
          userPrompt: prompt,
          maxTokens: opts.maxTokens,
          temperature: opts.temperature,
        });

        return {
          text: response.text,
          provider: providerName,
          model: providerName,
          fallback: !isFirst,
        };
      } catch (err) {
        lastError = toError(err);
        logger.warn(`[AIRouter] Échec provider ${providerName} (${lastError.message.slice(0, 80)}) — essai provider suivant`);
        isFirst = false;
      }
    }

    logger.error(`[AIRouter] Aucun provider IA disponible ou fonctionnel pour tenant ${tenantId}`);
    throw new Error(`Tous les providers IA ont échoué. Dernière erreur : ${lastError?.message ?? 'Aucune clé API configurée'}`);
  }

  private isProviderConfigured(provider: AIProviderName): boolean {
    switch (provider) {
      case 'sovereign':
        return !!(process.env.SOVEREIGN_SLM_URL || process.env.VLLM_BASE_URL);
      case 'ollama':
        return !!process.env.OLLAMA_BASE_URL;
      case 'gemini':
        return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY);
      case 'anthropic':
        return !!process.env.ANTHROPIC_API_KEY;
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      case 'mistral':
        return !!process.env.MISTRAL_API_KEY;
      default:
        return false;
    }
  }
}

export const aiRouter = new AIProviderRouter();
