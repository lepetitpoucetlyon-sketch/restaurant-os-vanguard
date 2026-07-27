"use client";

import { useAtomValue } from "jotai";
import { quotesNodeAtom } from "@/store/pillars/commerce";
import { useVisibilityPurge } from "@/shared/hooks/useVisibilityPurge";

export function useQuotes() {
    useVisibilityPurge('quotes');
    const node = useAtomValue(quotesNodeAtom);
    return { 
        data: node.data || [], 
        quotes: node.data || [],
        isLoading: node.loading, 
        error: node.error 
    };
}
