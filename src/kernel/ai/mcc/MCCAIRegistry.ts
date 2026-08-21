/**
 * MCCAIRegistry — Registre IA isolé pour le scope MCC.
 *
 * RÈGLES ENFORÇABLES :
 *   R1 — Ce fichier ne peut PAS être importé depuis src/modules/
 *   R3 — Pas de singleton LLMManager.provider — résolution via ce registre
 *   R8 — Tout échec → OpsAlertGateway.send() avec severity critical
 *   R9 — Env vars MCC_LLM_* strictement disjointes des TENANT_LLM_*
 *
 * Usage :
 *   import { MCCAIRegistry } from '@/kernel/ai/mcc';
 *   const result = await MCCAIRegistry.provider.generateText({ ... });
 */

import { logger } from '@/lib/logger';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';
import type { ILLMProvider, LLMTextRequest, LLMTextResponse, LLMVisionRequest } from '@/modules/intelligence/ia/ai/types';
import { MCCProviderChain } from './MCCProviderChain';
import { MCCLLMTelemetry } from './MCCLLMTelemetry';
import { PromptComposer } from '../core/PromptComposer';
import { MCC_SYSTEM_PROMPTS, type MCCPromptId } from './MCC_SYSTEM_PROMPTS';

/**
 * Provider IA wrappé avec télémétrie et alerte MCC.
 * Intercepte chaque appel pour logger et alerter en cas d'échec.
 */
class MCCProviderWrapper implements ILLMProvider {
    constructor(
        private inner: ILLMProvider,
        private providerName: string,
    ) {}

    async generateText(request: LLMTextRequest): Promise<LLMTextResponse> {
        const start = Date.now();
        try {
            const response = await this.inner.generateText(request);
            const latencyMs = Date.now() - start;

            // Télémétrie non bloquante
            MCCLLMTelemetry.record({
                callerModule: 'mcc',
                provider: this.providerName as import('../core/types').AIProviderName,
                model: request.model || this.providerName,
                inputTokens: response.usage?.promptTokens ?? 0,
                outputTokens: response.usage?.completionTokens ?? 0,
                latencyMs,
                success: true,
            }).catch(() => {});

            return response;
        } catch (err) {
            const latencyMs = Date.now() - start;
            const message = err instanceof Error ? err.message : String(err);

            // Télémétrie d'échec
            MCCLLMTelemetry.record({
                callerModule: 'mcc',
                provider: this.providerName as import('../core/types').AIProviderName,
                model: request.model || this.providerName,
                inputTokens: 0,
                outputTokens: 0,
                latencyMs,
                success: false,
                error: message,
            }).catch(() => {});

            // R8 — Alerte critique, jamais silencieux
            OpsAlertGateway.send({
                title: 'MCC LLM Failure',
                message: `Provider ${this.providerName} a échoué: ${message}`,
                severity: 'critical',
                source: 'mcc-ai-registry',
                context: { provider: this.providerName, model: request.model },
            }).catch(() => {});

            throw err;
        }
    }

    async generateFromImage(request: LLMVisionRequest): Promise<LLMTextResponse> {
        const start = Date.now();
        try {
            const response = await this.inner.generateFromImage(request);
            MCCLLMTelemetry.record({
                callerModule: 'mcc',
                provider: this.providerName as import('../core/types').AIProviderName,
                model: request.model || this.providerName,
                inputTokens: response.usage?.promptTokens ?? 0,
                outputTokens: response.usage?.completionTokens ?? 0,
                latencyMs: Date.now() - start,
                success: true,
            }).catch(() => {});
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            OpsAlertGateway.send({
                title: 'MCC LLM Vision Failure',
                message: `Provider ${this.providerName} vision a échoué: ${message}`,
                severity: 'critical',
                source: 'mcc-ai-registry',
            }).catch(() => {});
            throw err;
        }
    }
}

class MCCAIRegistryClass {
    private _provider: ILLMProvider | null = null;
    private _providerName: string | null = null;
    private _chain: MCCProviderChain | null = null;

    /**
     * Retourne le provider IA MCC résolu.
     * Lazy-init : résout la chaîne au premier accès.
     * Throw si aucun provider MCC n'est disponible (fail-fast).
     */
    get provider(): ILLMProvider {
        if (!this._provider) {
            this.initProvider();
        }
        return this._provider!;
    }

    /** Nom du provider actif (pour UI dynamique). */
    get activeProviderName(): string {
        if (!this._providerName) this.initProvider();
        return this._providerName!;
    }

    /** Mode IA MCC (toujours déterminé par env). */
    get mode(): string {
        return process.env.MCC_LLM_PRIMARY_PROVIDER ?? 'sovereign';
    }

    /** Modèle actif. */
    get activeModel(): string {
        const provider = this.activeProviderName.toUpperCase();
        return process.env[`MCC_LLM_${provider}_MODEL`] ?? 'auto';
    }

    /**
     * Compose un prompt MCC à partir d'un promptId prédéfini.
     */
    composePrompt(promptId: MCCPromptId, context?: Record<string, unknown>): string {
        const promptDef = MCC_SYSTEM_PROMPTS[promptId];
        return PromptComposer.composeMCC({
            base: promptDef.base,
            context,
        });
    }

    /** Force la ré-initialisation du provider (utile après changement d'env). */
    reset(): void {
        this._provider = null;
        this._providerName = null;
        this._chain = null;
    }

    private initProvider(): void {
        if (!this._chain) {
            this._chain = new MCCProviderChain();
        }

        const { provider, name } = this._chain.resolve();
        this._provider = new MCCProviderWrapper(provider, name);
        this._providerName = name;

        logger.info(`[MCCAIRegistry] Provider MCC initialisé: ${name}`);
    }
}

/** Singleton MCCAIRegistry — scope MCC exclusif. */
export const MCCAIRegistry = new MCCAIRegistryClass();
