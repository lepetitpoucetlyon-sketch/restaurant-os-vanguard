// @ts-nocheck
"use client";

import { useAtomValue } from "jotai";
import { groupsNodeAtom } from "@/store/operationalAtoms";

/**
 * 👥 useGroups - Grade VI Atomic Bridge
 * Orchestration des évènements de groupe et de la facturation collective.
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
