/**
 * TenantProviderChain — Chaîne de fallback provider pour le scope Tenant.
 *
 * Résout le provider depuis tenantConfig.aiSettings.
 * Valide la cohérence mode/provider (ex: mode souverain → refuse cloud).
 */

import { logger } from '@/lib/logger';
import { createLLMProvider } from '@/modules/intelligence';
import type { TenantAISettings, AIMode, AIProviderName, ILLMProvider } from '../core/types';

const CLOUD_PROVIDERS: AIProviderName[] = ['gemini', 'anthropic', 'openai', 'mistral'];
const SOVEREIGN_PROVIDERS: AIProviderName[] = ['sovereign', 'ollama'];

export class TenantProviderChain {
    private settings: TenantAISettings | null;
    private tenantId: string;

    constructor(tenantId: string, settings: TenantAISettings | null) {
        this.tenantId = tenantId;
        this.settings = settings;
    }

    /**
     * Résout le premier provider fonctionnel pour le tenant.
     * Respecte le mode (cloud/souverain/mix) du tenant.
     */
    resolve(context: 'reasoning' | 'fast' | 'vision' = 'fast'): {
        provider: ILLMProvider;
        name: AIProviderName;
        model: string;
    } {
        const mode: AIMode = this.settings?.mode ?? 'cloud';
        const fallbackChain = this.settings?.fallbackChain ?? this.defaultChainForMode(mode);

        for (const providerName of fallbackChain) {
            if (!this.isAllowedForMode(providerName, mode)) {
                logger.warn(
                    `[TenantProviderChain] Provider "${providerName}" ignoré : incompatible avec mode "${mode}" pour tenant ${this.tenantId}`,
                );
                continue;
            }

            if (!this.isProviderConfigured(providerName)) continue;

            try {
                const provider = createLLMProvider(providerName);
                const model = this.resolveModel(providerName, context);
                logger.info(`[TenantProviderChain] Provider tenant résolu: ${providerName} (${context}) pour ${this.tenantId}`);
                return { provider, name: providerName, model };
            } catch (err) {
                logger.warn(`[TenantProviderChain] Échec instanciation ${providerName}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        throw new Error(
            `[TenantProviderChain] AUCUN provider disponible pour tenant ${this.tenantId} (mode: ${mode}, chaîne: [${fallbackChain.join(', ')}]). Vérifier tenantConfig.aiSettings.`,
        );
    }

    private defaultChainForMode(mode: AIMode): AIProviderName[] {
        switch (mode) {
            case 'souverain': return ['sovereign', 'ollama'];
            case 'cloud': return ['gemini', 'anthropic', 'openai', 'mistral'];
            case 'mix': return ['sovereign', 'gemini', 'anthropic'];
        }
    }

    private isAllowedForMode(provider: AIProviderName, mode: AIMode): boolean {
        if (mode === 'souverain') return SOVEREIGN_PROVIDERS.includes(provider);
        if (mode === 'cloud') return CLOUD_PROVIDERS.includes(provider);
        return true; // mode 'mix' autorise tout
    }

    private isProviderConfigured(provider: AIProviderName): boolean {
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) return true;
        switch (provider) {
            case 'sovereign': return !!(process.env.SOVEREIGN_SLM_URL || process.env.VLLM_BASE_URL);
            case 'ollama': return !!process.env.OLLAMA_BASE_URL;
            case 'gemini':
                return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY);
            case 'anthropic':
                return Boolean(process.env.ANTHROPIC_API_KEY);
            case 'openai':
                return Boolean(process.env.OPENAI_API_KEY);
            case 'mistral':
                return Boolean(process.env.MISTRAL_API_KEY);
            default:
                return false;
        }
    }

    private resolveModel(provider: AIProviderName, context: 'reasoning' | 'fast' | 'vision'): string {
        const configured = this.settings?.providers?.[context];
        if (configured?.provider === provider && configured.model) {
            return configured.model;
        }
        return 'default';
    }
}
