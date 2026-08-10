"use client";

import { useAtomValue } from "jotai";
import { productsNodeAtom } from "@/store/pillars/logistics";

export function useProducts() {
    const node = useAtomValue(productsNodeAtom);
    return { 
        data: node.data || [], 
        isLoading: node.loading, 
        error: node.error 
    };
}
