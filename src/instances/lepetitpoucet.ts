import type { TenantConfig } from '@/shared/nexus-contract';
import { AI_MODELS } from '@/modules/intelligence/ai';

/**
 * 🏰 LE PETIT POUCET (LYON) - CONFIGURATION GRADE X
 * Instance-as-a-Code : Isolation Totale & Module Rôtisserie Activé.
 */
export const lepetitpoucetConfig: TenantConfig = {
    id: 'lepetitpoucet',
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
            modelId: AI_MODELS.fast,
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
