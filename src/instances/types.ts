export interface TenantFirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

export interface TenantConfig {
    id: string; // e.g. 'lepetitpoucet'
    name: string; // e.g. 'Le Petit Poucet'
    firebase: TenantFirebaseConfig;
    ai: {
        geminiApiKey: string;
    };
    billingStatus: 'active' | 'suspended' | 'grace_period';
    features: {
        haccpGuardEnabled: boolean;
        plateAuditEnabled: boolean;
        allowSupportAccess: boolean; // Flag for Neural Shield encryption
    };
    branding?: {
        logoUrl?: string;
        description?: string;
        primaryFont?: string;
    };
}
