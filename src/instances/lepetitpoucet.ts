import type { TenantConfig } from '@/types';

// En production, ces clés peuvent venir d'appels API ou de variables d'environnement gérées dynamiquement.
// Pour l'Instance-as-a-Code, on les fige ici pour l'isolation totale.
export const lepetitpoucetConfig: TenantConfig = {
    id: 'lepetitpoucet',
    name: 'Le Petit Poucet (Lyon)',
    billingStatus: 'active', // Permet de passer la SaaSBillingGate
    features: {
        haccpGuardEnabled: true,
        plateAuditEnabled: true,
        allowSupportAccess: true,
    },
    firebase: {
        projectId: 'kitchen-os-lepetitpoucet',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_LEPETITPOUCET || '',
        storageBucket: 'kitchen-os-lepetitpoucet.appspot.com',
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_LEPETITPOUCET || '',
        authDomain: 'kitchen-os-lepetitpoucet.firebaseapp.com',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_LEPETITPOUCET || '',
    },
    ai: {
        geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    }
};
