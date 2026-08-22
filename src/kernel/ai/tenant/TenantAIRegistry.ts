/**
 * TenantAIRegistry — Registre IA isolé pour le scope Tenant.
 *
 * RÈGLES :
 *   R1 — Ce fichier ne peut PAS être importé depuis app/api/admin/fleet/
 *   R3 — Résolution par tenant, jamais un singleton global
 *   R9 — Utilise les clés tenant (jamais MCC_LLM_*)
 *
 * Usage :
 *   const registry = await TenantAIRegistry.forTenant(tenantId);
 *   const result = await registry.provider.generateText({ ... });
 */

import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AIScopeGuard } from '../core/AIScopeGuard';
import { PromptComposer } from '../core/PromptComposer';
import { TenantProviderChain } from './TenantProviderChain';
import { TenantLLMTelemetry } from './TenantLLMTelemetry';
import { TENANT_SYSTEM_PROMPTS, type TenantPromptId } from './TENANT_SYSTEM_PROMPTS';
import type { ILLMProvider, LLMTextRequest, LLMTextResponse, LLMVisionRequest, TenantAISettings, AIProviderName, VerticalAIPrompts } from '../core/types';

const REGISTRY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedInstance {
    registry: TenantAIRegistryInstance;
    cachedAt: number;
}

/**
 * Provider wrappé avec télémétrie tenant.
 */
class TenantProviderWrapper implements ILLMProvider {
    constructor(
        private inner: ILLMProvider,
        private tenantId: string,
        private providerName: AIProviderName,
        private callerModule: string,
    ) {}

    async generateText(request: LLMTextRequest): Promise<LLMTextResponse> {
        const start = Date.now();
        try {
            const response = await this.inner.generateText(request);
            TenantLLMTelemetry.record(this.tenantId, {
                callerModule: this.callerModule,
                provider: this.providerName,
                model: request.model || this.providerName,
                inputTokens: response.usage?.promptTokens ?? 0,
                outputTokens: response.usage?.completionTokens ?? 0,
                latencyMs: Date.now() - start,
                success: true,
            }).catch(() => {});
            return response;
        } catch (err) {
            TenantLLMTelemetry.record(this.tenantId, {
                callerModule: this.callerModule,
                provider: this.providerName,
                model: request.model || this.providerName,
                inputTokens: 0,
                outputTokens: 0,
                latencyMs: Date.now() - start,
                success: false,
                error: err instanceof Error ? err.message : String(err),
            }).catch(() => {});
            throw err;
        }
    }

    async generateFromImage(request: LLMVisionRequest): Promise<LLMTextResponse> {
        const start = Date.now();
        try {
            const response = await this.inner.generateFromImage(request);
            TenantLLMTelemetry.record(this.tenantId, {
                callerModule: this.callerModule,
                provider: this.providerName,
                model: request.model || this.providerName,
                inputTokens: response.usage?.promptTokens ?? 0,
                outputTokens: response.usage?.completionTokens ?? 0,
                latencyMs: Date.now() - start,
                success: true,
            }).catch(() => {});
            return response;
        } catch (err) {
            TenantLLMTelemetry.record(this.tenantId, {
                callerModule: this.callerModule,
                provider: this.providerName,
                model: request.model || this.providerName,
                inputTokens: 0,
                outputTokens: 0,
                latencyMs: Date.now() - start,
                success: false,
                error: err instanceof Error ? err.message : String(err),
            }).catch(() => {});
            throw err;
        }
    }
}

/**
 * Instance de registre pour un tenant spécifique.
 */
export class TenantAIRegistryInstance {
    private _providerWrapper: ILLMProvider;
    public readonly providerName: AIProviderName;
    public readonly activeModel: string;
    public readonly tenantId: string;
    private _verticalPrompts: VerticalAIPrompts | undefined;

    constructor(
        tenantId: string,
        innerProvider: ILLMProvider,
        providerName: AIProviderName,
        model: string,
        verticalPrompts?: VerticalAIPrompts,
        callerModule = 'tenant',
    ) {
        this.tenantId = tenantId;
        this.providerName = providerName;
        this.activeModel = model;
        this._verticalPrompts = verticalPrompts;
        this._providerWrapper = new TenantProviderWrapper(
            innerProvider,
            tenantId,
            providerName,
            callerModule,
        );
    }

    get provider(): ILLMProvider {
        return this._providerWrapper;
    }

