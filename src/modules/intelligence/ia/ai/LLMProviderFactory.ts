/**
 * LLMProviderFactory — sélection du provider IA par env var.
 *
 * AI_PROVIDER=gemini     → GeminiProvider  (défaut si GEMINI_API_KEY présent)
 * AI_PROVIDER=anthropic  → AnthropicProvider
 * AI_PROVIDER=openai     → OpenAIProvider
 * AI_PROVIDER=auto       → Gemini si clé présente, sinon Claude, sinon OpenAI
 *
 * Tous les providers implémentent ILLMProvider → le code appelant est 100% agnostique.
 */

import type { ILLMProvider } from './types';
import { GeminiProvider } from '../GeminiProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { logger } from '@/lib/logger';

export type AIProviderName = 'gemini' | 'anthropic' | 'openai' | 'auto';

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
    auto: {
        fast: 'auto',
        reasoning: 'auto',
        'vision-fast': 'auto',
        'vision-pro': 'auto',
    },
};

/**
 * Résout l'alias sémantique vers l'ID modèle du provider actif.
 * Permet d'écrire AI_MODELS.fast partout sans connaître le provider.
 */
export function resolveModelId(alias: string, provider: AIProviderName = detectProvider()): string {
    return MODEL_REGISTRY[provider]?.[alias] ?? alias;
}

function detectProvider(): AIProviderName {
    const declared = (process.env.AI_PROVIDER ?? 'auto') as AIProviderName;
    if (declared !== 'auto') return declared;

    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY) return 'gemini';
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    if (process.env.OPENAI_API_KEY) return 'openai';
    return 'gemini'; // fallback (échouera avec erreur explicite si pas de clé)
}

export function createLLMProvider(): ILLMProvider {
    const provider = detectProvider();
    logger.info(`[LLMProviderFactory] Provider actif: ${provider}`);

    switch (provider) {
        case 'anthropic': return new AnthropicProvider();
        case 'openai': return new OpenAIProvider();
        case 'gemini':
        default: return new GeminiProvider();
    }
}

// Modèles agnostiques pour le code appelant
export const AI_MODELS = {
    fast: resolveModelId('fast'),
    reasoning: resolveModelId('reasoning'),
    visionFast: resolveModelId('vision-fast'),
    visionPro: resolveModelId('vision-pro'),
} as const;
