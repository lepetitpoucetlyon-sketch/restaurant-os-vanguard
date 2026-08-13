import type { MerchantIdentity } from '@nexus/contracts';

export interface FirebaseInstanceConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

export interface AIInstanceConfig {
    llmApiKey: string;
}

export interface WhiteLabelInstanceConfig {
    appName: string;
    appTagline: string;
    appDescription: string;
    supportEmail: string;
    supportPhone: string;
    defaultDomain: string;
    version: string;
    primaryColor: string;
    secondaryColor: string;
    firebase: FirebaseInstanceConfig;
    ai: AIInstanceConfig;
    identityDefaults: MerchantIdentity;
}

export type AppMode = 'tenant' | 'mcc';

export const APP_MODE: AppMode = (process.env.NEXT_PUBLIC_APP_MODE as AppMode) || 'tenant';

export const isMCCMode = () => APP_MODE === 'mcc';
export const isTenantMode = () => APP_MODE === 'tenant';

const defaultProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kitchen-os-gastro';

export const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'lepetitpoucet';

/**
 * Resolves the current instance configuration (STATIC FALLBACK)
 * Real dynamic switching is now handled by FleetContext (Digital Twin engine)
 */
export async function getDynamicInstanceConfig(): Promise<WhiteLabelInstanceConfig> {
    // Return static config for now to support 'output: export'
    // Dynamic profiles are injected via FleetProvider
    return whiteLabelInstanceConfig;
}

export const whiteLabelInstanceConfig: WhiteLabelInstanceConfig = {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Restaurant OS',
    appTagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Premium Intelligence',
    appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'The next generation operating system for modern restaurants',
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'contact@restaurant-os.app',
    supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+33 1 23 45 67 89',
    defaultDomain: process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'restaurant-os-web.web.app',
    version: '1.0.0',
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#C5A059',
    secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#1C1C1C',
    firebase: {
        projectId: defaultProjectId,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${defaultProjectId}.firebasestorage.app`,
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${defaultProjectId}.firebaseapp.com`,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    },
    ai: {
        llmApiKey: process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || '',
    },
    identityDefaults: {
        id: 'main',
        name: process.env.NEXT_PUBLIC_RESTAURANT_NAME || process.env.NEXT_PUBLIC_APP_NAME || 'Mon Restaurant',
        logo: process.env.NEXT_PUBLIC_RESTAURANT_LOGO || '',
        slogan: process.env.NEXT_PUBLIC_RESTAURANT_SLOGAN || '',
        businessType: process.env.NEXT_PUBLIC_BUSINESS_TYPE || process.env.NEXT_PUBLIC_RESTAURANT_CUISINE || 'Française',
        category: process.env.NEXT_PUBLIC_BUSINESS_CATEGORY || process.env.NEXT_PUBLIC_RESTAURANT_CATEGORY || '',
        shortDescription: process.env.NEXT_PUBLIC_RESTAURANT_SHORT_DESCRIPTION || '',
        longDescription: process.env.NEXT_PUBLIC_RESTAURANT_LONG_DESCRIPTION || '',
        headChef: process.env.NEXT_PUBLIC_RESTAURANT_HEAD_CHEF || '',
        owner: process.env.NEXT_PUBLIC_RESTAURANT_OWNER || '',
    },
};

export function getInstanceDisplayName(): string {
    return whiteLabelInstanceConfig.identityDefaults.name || whiteLabelInstanceConfig.appName;
}

export function getInstanceDomain(): string {
    return whiteLabelInstanceConfig.defaultDomain.replace(/^https?:\/\//, '');
}

export function getDefaultRestaurantEmail(localPart = 'contact'): string {
    return `${localPart}@${getInstanceDomain()}`;
}

export function getDefaultStaffEmail(name?: string | null): string {
    const fallbackLocalPart = 'staff';
    const localPart = (name || fallbackLocalPart)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        || fallbackLocalPart;

    return getDefaultRestaurantEmail(localPart);
}
