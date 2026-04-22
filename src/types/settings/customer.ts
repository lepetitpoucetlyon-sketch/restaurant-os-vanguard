/**
 * CUSTOMER & LOYALTY CONFIGURATION TYPES
 */

export interface LoyaltyProgram {
    id: string;
    name: string;
    type: 'points' | 'tiered' | 'cashback';
    pointsPerEuro: number;
    rewards: Array<{
        id: string;
        pointsRequired: number;
        description: string;
        discountValue?: number;
    }>;
    isActive: boolean;
}

export interface ClientCategory {
    id: string;
    name: string;
    color: string;
    discountRate?: number;
}

export interface ClientSettings {
    allowSelfRegistration: boolean;
    requireValidation: boolean;
    defaultCategory?: string;
    categories: ClientCategory[];
    mandatoryFields: string[];
    gdprConsentRequired: boolean;
}
