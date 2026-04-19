import { useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { AgentDomain, AgentRole, AgentResponse } from '@/domain/agency/types';
import { AgentEngine } from '@/lib/ai/AgentEngine';

/**
 * useExpert - Le hook standard pour consommer l'expertise système.
 * Gère automatiquement les rôles (RBAC), les permissions granulaires et le modèle sélectionné.
 */
export function useExpert(domain: AgentDomain) {
    const { currentUser } = useAuth();
    const { settings } = useSettings();

    const userRole = (currentUser?.role as AgentRole) || 'commis';
    const slmConfig = settings.slmConfig;
    
    // Rôle Power Hierarchy
    const rolePower: Record<AgentRole, number> = {
        'admin': 3,
        'manager': 2,
        'staff': 1,
        'commis': 0
    };

    // Configuration de l'expert spécifique
    const expertConfig = slmConfig?.experts?.find(e => e.domain === domain);
    
    const isEnabled = expertConfig?.enabled ?? false;
    const isAuthorized = rolePower[userRole] >= rolePower[(expertConfig?.minRole as AgentRole) || 'admin'];
    const modelId = expertConfig?.modelId || slmConfig?.modelId || 'gemini-1.5-flash';

    const queryExpert = useCallback(async (prompt: string, contextData?: any): Promise<AgentResponse> => {
        if (!slmConfig?.apiKey || !slmConfig?.endpoint) {
            throw new Error('Erreur Système : Services d\'expertise non configurés.');
        }

        if (!isEnabled || !isAuthorized) {
            throw new Error('Accès Refusé : Vous n\'avez pas les permissions pour cet expert.');
        }

        return AgentEngine.query({
            domain,
            userRole,
            userPrompt: prompt,
            contextData,
            apiKey: slmConfig.apiKey,
            endpoint: slmConfig.endpoint,
            modelId: modelId // Pass precise model
        });
    }, [domain, userRole, slmConfig, isEnabled, isAuthorized, modelId]);

    return useMemo(() => ({
        queryExpert,
        role: userRole,
        isConfigured: !!(slmConfig?.apiKey && slmConfig?.endpoint),
        isAuthorized: isEnabled && isAuthorized,
        modelId
    }), [queryExpert, userRole, slmConfig, isEnabled, isAuthorized, modelId]);
}

