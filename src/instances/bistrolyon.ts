import type { TenantConfig } from '@nexus/contracts';

export const bistrolyonConfig: TenantConfig = {
    id: 'bistrolyon',
    name: 'Bistro de Lyon (Fictif)',
    tier: 'CLIENT',
    billing: {
        status: 'active',
        plan: 'professional',
        usageLimits: {
            aiRequests: 3000,
            transactions: 10000,
        },
        usageCurrent: {
            aiRequests: 450,
            transactions: 2310,
        },
    },
    marketplace: {
        enabledModules: ['HACCP_GUARD', 'KITCHEN_PLUS'],
    },
    features: {
        haccpGuardEnabled: true,
        plateAuditEnabled: true,
        allowSupportAccess: true,
    },
    firebase: {
        projectId: 'kitchen-os-bistrolyon',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_BISTROLYON || '',
        storageBucket: 'kitchen-os-bistrolyon.appspot.com',
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_BISTROLYON || '',
        authDomain: 'kitchen-os-bistrolyon.firebaseapp.com',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_BISTROLYON || '',
    },
    ai: {
        enabled: true,
        // Les clés API sont exclusivement gérées côté serveur (Node.js) pour éviter toute fuite
        llmApiKey: process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || '',
    }
};
