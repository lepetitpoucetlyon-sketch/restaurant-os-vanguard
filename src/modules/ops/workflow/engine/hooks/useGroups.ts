"use client";

import { useAtomValue } from "jotai";
import { groupsNodeAtom } from "@/bootstrap/store/pillars/commerce";

/**
 * 👥 useGroups - Grade VI Atomic Mapper
 * Sovereign interface for group reservations (Internal Suture).
 */
export function useGroups() {
    const node = useAtomValue(groupsNodeAtom);
    
    return { 
        data: node.data || [], 
        groups: node.data || [],
        isLoading: node.loading, 
        error: node.error 
    };
}
