import type { TenantConfig } from '@/types';

export const urbanburgerConfig: any = {
    id: 'urbanburger',
    name: 'Urban Burger (Fictif)',
    tier: 'starter',
    billing: {
        status: 'active',
        monthlyFee: 49,
        currency: 'EUR',
        usageLimits: {
            aiRequests: 500,
            transactions: 5000,
        },
        usageCurrent: {
            aiRequests: 80,
            transactions: 1240,
        },
    },
    marketplace: {
        enabledModules: [],
    },
    features: {
        haccpGuardEnabled: false,
        plateAuditEnabled: false,
        allowSupportAccess: false,
    },
    firebase: {
        projectId: 'kitchen-os-urbanburger',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_URBANBURGER || '',
        storageBucket: 'kitchen-os-urbanburger.appspot.com',
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_URBANBURGER || '',
        authDomain: 'kitchen-os-urbanburger.firebaseapp.com',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_URBANBURGER || '',
    },
    ai: {
        geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    }
};
