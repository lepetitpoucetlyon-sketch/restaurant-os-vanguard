/**
 * MCCProviderChain — Chaîne de fallback provider pour le scope MCC.
 *
 * Lit MCC_LLM_FALLBACK_CHAIN depuis les env vars.
 * Instancie les providers en séquence, retourne le premier qui fonctionne.
 * AUCUN fallback vers un provider tenant autorisé (R9).
 */

import { logger } from '@/lib/logger';
import { createLLMProvider, type AIProviderName } from '@/modules/intelligence/ia/ai/LLMProviderFactory';
import type { ILLMProvider } from '@/modules/intelligence/ia/ai/types';

/** Providers MCC autorisés — jamais de provider tenant dans cette chaîne. */
const VALID_MCC_PROVIDERS: AIProviderName[] = [
    'sovereign', 'anthropic', 'gemini', 'openai', 'mistral', 'ollama',
];

export class MCCProviderChain {
    private chain: AIProviderName[];

    constructor() {
        const rawChain = process.env.MCC_LLM_FALLBACK_CHAIN ?? 'sovereign,anthropic';
        this.chain = rawChain
            .split(',')
            .map(s => s.trim().toLowerCase() as AIProviderName)
            .filter(p => VALID_MCC_PROVIDERS.includes(p));

        if (this.chain.length === 0) {
            this.chain = ['sovereign', 'anthropic'];
            logger.warn('[MCCProviderChain] Aucune chaîne valide dans MCC_LLM_FALLBACK_CHAIN — fallback par défaut: sovereign,anthropic');
        }
    }

    /** Retourne la liste ordonnée des providers dans la chaîne. */
    get providers(): readonly AIProviderName[] {
        return this.chain;
    }

    /**
     * Résout le premier provider fonctionnel dans la chaîne.
     * Throw si AUCUN provider n'est disponible (fail-fast, R8).
     */
    resolve(): { provider: ILLMProvider; name: AIProviderName } {
        for (const name of this.chain) {
            if (this.isProviderConfigured(name)) {
                try {
                    const provider = this.createMCCProvider(name);
                    logger.info(`[MCCProviderChain] Provider MCC résolu: ${name}`);
                    return { provider, name };
                } catch (err) {
                    logger.warn(`[MCCProviderChain] Échec instanciation ${name}: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
        }

        throw new Error(
            `[MCCProviderChain] AUCUN provider MCC disponible. Chaîne testée: [${this.chain.join(', ')}]. Vérifier les env vars MCC_LLM_*.`,
        );
    }

    /**
     * Crée un provider en utilisant les env vars MCC dédiées.
     * Override les env globales si des env MCC spécifiques existent.
     */
    private createMCCProvider(name: AIProviderName): ILLMProvider {
        // Injecter temporairement les env vars MCC dans les globales pour que
        // createLLMProvider() les utilise. Restaurer après.
        const envOverrides = this.getMCCEnvOverrides(name);
        const originals: Record<string, string | undefined> = {};

        for (const [key, value] of Object.entries(envOverrides)) {
            originals[key] = process.env[key];
            process.env[key] = value;
        }

        try {
            return createLLMProvider(name);
        } finally {
            // Restaurer les env originales
            for (const [key, orig] of Object.entries(originals)) {
                if (orig === undefined) {
                    delete process.env[key];
                } else {
                    process.env[key] = orig;
                }
            }
        }
    }

    /**
     * Retourne les overrides env pour un provider MCC.
     * Ex: MCC_LLM_ANTHROPIC_API_KEY → ANTHROPIC_API_KEY
     */
    private getMCCEnvOverrides(name: AIProviderName): Record<string, string> {
        const overrides: Record<string, string> = {};
        const upper = name.toUpperCase();

        const apiKey = process.env[`MCC_LLM_${upper}_API_KEY`];
        const model = process.env[`MCC_LLM_${upper}_MODEL`];
        const baseUrl = process.env[`MCC_LLM_${upper}_URL`] ?? process.env[`MCC_LLM_${upper}_BASE_URL`];

        // Mapping MCC env → env globales attendues par les providers existants
        switch (name) {
            case 'anthropic':
                if (apiKey) overrides['ANTHROPIC_API_KEY'] = apiKey;
                break;
            case 'gemini':
                if (apiKey) overrides['GEMINI_API_KEY'] = apiKey;
                break;
            case 'openai':
                if (apiKey) overrides['OPENAI_API_KEY'] = apiKey;
                break;
            case 'mistral':
                if (apiKey) overrides['MISTRAL_API_KEY'] = apiKey;
                break;
            case 'sovereign':
                if (baseUrl) overrides['SOVEREIGN_SLM_URL'] = baseUrl;
                if (model) overrides['SOVEREIGN_SLM_MODEL'] = model;
                break;
            case 'ollama':
                if (baseUrl) overrides['OLLAMA_BASE_URL'] = baseUrl;
                break;
        }

        return overrides;
    }

    private isProviderConfigured(name: AIProviderName): boolean {
        const upper = name.toUpperCase();
        // Vérifie les env MCC spécifiques d'abord, puis les globales en fallback
        switch (name) {
            case 'sovereign':
                return !!(process.env[`MCC_LLM_SOVEREIGN_URL`] || process.env.SOVEREIGN_SLM_URL || process.env.VLLM_BASE_URL);
            case 'anthropic':
                return !!(process.env[`MCC_LLM_ANTHROPIC_API_KEY`] || process.env.ANTHROPIC_API_KEY);
            case 'gemini':
                return !!(process.env[`MCC_LLM_GEMINI_API_KEY`] || process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY);
            case 'openai':
                return !!(process.env[`MCC_LLM_OPENAI_API_KEY`] || process.env.OPENAI_API_KEY);
            case 'mistral':
                return !!(process.env[`MCC_LLM_MISTRAL_API_KEY`] || process.env.MISTRAL_API_KEY);
            case 'ollama':
                return !!(process.env[`MCC_LLM_OLLAMA_URL`] || process.env.OLLAMA_BASE_URL);
            default:
                return false;
        }
    }
}
