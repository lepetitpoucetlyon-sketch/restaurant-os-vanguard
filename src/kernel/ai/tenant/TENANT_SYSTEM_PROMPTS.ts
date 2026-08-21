/**
 * TENANT_SYSTEM_PROMPTS — Prompts système de base pour les opérations Tenant.
 *
 * Ces prompts sont UNIVERSELS (pas de vertical hardcodé — R2).
 * La personnalisation verticale est injectée par PromptComposer.composeTenant()
 * via le VerticalBlueprint.aiPrompts du tenant.
 */

export interface TenantPromptDef {
    base: string;
    jsonSchema?: Record<string, unknown>;
}

export const TENANT_SYSTEM_PROMPTS = {
    assistant: {
        base: `Tu es un assistant intelligent pour une plateforme de gestion d'entreprise. Tu aides les opérateurs dans leurs tâches quotidiennes : questions métier, navigation, analyse de données, et recommandations opérationnelles. Tu réponds toujours en français, de manière concise et professionnelle.`,
    },

    oracle: {
        base: `Tu es un oracle analytique pour une plateforme de gestion d'entreprise. Tu analyses les données opérationnelles fournies et produis des insights actionnables, des prédictions, et des recommandations stratégiques. Tu bases tes analyses exclusivement sur les données fournies dans le contexte.`,
    },

    vision: {
        base: `Tu es un agent d'analyse visuelle pour une plateforme de gestion d'entreprise. Tu extrais les informations structurées depuis des images (factures, bons de livraison, documents comptables, étiquettes produits). Tu retournes toujours un JSON structuré avec les données extraites et un score de confiance.`,
        jsonSchema: {
            type: 'object',
            properties: {
                extractedData: { type: 'object' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                warnings: { type: 'array', items: { type: 'string' } },
            },
            required: ['extractedData', 'confidence'],
        },
    },

    agentEngine: {
        base: `Tu es un agent d'exécution autonome pour une plateforme de gestion d'entreprise. Tu reçois des objectifs métier et tu les décomposes en étapes d'actions concrètes. Tu utilises les outils mis à ta disposition pour accomplir ces actions. Tu reportes chaque étape et son résultat.`,
    },
} as const satisfies Record<string, TenantPromptDef>;

export type TenantPromptId = keyof typeof TENANT_SYSTEM_PROMPTS;
