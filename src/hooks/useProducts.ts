// @ts-nocheck
"use client";

import { useAtomValue } from "jotai";
import { productsNodeAtom } from "@/store/operationalAtoms";

export function useProducts() {
    const node = useAtomValue(productsNodeAtom);
    return { 
        data: node.data || [], 
        isLoading: node.loading, 
        error: node.error 
    };
}
