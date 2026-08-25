"use client";

import { useAtomValue } from "jotai";
import { marketingCampaignsNodeAtom, socialAccountsNodeAtom, seoProfileAtom } from "@/store/pillars/commerce";
import { useVisibilityPurge } from "@/shared/hooks/useVisibilityPurge";
import { useSovereignCollection } from "@/kernel/hooks/useSovereignCollection";
import { useTenant } from "@/shared/hooks";
import type { Campaign } from "@nexus/contracts";

export interface MarketingPost {
    id?: string;
    caption: string;
    platforms: string[];
    scheduledDate: string;
    scheduledTime: string;
    status: string;
}

/**
 * 📣 useMarketing - Marketing Connector
 * Simple interface for marketing campaigns and SEO profile.
 */
export function useMarketing() {
    useVisibilityPurge('marketingCampaigns');
    const { activeTenantId } = useTenant();
    const campaigns = useAtomValue(marketingCampaignsNodeAtom);
    const social = useAtomValue(socialAccountsNodeAtom);
    const seo = useAtomValue(seoProfileAtom);

    const { set: upsertCampaign, delete: deleteCampaign } = useSovereignCollection<Campaign>('marketingCampaigns', { tenantId: activeTenantId ?? undefined });
    const { set: upsertPostRaw, delete: deletePost } = useSovereignCollection<MarketingPost & { id: string }>('marketingPosts', { tenantId: activeTenantId ?? undefined });

    const upsertPost = async (post: Partial<MarketingPost>) => {
        const fullPost: MarketingPost & { id: string } = {
            id: post.id || `post_${Date.now()}`,
            caption: post.caption || '',
            platforms: post.platforms || [],
            scheduledDate: post.scheduledDate || '',
            scheduledTime: post.scheduledTime || '',
            status: post.status || 'draft',
        };
        await upsertPostRaw(fullPost);
    };

    return { 
        campaigns: campaigns.data || [], 
        profile: seo, 
        socialAccounts: social.data || [], 
        isLoading: campaigns.loading || social.loading,
        error: campaigns.error || social.error,
        upsertCampaign,
        deleteCampaign,
        upsertPost,
        deletePost,
    };
}
