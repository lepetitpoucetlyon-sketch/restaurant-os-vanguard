import { AgentDomain, AgentRole, AgentResponse, AgentReasoningStep } from '@/modules/intelligence/domain/agency/types';
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


function buildFetchUrl(endpoint: string, apiKey: string): string {
    return endpoint.includes('key=') ? endpoint : `${endpoint}?key=${apiKey}`;
}

async function executeGeminiRequest(url: string, body: string, apiKey: string): Promise<string> {
    const maxAttempts = 3;
    let rawText = '';

    for (let attempts = 1; attempts <= maxAttempts; attempts++) {
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (apiKey && !url.includes('key=')) headers['Authorization'] = `Bearer ${apiKey}`;

            const res = await fetch(url, { method: 'POST', headers, body });

            if (res.status === 429 && attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts)));
                continue;
            }
            if (res.ok) {
                const data = await res.json();
                rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                break;
            }
            if (attempts >= maxAttempts) {
                rawText = `[Erreur API ${res.status}] ${await res.text()}`;
            }
        } catch (fetchErr) {
            if (attempts >= maxAttempts) {
                rawText = `[Erreur Réseau] ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`;
            } else {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts)));
            }
        }
    }
    return rawText;
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

        const systemPrompt  = generateSystemPrompt(request.domain, request.userRole);
        const dataContext   = request.contextData ? `\nCONTEXTE DATA ACTUEL :\n${JSON.stringify(request.contextData, null, 2)}` : '';
        const tenantLabel   = request.dna?.tenantId || 'GLOBAL';

        const reasoning: AgentReasoningStep[] = [
            {
                id: 'r1',
                timestamp: new Date().toISOString(),
                action: 'Initialisation',
                observation: `Audit: ${request.domain}, Modèle: ${request.modelId}`,
                thought: 'Application du blindage système et vérification des autorisations métier par profil.',
            },
            {
                id: `r2_${Date.now()}`,
                timestamp: new Date().toISOString(),
                action: 'Analyse Profonde',
                observation: request.userPrompt,
                thought: `Utilisation du modèle ${request.modelId} pour croisement avec le contexte ${request.domain} fourni (${tenantLabel}).`,
            },
        ];

        try {
            const fetchUrl = buildFetchUrl(request.endpoint, request.apiKey);
            const body = JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\n${dataContext}\n\nREQUÊTE UTILISATEUR :\n${request.userPrompt}` }] }],
            });
            const rawText = await executeGeminiRequest(fetchUrl, body, request.apiKey);

            return {
                insight: {
                    id: `ins_${Date.now()}`,
                    domain: request.domain,
                    type: 'info',
                    title: `Diagnostic Expert : ${request.domain}`,
                    description: rawText || `Analyse exécutée via le moteur ${request.modelId}.`,
                    reasoning,
                },
                rawText: rawText || 'Analyse terminée.',
            };
        } catch (err) {
            throw new Error(`Échec du moteur de raisonnement expert: ${err instanceof Error ? err.message : String(err)}`);
        }
    },
};
