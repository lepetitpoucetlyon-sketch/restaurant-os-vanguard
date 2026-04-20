import { atom, type PrimitiveAtom } from 'jotai';
import { createProxyDomain } from './nexusNodeFactory';
import { MarketingCampaign, CustomerFeedback } from '@/types/marketing.types';
import { Quote } from '@/types/quotes.types';
import { SEOProfile } from '@/types/seo.types';
import { Customer } from '@/types/reservations.types';

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

// --- 📢 MARKETING & CRM DOMAIN (SEO, Campagnes, Réseaux sociaux, Clients) ---


export const seoProfileAtom = atom<SEOProfile | null>(null);



const _marketingCampaigns = createProxyDomain<MarketingCampaign>('marketingCampaigns');
export const marketingCampaignsNodeAtom = _marketingCampaigns.node;
export const marketingCampaignsAtom = _marketingCampaigns.data;

const _socialAccounts = createProxyDomain<Record<string, unknown>>('socialAccounts');
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

// CRM - Use centralized customer type from reservations.types
const _customers = createProxyDomain<Customer>('customers');
export const customersNodeAtom = _customers.node;
export const customersAtom = _customers.data;
export const customersLoadingAtom = _customers.loading;
export const selectedCustomerAtom = atom<Customer | null>(null);

// --- 🛰️ SYNC & TELEMETRY ---
export const isMarketingSyncingAtom = atom(false);

// SEO LOADING
export const seoLoadingAtom = atom((get) => get(_marketingCampaigns.node).loading || get(_scheduledPosts.node).loading);
