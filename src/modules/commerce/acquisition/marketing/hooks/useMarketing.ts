"use client";

import { useAtomValue } from "jotai";
import { marketingCampaignsNodeAtom, socialAccountsNodeAtom, seoProfileAtom } from "@/bootstrap/store/pillars/commerce";
import { useVisibilityPurge } from "@/shared/hooks/useVisibilityPurge";

/**
 * 📣 useMarketing - Marketing Connector
 * Simple interface for marketing campaigns and SEO profile.
 */
export function useMarketing() {
    useVisibilityPurge('marketingCampaigns');
    const campaigns = useAtomValue(marketingCampaignsNodeAtom);
    const social = useAtomValue(socialAccountsNodeAtom);
    const seo = useAtomValue(seoProfileAtom);

    return { 
        campaigns: campaigns.data || [], 
        profile: seo, 
        socialAccounts: social.data || [], 
        isLoading: campaigns.loading || social.loading,
        error: campaigns.error || social.error
    };
}
