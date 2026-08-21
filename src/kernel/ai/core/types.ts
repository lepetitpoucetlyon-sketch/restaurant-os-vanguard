/**
 * kernel/ai/core/types.ts — Types fondamentaux du kernel IA.
 *
 * Zéro import de modules/, verticals/, app/.
 * Consommé par : kernel/ai/mcc, kernel/ai/tenant, modules (via barrel).
 */

/** Noms de providers IA supportés par la plateforme. */
export type AIProviderName =
    | 'gemini'
    | 'anthropic'
    | 'openai'
    | 'mistral'
    | 'sovereign'
    | 'ollama';

/** Scope d'exécution IA — MCC ou Tenant. Jamais les deux. */
export type AIScope = 'mcc' | 'tenant';

/** Configuration d'un provider IA (par contexte : reasoning, fast, vision). */
export interface AIProviderConfig {
    provider: AIProviderName;
    model: string;
    apiKey?: string;
    baseUrl?: string;
}

/** Contexte d'un appel IA — passé à la télémétrie et au scope guard. */
export interface AICallContext {
    scope: AIScope;
    callerModule: string;
    tenantId?: string;
    /** Identifiant du prompt utilisé (ex: 'diagnose', 'assistant'). */
    promptId?: string;
}

/** Résultat de télémétrie d'un appel LLM. */
export interface AITelemetryRecord {
    callerModule: string;
    provider: AIProviderName;
    model: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    timestamp: string;
    success: boolean;
    error?: string;
}

/**
 * Mode de fonctionnement IA d'un tenant.
 * - cloud   : providers cloud uniquement (Gemini, Claude, GPT, Mistral)
 * - souverain : SLM local uniquement (sovereign/ollama)
 * - mix     : cloud + sovereign fallback autorisé
 */
export type AIMode = 'cloud' | 'souverain' | 'mix';

/** Configuration IA enrichie d'un tenant (Layer 4). */
export interface TenantAISettings {
    mode: AIMode;
    providers: {
        reasoning: AIProviderConfig;
        fast: AIProviderConfig;
        vision: AIProviderConfig;
    };
    fallbackChain: AIProviderName[];
    quotas?: {
        monthlyTokens?: number;
        alertThreshold?: number;
    };
    overridePrompts?: Record<string, string>;
}

/**
 * Bloc aiPrompts d'un VerticalBlueprint (Layer 3).
 * Injecté par PromptComposer dans les prompts tenant.
 */
export interface VerticalAIPrompts {
    /** Persona système de l'assistant vertical. */
    systemPersona: string;
    /** Vocabulaire métier clé→exemples. */
    vocabulary: Record<string, string>;
    /** Few-shot examples optionnels. */
    examples?: Array<{ user: string; assistant: string }>;
    /** Actions interdites pour ce métier. */
    forbiddenActions?: string[];
    /** Contexte compliance (NF525, HACCP, HDS, RGPD-santé…). */
    complianceContext?: string;
}
