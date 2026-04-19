"use client";

import { useAtomValue } from "jotai";
import { marketingCampaignsNodeAtom, socialAccountsNodeAtom, seoProfileAtom } from "@/store/operationalAtoms";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";

/**
 * 📣 useMarketing - Grade VI Atomic Bridge
 * Orchestration de la présence numérique et de l'acquisition client.
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
