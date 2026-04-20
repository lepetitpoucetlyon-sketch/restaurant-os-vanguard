/**
 * MARKETING & REPUTATION TYPES
 */

export interface PromoCode {
    id: string;
    code: string;
    type: 'fixed' | 'percentage' | 'bogo';
    value: number;
    minOrderAmountInCents?: number;
    maxDiscountInCents?: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    currentUsage: number;
    isActive: boolean;
}

export interface MarketingCampaign {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'social';
    status: 'planned' | 'active' | 'completed';
    budgetInCents: number;
    spentInCents: number;
    targetSegment: string;
    startsAt: string;
    endsAt: string;
}

export interface CRMFeedback {
    id: string;
    crmId: string;
    crmName: string;
    rating: number; // 1-5
    comment: string;
    source: 'in-app' | 'google' | 'qr-code';
    tags: string[];
    responded: boolean;
    createdAt: string;
}

export interface ReputationSummary {
    averageRating: number;
    totalFeedbacks: number;
    sentimentScore: number; // 0-100
    topThemes: string[];
}

export interface SocialAccount {
    id: string;
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'google';
    username: string;
    connectedAt: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    isActive: boolean;
}
