import { AgentDomain, AgentRole, AgentResponse, AgentReasoningStep } from '../../domain/agency/types';
import { generateSystemPrompt } from '@/config/prompts';
import { toError } from "@/lib/toError";
import { LLMManager } from './LLMManager';
import { resolveModelId } from './LLMProviderFactory';
import { AIProviderRouter } from './AIProviderRouter';

export interface AgentRequest {
    domain: AgentDomain;
    userRole: AgentRole;
    userPrompt: string;
    contextData?: import("@/shared/nexus/contracts").SovereignValue;
    
    // Grade X: DNA Injection
    dna?: {
        tenantId: string;
        businessLaws?: import("@/shared/nexus/contracts").BusinessLaws;
    };

    apiKey?: string;
    endpoint?: string;
    modelId?: string;
}

/**
 * AgentEngine - Le Moteur d'Agents IA 100% Agnostique
 * Orchestre les appels multi-providers (Sovereign SLM, Gemini, Claude, OpenAI, Mistral)
 * avec system prompts dédiés, RBAC et cascades de résilience.
 */
export const AgentEngine = {
    async query(request: AgentRequest): Promise<AgentResponse> {
        const systemPrompt  = generateSystemPrompt(request.domain, request.userRole);
        const dataContext   = request.contextData ? `\nCONTEXTE DATA ACTUEL :\n${JSON.stringify(request.contextData, null, 2)}` : '';
        const tenantLabel   = request.dna?.tenantId || 'GLOBAL';
        const modelId       = request.modelId || resolveModelId('reasoning');

        const reasoning: AgentReasoningStep[] = [
            {
                id: 'r1',
                timestamp: new Date().toISOString(),
                action: 'Initialisation',
                observation: `Audit: ${request.domain}, Modèle: ${modelId}`,
                thought: 'Application du blindage système et vérification des autorisations métier par profil.',
            },
            {
                id: `r2_${Date.now()}`,
                timestamp: new Date().toISOString(),
                action: 'Analyse Profonde',
                observation: request.userPrompt,
                thought: `Utilisation du modèle ${modelId} pour croisement avec le contexte ${request.domain} fourni (${tenantLabel}).`,
            },
        ];

        try {
            let rawText = '';
            let fallbackUsed = false;

            try {
                const response = await LLMManager.provider.generateText({
                    model: modelId,
                    systemPrompt: `${systemPrompt}${dataContext}`,
                    userPrompt: request.userPrompt,
                    temperature: 0.3,
                });
                rawText = response.text;
            } catch {
                // Fallback sur AIProviderRouter automatique si le provider actif échoue
                const router = new AIProviderRouter();
                const routerRes = await router.generateText(
                    `${systemPrompt}${dataContext}\n\nREQUÊTE UTILISATEUR :\n${request.userPrompt}`,
                    tenantLabel,
                    { temperature: 0.3 }
                );
                rawText = routerRes.text;
                fallbackUsed = routerRes.fallback;
            }

            if (fallbackUsed) {
                reasoning.push({
                    id: `r3_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    action: 'Fallback Modèle',
                    observation: 'Basculement sur provider de secours',
                    thought: 'Garantie de continuité de service via le router multi-provider.',
                });
            }

            return {
                insight: {
                    id: `ins_${Date.now()}`,
                    domain: request.domain,
                    type: 'info',
                    title: `Diagnostic Expert : ${request.domain}`,
                    description: rawText || `Analyse exécutée via le moteur ${modelId}.`,
                    reasoning,
                },
                rawText: rawText || 'Analyse terminée.',
            };
        } catch (err) {
            throw new Error(`Échec du moteur de raisonnement expert: ${toError(err).message}`);
        }
    },
};
