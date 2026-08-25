"use client";

import { useAtomValue } from "jotai";
import { quotesNodeAtom } from "@/store/pillars/commerce";
import { useVisibilityPurge } from "@/shared/hooks/useVisibilityPurge";
import { useSovereignCollection } from "@/kernel/hooks/useSovereignCollection";
import { useTenant } from "@/shared/hooks";
import type { Quote } from "@nexus/contracts";

export function useQuotes() {
    useVisibilityPurge('quotes');
    const { activeTenantId } = useTenant();
    const node = useAtomValue(quotesNodeAtom);
    const { set: createQuote, delete: deleteQuote } = useSovereignCollection<Quote>('quotes', { tenantId: activeTenantId ?? undefined });
    return { 
        data: node.data || [], 
        quotes: node.data || [],
        isLoading: node.loading, 
        error: node.error,
        createQuote,
        deleteQuote,
    };
}
