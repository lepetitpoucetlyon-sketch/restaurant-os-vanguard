import { atom, type PrimitiveAtom } from 'jotai';
import { createProxyDomain } from '@/store/nexusNodeFactory';
import { MarketingCampaign, CRMFeedback } from '@/types/marketing.types';
import { Quote } from '@/types/quotes.types';
import { SEOProfile } from '@/types/seo.types';
import { CRM } from '@/types/reservations.types';

// --- 📢 INDUSTRIAL TYPES (V3 - Agnostic) ---
export interface MarketingSegment {
    id: string;
    name: string;
    description: string;
    criteria: Record<string, string>;
    estimatedSize: number;
    color: string;
}

export interface ScheduledPost {
    id: string;
    caption: string;
    platforms: string[];
    scheduledDate: string;
    scheduledTime: string;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    imageUrl?: string;
}

export interface SocialAccount {
    id: string;
    platform: 'Instagram' | 'Facebook' | 'Twitter' | 'LinkedIn' | string;
    username: string;
    avatarUrl?: string;
    followersCount?: number;
    isConnected: boolean;
    lastSyncedAt?: string;
}

// --- 📢 MARKETING & CRM DOMAIN (SEO, Campagnes, Réseaux sociaux, Clients) ---


export const seoProfileAtom = atom<SEOProfile | null>(null);



const _marketingCampaigns = createProxyDomain<MarketingCampaign>('marketingCampaigns');
export const marketingCampaignsNodeAtom = _marketingCampaigns.node;
export const marketingCampaignsAtom = _marketingCampaigns.data;

const _socialAccounts = createProxyDomain<SocialAccount>('socialAccounts');
export const socialAccountsNodeAtom = _socialAccounts.node;
export const socialAccountsAtom = _socialAccounts.data;

const _quotes = createProxyDomain<Quote>('quotes');
export const quotesNodeAtom = _quotes.node;
export const quotesAtom = _quotes.data;
export const quotesLoadingAtom = _quotes.loading;

const _marketingSegments = createProxyDomain<MarketingSegment>('marketingSegments');
export const marketingSegmentsNodeAtom = _marketingSegments.node;
export const marketingSegmentsAtom = _marketingSegments.data;
export const marketingSegmentsLoadingAtom = _marketingSegments.loading;

const _scheduledPosts = createProxyDomain<ScheduledPost>('scheduledPosts');
export const scheduledPostsNodeAtom = _scheduledPosts.node;
export const scheduledPostsAtom = _scheduledPosts.data;
export const scheduledPostsLoadingAtom = _scheduledPosts.loading;

// CRM - Use centralized crm type from reservations.types
const _crms = createProxyDomain<CRM>('crms');
export const crmsNodeAtom = _crms.node;
export const crmsAtom = _crms.data;
export const crmsLoadingAtom = _crms.loading;
export const selectedCRMAtom = atom<CRM | null>(null);

// --- 🛰️ SYNC & TELEMETRY ---
export const isMarketingSyncingAtom = atom(false);

// SEO LOADING
export const seoLoadingAtom = atom((get) => get(_marketingCampaigns.node).loading || get(_scheduledPosts.node).loading);
