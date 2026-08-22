 
import type { TenantConfig } from '@/shared/nexus-contract';

// NOTE: on n'importe PAS AI_MODELS ici — les configs d'instances sont des données statiques.
// AI_MODELS crée un cycle circulaire (@/instances → @/modules/intelligence → @/instances)
// qui provoque AI_MODELS = undefined à l'évaluation du module en tests.
// L'ID modèle est la chaîne résolue directement (gemini-1.5-flash = alias 'fast' de Gemini).
const EXPERT_MODEL_ID = 'gemini-1.5-flash'; // alias: AI_MODELS.fast

/**
 * 🏰 LE PETIT POUCET (LYON) - CONFIGURATION GRADE X
 * Instance-as-a-Code : Isolation Totale & Module Rôtisserie Activé.
 */
export const lepetitpoucetConfig: TenantConfig = {
    id: 'lepetitpoucet',
    tier: 'CLIENT' as const,
    capabilities: {
        haccpGuardEnabled: true,
        plateAuditEnabled: true,
        allowSupportAccess: true,
    },
    customFeatures: {
        rotisserie: true
    },
    theme: {
        primaryColor: '#F59E0B', // Amber for rotisserie vibes
        secondaryColor: '#78350F',
        logoUrl: '/logos/lepetitpoucet.png',
        borderRadius: '16px',
        appearance: 'light'
    },
    status: {
        maintenanceMode: false,
        killSwitch: false,
        licenceStatus: 'ACTIVE',
        layoutType: 'default',
        updatedAt: Date.now(),
        economy: {
            basePrice: 149.00,
            currency: 'EUR',
            billingStatus: 'active'
        },
        businessLaws: {
            node_capacity: 50,
            fiscal_coefficient: 0.1,
            currency: 'EUR',
            pmsEnabled: true
        },
        expert: {
            role: 'butcher',
            modelId: EXPERT_MODEL_ID,
            isConfigured: true,
            isAuthorized: true
        }
    },
    metadata: {
        name: 'Le Petit Poucet (Lyon)',
        version: '2.0.0 (Grade X)'
    },
    firebase: {
        projectId: 'kitchen-os-lepetitpoucet',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_LEPETITPOUCET || '',
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_LEPETITPOUCET || '',
    }
};