    /**
     * Compose un prompt tenant avec le layer vertical automatique.
     */
    composePrompt(
        promptId: TenantPromptId,
        tenantContext?: Record<string, unknown>,
    ): string {
        const promptDef = TENANT_SYSTEM_PROMPTS[promptId];
        return PromptComposer.composeTenant({
            base: promptDef.base,
            verticalLayer: this._verticalPrompts,
            tenantContext,
        });
    }
}

/**
 * TenantAIRegistry — Factory de registres IA par tenant.
 */
export class TenantAIRegistry {
    private static cache: Map<string, CachedInstance> = new Map();

    /**
     * Retourne une instance de registre IA pour un tenant.
     * Lazy-résolution depuis tenantConfig.aiSettings.
     * Cache de 5 minutes pour éviter les lectures Nexus répétées.
     */
    static async forTenant(
        tenantId: string,
        callerModule = 'tenant',
        context: 'reasoning' | 'fast' | 'vision' = 'fast',
    ): Promise<TenantAIRegistryInstance> {
        // R1 — Vérification scope
        AIScopeGuard.assertTenantScope(callerModule);

        const cacheKey = `${tenantId}:${context}`;
        const cached = TenantAIRegistry.cache.get(cacheKey);
        if (cached && Date.now() - cached.cachedAt < REGISTRY_CACHE_TTL_MS) {
            return cached.registry;
        }

        // Lecture tenantConfig depuis Nexus
        let aiSettings: TenantAISettings | null = null;
        let verticalPrompts: VerticalAIPrompts | undefined;

        try {
            const tenantConfig = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as Record<string, unknown> | null;
            if (tenantConfig?.aiSettings) {
                aiSettings = tenantConfig.aiSettings as TenantAISettings;
            } else if (tenantConfig?.ai) {
                // Backward compat : ancien champ ai minimal (@deprecated)
                const legacyAi = tenantConfig.ai as { enabled?: boolean; model?: string };
                if (legacyAi.enabled) {
                    aiSettings = {
                        mode: 'cloud',
                        providers: {
                            reasoning: { provider: 'gemini', model: legacyAi.model ?? '' },
                            fast: { provider: 'gemini', model: legacyAi.model ?? '' },
                            vision: { provider: 'gemini', model: '' },
                        },
                        fallbackChain: ['gemini', 'anthropic'],
                    };
                }
            }

            // Chargement des prompts verticaux si variant disponible
            if (tenantConfig?.variant) {
                try {
                    const bp = await import(
                        `@/verticals/${tenantConfig.variant}/${tenantConfig.variant}.blueprint`
                    ) as { [key: string]: { aiPrompts?: VerticalAIPrompts } };
                    const bpKey = Object.keys(bp).find(k => k.includes('BLUEPRINT'));
                    if (bpKey && bp[bpKey]?.aiPrompts) {
                        verticalPrompts = bp[bpKey].aiPrompts;
                    }
                } catch {
                    // Blueprint non disponible ou pas d'aiPrompts encore (pré-Phase D)
                }
            }
        } catch (err) {
            logger.warn(`[TenantAIRegistry] Impossible de lire tenantConfig pour ${tenantId}`, {
                error: err instanceof Error ? err.message : String(err),
            });
        }

        // Résolution du provider
        const chain = new TenantProviderChain(tenantId, aiSettings);
        const { provider, name: rawName, model } = chain.resolve(context);
        const name = ((rawName as string) === 'auto' ? 'gemini' : rawName) as AIProviderName;

        const instance = new TenantAIRegistryInstance(
            tenantId,
            provider,
            name,
            model,
            verticalPrompts,
            callerModule,
        );

        TenantAIRegistry.cache.set(cacheKey, { registry: instance, cachedAt: Date.now() });
        logger.info(`[TenantAIRegistry] Instance créée pour tenant ${tenantId} (${name}, ${context})`);

        return instance;
    }

    /** Invalide le cache pour un tenant (ex: après mise à jour aiSettings). */
    static invalidate(tenantId: string): void {
        for (const key of TenantAIRegistry.cache.keys()) {
            if (key.startsWith(`${tenantId}:`)) {
                TenantAIRegistry.cache.delete(key);
            }
        }
    }

    /** Vide tout le cache (tests/reset). */
    static resetCache(): void {
        TenantAIRegistry.cache.clear();
    }

    /** Taille du cache (monitoring). */
    static get cacheSize(): number {
        return TenantAIRegistry.cache.size;
    }
}
