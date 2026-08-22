"use client";

import { useAtomValue } from "jotai";
import { quotesNodeAtom } from "@/store/pillars/commerce";
import { useVisibilityPurge } from "@/shared/hooks/useVisibilityPurge";
import { useSovereignCollection } from "@/kernel/hooks/useSovereignCollection";
import type { Quote } from "@nexus/contracts";

export function useQuotes() {
    useVisibilityPurge('quotes');
    const node = useAtomValue(quotesNodeAtom);
    const { set: createQuote, delete: deleteQuote } = useSovereignCollection<Quote>('quotes');
    return { 
        data: node.data || [], 
        quotes: node.data || [],
        isLoading: node.loading, 
        error: node.error,
        createQuote,
        deleteQuote,
    };
}
