// @ts-nocheck
export type ClientCategory = 'individual' | 'business' | 'vip' | 'press' | 'influencer';
export type ClientSegment = 'new' | 'regular' | 'loyal' | 'lost';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ClientSettings {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    gender?: 'male' | 'female' | 'other';
    birthDate?: string;
    email: string;
    secondaryEmails?: string[];
    phone: string;
    secondaryPhone?: string;
    address?: string;
    company?: string;
    position?: string;
    vatNumber?: string;
    category: ClientCategory;
    segment: ClientSegment;
    loyaltyPoints?: number;
    loyaltyTier?: LoyaltyTier;
    foodPreferences?: string[];
    allergies?: string[];
    diets?: string[];
    preferredTable?: string;
    preferredZone?: string;
    preferredServer?: string;
    favoriteDishes?: string[];
    favoriteDrinks?: string[];
    usualOccasion?: string;
    avgSpend?: number;
    visitFrequency?: string;
    firstVisitDate?: string;
    lastVisitDate?: string;
    totalVisits?: number;
    totalRevenue?: number;
    relationshipNotes?: string;
    marketingConsent: { email: boolean; sms: boolean; postal: boolean };
    consentDate?: string;
    acquisitionSource?: string;
    customTags?: string[];
    isActive: boolean;
    deletionRequested?: boolean;
}

export interface LoyaltyProgram {
    id: string;
    name: string;
    pointsPerEuro: number;
    euroPerPoint: number;
    tiers: { name: string; minPoints: number; benefits: string[]; color: string }[];
    rewards: { name: string; pointsCost: number; description: string }[];
    pointsValidityDays: number;
    signupBonus: number;
    referralRewardReferrer: number;
    referralRewardReferee: number;
}
