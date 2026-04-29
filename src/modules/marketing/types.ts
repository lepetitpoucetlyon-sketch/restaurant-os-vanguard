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
    status: 'planned' | 'active' | 'completed' | 'draft' | 'scheduled';
    budgetInCents: number;
    spentInCents: number;
    targetSegment: string;
    audience?: string;
    audienceSize?: number;
    subject?: string;
    startsAt: string;
    endsAt: string;
    sent?: number;
    opened?: number;
    clicked?: number;
    metrics?: {
        sent: number;
        opened: number;
        clicked: number;
        conversions: number;
    };
    createdAt?: string;
    updatedAt?: string;
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
    handle: string;
    username: string;
    followers: number;
    posts: number;
    engagement: number;
    trend: string;
    gradient: string;
    icon?: any;
    connectedAt: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    isActive: boolean;
}

export type QuoteLine = import('./quotes.types').QuoteLine;
export type QuoteLineType = import('./quotes.types').QuoteLineType;
export type CustomerFeedback = CRMFeedback;
