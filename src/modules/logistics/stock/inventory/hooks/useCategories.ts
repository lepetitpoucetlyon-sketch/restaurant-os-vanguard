"use client";

import { useAtomValue } from "jotai";
import { categoriesNodeAtom } from "@/bootstrap/store/pillars/logistics";

export function useCategories() {
    const node = useAtomValue(categoriesNodeAtom);
    return { 
        data: node.data || [], 
        isLoading: node.loading, 
        error: node.error 
    };
}
