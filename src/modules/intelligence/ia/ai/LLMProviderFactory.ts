/**
 * LLMProviderFactory — sélection du provider IA par env var ou paramètre dynamique.
 *
 * Architecture 100% LLM-Agnostique :
 * AI_PROVIDER=sovereign   → SovereignProvider (vLLM local / GPU privé / Gemma / Qwen fine-tuné)
 * AI_PROVIDER=gemini      → GeminiProvider (Google Gemini 1.5/2.0)
 * AI_PROVIDER=anthropic   → AnthropicProvider (Claude 3.5 / Haiku)
 * AI_PROVIDER=openai      → OpenAIProvider (GPT-4o, GPT-4o-mini)
 * AI_PROVIDER=mistral     → MistralProvider (Mistral Large / Pixtral)
 * AI_PROVIDER=ollama      → SovereignProvider pointant vers localhost:11434
 * AI_PROVIDER=auto        → Cascade automatique (Sovereign → Gemini → Claude → OpenAI)
 *
 * Tous les providers implémentent ILLMProvider → le code appelant est 100% agnostique.
 */

import type { ILLMProvider } from './types';
import { GeminiProvider } from './GeminiProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { SovereignProvider } from './SovereignProvider';
import { MistralProvider } from './MistralProvider';
import { logger } from '@/lib/logger';

export type AIProviderName = 'gemini' | 'anthropic' | 'openai' | 'mistral' | 'sovereign' | 'ollama' | 'auto';

// Model aliases agnostiques — chaque provider les mappe vers ses propres IDs
export const AGNOSTIC_MODEL_ALIASES = {
    fast: 'fast',
    reasoning: 'reasoning',
    visionFast: 'vision-fast',
    visionPro: 'vision-pro',
} as const;

// Résolution des model aliases par provider
const MODEL_REGISTRY: Record<AIProviderName, Record<string, string>> = {
    gemini: {
        fast: 'gemini-1.5-flash',
        reasoning: 'gemini-1.5-pro',
        'vision-fast': 'gemini-2.0-flash',
        'vision-pro': 'gemini-2.0-pro',
    },
    anthropic: {
        fast: 'claude-haiku-4-5-20251001',
        reasoning: 'claude-sonnet-4-6',
        'vision-fast': 'claude-haiku-4-5-20251001',
        'vision-pro': 'claude-sonnet-4-6',
    },
    openai: {
        fast: 'gpt-4o-mini',
        reasoning: 'gpt-4o',
        'vision-fast': 'gpt-4o-mini',
        'vision-pro': 'gpt-4o',
    },
    mistral: {
        fast: 'mistral-small-latest',
        reasoning: 'mistral-large-latest',
        'vision-fast': 'pixtral-12b-2409',
        'vision-pro': 'pixtral-large-latest',
    },
    sovereign: {
        fast: 'restaurant-os-slm-v1',
        reasoning: 'restaurant-os-slm-v1',
        'vision-fast': 'restaurant-os-slm-v1',
        'vision-pro': 'restaurant-os-slm-v1',
    },
    ollama: {
        fast: 'qwen2.5:3b',
        reasoning: 'qwen2.5:7b',
        'vision-fast': 'llama3.2-vision',
        'vision-pro': 'llama3.2-vision',
    },
    auto: {
        fast: 'auto',
        reasoning: 'auto',
        'vision-fast': 'auto',
        'vision-pro': 'auto',
    },
};

/**
 * Résout l'alias sémantique vers l'ID modèle du provider actif.
 * Permet d'écrire AI_MODELS.fast partout sans connaître le provider sous-jacent.
 */
export function resolveModelId(alias: string, provider: AIProviderName = detectProvider()): string {
    return MODEL_REGISTRY[provider]?.[alias] ?? alias;
}

export function detectProvider(): AIProviderName {
    const declared = (process.env.AI_PROVIDER ?? 'auto').toLowerCase() as AIProviderName;
    if (declared !== 'auto' && MODEL_REGISTRY[declared]) return declared;

    // Détection automatique intelligente
    if (process.env.SOVEREIGN_SLM_URL || process.env.VLLM_BASE_URL) return 'sovereign';
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY) return 'gemini';
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    if (process.env.OPENAI_API_KEY) return 'openai';
    if (process.env.MISTRAL_API_KEY) return 'mistral';
    return 'gemini'; // Fallback standard
}

export function createLLMProvider(overrideProvider?: AIProviderName): ILLMProvider {
    const provider = overrideProvider ?? detectProvider();
    logger.info(`[LLMProviderFactory] Instanciation du provider agnostique: ${provider}`);

    switch (provider) {
        case 'sovereign':
            return new SovereignProvider();
        case 'ollama':
            return new SovereignProvider(process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434/v1');
        case 'mistral':
            return new MistralProvider();
        case 'anthropic':
            return new AnthropicProvider();
        case 'openai':
            return new OpenAIProvider();
        case 'gemini':
        default:
            return new GeminiProvider();
    }
}

// Modèles agnostiques pour le code appelant
export const AI_MODELS = {
    fast: resolveModelId('fast'),
    reasoning: resolveModelId('reasoning'),
    visionFast: resolveModelId('vision-fast'),
    visionPro: resolveModelId('vision-pro'),
} as const;
