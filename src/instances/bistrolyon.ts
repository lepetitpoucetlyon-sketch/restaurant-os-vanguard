import type { TenantConfig } from '@/types';

export const bistrolyonConfig: TenantConfig = {
    id: 'bistrolyon',
    name: 'Bistro de Lyon (Fictif)',
    tier: 'pro',
    billing: {
        status: 'active',
        monthlyFee: 149,
        currency: 'EUR',
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
        geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    }
};
