// @ts-nocheck
"use client";

import { useAtomValue } from "jotai";
import { categoriesNodeAtom } from "@/store/operationalAtoms";

export function useCategories() {
    const node = useAtomValue(categoriesNodeAtom);
    return { 
        data: node.data || [], 
        isLoading: node.loading, 
        error: node.error 
    };
}
