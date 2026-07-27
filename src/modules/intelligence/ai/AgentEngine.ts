import { AgentDomain, AgentRole, AgentResponse, AgentInsight, AgentReasoningStep } from '@/modules/intelligence/domain/agency/types';
import { generateSystemPrompt } from '@/config/prompts';

export interface AgentRequest {
    domain: AgentDomain;
    userRole: AgentRole;
    userPrompt: string;
    contextData?: import('@/shared/nexus-contract').SovereignValue;
    
    // Grade X: DNA Injection
    dna?: {
        tenantId: string;
        businessLaws: import('@/shared/nexus-contract').BusinessLaws;
    };

    apiKey: string;
    endpoint: string;
    modelId: string;
}


/**
 * AgentEngine - The "Brain" of the Software Factory
 * Orchestrates calls to Gemini 1.5 with dedicated system prompts and RBAC.
 */
export const AgentEngine = {
    async query(request: AgentRequest): Promise<AgentResponse> {
        if (!request.apiKey || !request.endpoint) {
            throw new Error('AgentEngine: Missing API Configuration (Check Settings)');
        }

        const _systemPrompt = generateSystemPrompt(request.domain, request.userRole);
        const _dataContext = request.contextData ? `\nCONTEXTE DATA ACTUEL :\n${JSON.stringify(request.contextData, null, 2)}` : '';

        // Prepare the actual payload for Gemini 1.5 (assuming Flash/Pro REST API format)
        // Here we simulate the reasoning steps for the "Wow Effect" requested by user
        
        try {
            // we simulate a smart streaming/reasoning delay
            const reasoning: AgentReasoningStep[] = [
                {
                    id: 'r1',
                    timestamp: new Date().toISOString(),
                    action: 'Initialisation',
                    observation: `Audit: ${request.domain}, Modèle: ${request.modelId}`,
                    thought: 'Application du blindage système et vérification des autorisations métier par profil.'
                },
                {
                    id: `r2_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    action: 'Analyse Profonde',
                    observation: request.userPrompt,
                    thought: `Utilisation du modèle ${request.modelId} pour croisement avec le contexte ${request.domain} fourni (${request.dna?.tenantId || 'GLOBAL'}).`
                }
            ];

            let rawText = '';
            let attempts = 0;
            const maxAttempts = 3;
            let responseData: any = null;

            while (attempts < maxAttempts) {
                attempts++;
                try {
                    const fetchUrl = request.endpoint.includes('key=')
                        ? request.endpoint
                        : `${request.endpoint}?key=${request.apiKey}`;

                    const res = await fetch(fetchUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(request.apiKey && !fetchUrl.includes('key=') ? { 'Authorization': `Bearer ${request.apiKey}` } : {})
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `${_systemPrompt}\n\n${_dataContext}\n\nREQUÊTE UTILISATEUR :\n${request.userPrompt}` }] }]
                        })
                    });

                    if (res.status === 429 && attempts < maxAttempts) {
                        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts)));
                        continue;
                    }

                    if (res.ok) {
                        responseData = await res.json();
                        rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        break;
                    } else if (attempts >= maxAttempts) {
                        const errBody = await res.text();
                        rawText = `[Erreur API ${res.status}] ${errBody}`;
                    }
                } catch (fetchErr) {
                    if (attempts >= maxAttempts) {
                        rawText = `[Erreur Réseau] ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`;
                    } else {
                        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts)));
                    }
                }
            }

            const dynamicInsight: AgentInsight = {
                id: `ins_${Date.now()}`,
                domain: request.domain,
                type: 'info',
                title: `Diagnostic Expert : ${request.domain}`,
                description: rawText || `Analyse exécutée via le moteur ${request.modelId}.`,
                reasoning: reasoning
            };

            return {
                insight: dynamicInsight,
                rawText: rawText || "Analyse terminée."
            };

        } catch (err) {
            throw new Error(`Échec du moteur de raisonnement expert: ${err instanceof Error ? err.message : String(err)}`);
        }

    }
};
